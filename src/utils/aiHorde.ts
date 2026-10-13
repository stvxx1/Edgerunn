// AI Horde (aihorde.net) client — the crowdsourced Stable Diffusion network behind ArtBot.
// Server-side only: keeps the API key off the client and sidesteps CORS.
// Docs: https://aihorde.net/api/

const HORDE_BASE = 'https://aihorde.net/api/v2';
const ANON_KEY = '0000000000';
const CLIENT_AGENT = 'Edgerunn:1.0:github.com/stvxx1/edgerunn';

export interface HordeGenerateRequest {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  nsfw?: boolean;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  seed?: string;
}

export interface HordeJobStatus {
  id: string;
  done: boolean;
  faulted: boolean;
  isPossible: boolean;
  queuePosition: number;
  waitTime: number;
  processing: number;
  waiting: number;
  images: { url: string; seed: string; model: string; worker: string; censored: boolean }[];
}

export interface HordeModel {
  name: string;
  workers: number;
  queued: number;
  eta: number;
}

const getKey = () => process.env.AI_HORDE_API_KEY || ANON_KEY;

const hordeFetch = async (pathname: string, init: RequestInit = {}) => {
  const res = await fetch(`${HORDE_BASE}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Client-Agent': CLIENT_AGENT,
      apikey: getKey(),
      ...(init.headers || {})
    }
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(body?.message || `AI Horde request failed (${res.status})`);
    err.status = res.status;
    err.details = body?.errors;
    throw err;
  }
  return body;
};

// Snap to a multiple of 64, which every SD model expects.
const snap = (n: number, fallback: number) => {
  const v = Number.isFinite(n) ? n : fallback;
  return Math.min(1024, Math.max(256, Math.round(v / 64) * 64));
};

export const submitHordeJob = async (req: HordeGenerateRequest): Promise<{ id: string; kudos: number }> => {
  const negative = req.negativePrompt?.trim();
  const payload = {
    // Horde takes the negative prompt after a "###" separator.
    prompt: negative ? `${req.prompt.trim()} ### ${negative}` : req.prompt.trim(),
    params: {
      sampler_name: req.sampler || 'k_euler_a',
      cfg_scale: req.cfgScale ?? 7,
      width: snap(req.width ?? 512, 512),
      height: snap(req.height ?? 768, 768),
      steps: Math.min(50, Math.max(10, req.steps ?? 25)),
      karras: true,
      n: 1,
      ...(req.seed ? { seed: req.seed } : {})
    },
    nsfw: !!req.nsfw,
    censor_nsfw: !req.nsfw,
    models: req.model ? [req.model] : [],
    r2: true,
    shared: false,
    slow_workers: true,
    trusted_workers: false,
    replacement_filter: true
  };
  const body = await hordeFetch('/generate/async', { method: 'POST', body: JSON.stringify(payload) });
  return { id: body.id, kudos: body.kudos ?? 0 };
};

// Horde's R2 links expire, so pull the image down and hand the client a data URL it can keep.
const toDataUrl = async (img: string): Promise<string> => {
  if (!img.startsWith('http')) return `data:image/webp;base64,${img}`;
  const res = await fetch(img);
  if (!res.ok) throw new Error(`Failed to download generated image (${res.status})`);
  const type = res.headers.get('content-type') || 'image/webp';
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString('base64')}`;
};

export const checkHordeJob = async (id: string): Promise<HordeJobStatus> => {
  const safeId = encodeURIComponent(id);
  const check = await hordeFetch(`/generate/check/${safeId}`);
  const status: HordeJobStatus = {
    id,
    done: !!check.done,
    faulted: !!check.faulted,
    isPossible: check.is_possible !== false,
    queuePosition: check.queue_position ?? 0,
    waitTime: check.wait_time ?? 0,
    processing: check.processing ?? 0,
    waiting: check.waiting ?? 0,
    images: []
  };
  if (!status.done) return status;

  // /status is heavily rate-limited by the Horde, so only hit it once the job is finished.
  const full = await hordeFetch(`/generate/status/${safeId}`);
  status.faulted = !!full.faulted;
  status.images = await Promise.all(
    (full.generations || []).map(async (g: any) => ({
      url: await toDataUrl(g.img),
      seed: String(g.seed ?? ''),
      model: g.model || '',
      worker: g.worker_name || '',
      censored: !!g.censored
    }))
  );
  return status;
};

export const cancelHordeJob = async (id: string) => {
  await hordeFetch(`/generate/status/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

let modelCache: { at: number; models: HordeModel[] } | null = null;

export const listHordeModels = async (): Promise<HordeModel[]> => {
  if (modelCache && Date.now() - modelCache.at < 5 * 60 * 1000) return modelCache.models;
  const body: any[] = await hordeFetch('/status/models?type=image');
  const models = body
    .filter(m => m.count > 0 && !/inpainting/i.test(m.name))
    .map(m => ({ name: m.name, workers: m.count, queued: m.queued ?? 0, eta: m.eta ?? 0 }))
    .sort((a, b) => b.workers - a.workers || a.eta - b.eta);
  modelCache = { at: Date.now(), models };
  return models;
};
