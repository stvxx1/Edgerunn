// Server-side support for the small "helper" text jobs (image prompt writer, story summariser):
// reading Gemini's quota errors, remembering which models are cooling down, and an optional local
// model (Ollama or LM Studio) that needs no API key and has no daily quota.

// ---- Gemini quota awareness ----------------------------------------------------------------

// 'credits' is a prepaid balance that has run out (HTTP 402), as opposed to a free-tier rate limit
export type QuotaKind = 'daily' | 'minute' | 'credits' | 'unknown';
export interface QuotaInfo {
  kind: QuotaKind;
  retryAfterSec?: number;
}

// A 429's message carries the quota id ("...PerDayPerProjectPerModel-FreeTier") and a retry delay
export const parseQuota = (err: any): QuotaInfo => {
  const text = String(err?.message ?? err ?? '');
  const kind: QuotaKind = /PerDay|per day|daily/i.test(text) ? 'daily' : /PerMinute|per minute/i.test(text) ? 'minute' : 'unknown';
  const m = text.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i) || text.match(/retry in (\d+(?:\.\d+)?)s/i);
  return { kind, retryAfterSec: m ? Math.ceil(parseFloat(m[1])) : undefined };
};

// Models that just said "quota exceeded" are skipped for a while instead of being asked again on
// every request. A daily limit is re-checked every 15 minutes (cheap, and it may have reset).
export class CooldownBook {
  private until = new Map<string, { at: number; info: QuotaInfo }>();

  mark(id: string, info: QuotaInfo, now = Date.now()) {
    const ms = info.kind === 'daily' || info.kind === 'credits' ? 15 * 60_000 : (info.retryAfterSec ?? 60) * 1000;
    this.until.set(id, { at: now + Math.max(ms, 5_000), info });
  }

  active(id: string, now = Date.now()): QuotaInfo | null {
    const entry = this.until.get(id);
    if (!entry) return null;
    if (now >= entry.at) {
      this.until.delete(id);
      return null;
    }
    return { kind: entry.info.kind, retryAfterSec: Math.ceil((entry.at - now) / 1000) };
  }
}

// The most informative summary of several quota hits: a daily limit beats a minute limit
export const worstQuota = (hits: QuotaInfo[]): QuotaInfo | null => {
  if (!hits.length) return null;
  const rank: Record<QuotaKind, number> = { daily: 4, credits: 3, minute: 2, unknown: 1 };
  const worst = hits.reduce((a, b) => (rank[b.kind] > rank[a.kind] ? b : a));
  const retry = hits.map(h => h.retryAfterSec).filter((n): n is number => typeof n === 'number');
  return { kind: worst.kind, retryAfterSec: retry.length ? Math.min(...retry) : undefined };
};

// ---- Optional local model --------------------------------------------------------------------

export interface LocalLLM {
  kind: 'ollama' | 'openai';
  base: string;
  model: string;
}

// Small instruct models first; embedding models can't chat
const PREFERRED = ['llama3.2', 'llama3.1', 'qwen2.5', 'qwen3', 'gemma3', 'gemma2', 'mistral', 'phi4', 'phi3', 'llama3'];
const NOT_CHAT = /embed|nomic|bge|minilm|rerank|whisper|clip|vision-only/i;

export const pickLocalModel = (names: string[], wanted?: string): string | null => {
  if (wanted) return names.find(n => n === wanted || n.startsWith(wanted)) || wanted;
  const chat = names.filter(n => !NOT_CHAT.test(n));
  if (!chat.length) return null;
  const rank = (n: string) => {
    const i = PREFERRED.findIndex(p => n.toLowerCase().startsWith(p));
    return i === -1 ? PREFERRED.length : i;
  };
  return [...chat].sort((a, b) => rank(a) - rank(b))[0];
};

const getJson = async (url: string, ms = 900) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<any>;
};

const normaliseBase = (url: string) => url.trim().replace(/\/+$/, '').replace(/\/v1$/, '');

let detected: { at: number; value: LocalLLM | null } | null = null;

// LOCAL_LLM_URL wins; otherwise look for Ollama (11434) then LM Studio (1234) on this machine.
// The answer is cached for 30s, so an unused local model costs nothing.
export const detectLocalLLM = async (): Promise<LocalLLM | null> => {
  if (detected && Date.now() - detected.at < 30_000) return detected.value;
  const wanted = process.env.LOCAL_LLM_MODEL?.trim() || undefined;
  const custom = process.env.LOCAL_LLM_URL?.trim();
  let value: LocalLLM | null = null;

  const tryOllama = async (base: string) => {
    const tags = await getJson(`${base}/api/tags`);
    const model = pickLocalModel((tags.models || []).map((m: any) => m.name), wanted);
    return model ? ({ kind: 'ollama', base, model } as LocalLLM) : null;
  };
  const tryOpenAI = async (base: string) => {
    const list = await getJson(`${base}/v1/models`);
    const model = pickLocalModel((list.data || []).map((m: any) => m.id), wanted);
    return model ? ({ kind: 'openai', base, model } as LocalLLM) : null;
  };

  try {
    if (custom) {
      const base = normaliseBase(custom);
      value = /:11434\b|ollama/i.test(base) ? await tryOllama(base) : await tryOpenAI(base);
    } else {
      value = await tryOllama('http://127.0.0.1:11434').catch(() => null);
      if (!value) value = await tryOpenAI('http://127.0.0.1:1234').catch(() => null);
    }
  } catch {
    value = null;
  }
  detected = { at: Date.now(), value };
  return value;
};

export const resetLocalLLMCache = () => {
  detected = null;
};

export const localChat = async (
  llm: LocalLLM,
  opts: { system: string; user: string; maxTokens?: number; temperature?: number; timeoutMs?: number }
): Promise<string> => {
  const messages = [
    ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
    { role: 'user', content: opts.user }
  ];
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 30_000);
  if (llm.kind === 'ollama') {
    const res = await fetch(`${llm.base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: llm.model,
        stream: false,
        keep_alive: '10m', // keep the model loaded between scenes
        messages,
        options: { temperature: opts.temperature ?? 0.4, num_predict: opts.maxTokens ?? 400 }
      })
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    return String((await res.json()).message?.content ?? '');
  }
  const res = await fetch(`${llm.base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ model: llm.model, messages, temperature: opts.temperature ?? 0.4, max_tokens: opts.maxTokens ?? 400 })
  });
  if (!res.ok) throw new Error(`Local LLM ${res.status}`);
  return String((await res.json()).choices?.[0]?.message?.content ?? '');
};
