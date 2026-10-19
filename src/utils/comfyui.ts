// Local ComfyUI client — runs generation on your own GPU. Server-side only.
// ComfyUI has no auth, so keep it bound to 127.0.0.1 and let this server be the only thing talking to it.
import { randomUUID } from 'crypto';
import type { HordeGenerateRequest, HordeJobStatus } from './aiHorde';

export const COMFY_JOB_PREFIX = 'comfy_';

const CLIENT_ID = randomUUID();
// COMFYUI_URL wins when set. Otherwise look for ComfyUI on its two usual local ports: 8188
// (portable and command-line installs) and 8000 (ComfyUI Desktop).
const AUTO_PORTS = [8188, 8000];
let detectedBase: string | null = null;

const getBase = () => (process.env.COMFYUI_URL?.trim() || detectedBase || `http://127.0.0.1:${AUTO_PORTS[0]}`).replace(/\/+$/, '');

const detectBase = async (): Promise<boolean> => {
  if (process.env.COMFYUI_URL?.trim()) return true;
  for (const port of AUTO_PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/system_stats`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        detectedBase = `http://127.0.0.1:${port}`;
        return true;
      }
    } catch {
      // not listening on this port
    }
  }
  detectedBase = null;
  return false;
};

const comfyFetch = async (pathname: string, init: RequestInit = {}, timeoutMs = 15000) => {
  // With no COMFYUI_URL, find the running instance first (cheap once cached; re-probed after a failure)
  if (!process.env.COMFYUI_URL?.trim() && !detectedBase) await detectBase();
  let res: Response;
  try {
    res = await fetch(`${getBase()}${pathname}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    detectedBase = null; // it may have moved or been restarted; probe again next time
    const where = process.env.COMFYUI_URL?.trim() ? process.env.COMFYUI_URL.trim() : `port ${AUTO_PORTS.join(' or ')} on this machine`;
    const err: any = new Error(`ComfyUI wasn't found at ${where}. Is it running?`);
    err.status = 503;
    throw err;
  }
  if (!res.ok) {
    const body: any = await res.json().catch(() => ({}));
    const nodeErrors = body?.node_errors && Object.values(body.node_errors).map((n: any) => n?.errors?.[0]?.details || n?.errors?.[0]?.message).filter(Boolean);
    const err: any = new Error(body?.error?.message || nodeErrors?.[0] || `ComfyUI request failed (${res.status})`);
    err.status = res.status >= 500 ? 502 : res.status;
    err.details = body?.node_errors;
    throw err;
  }
  return res;
};

export const isComfyAvailable = async () => {
  try {
    await comfyFetch('/system_stats', {}, 1500);
    return true;
  } catch {
    return false;
  }
};

export const listComfyCheckpoints = async (): Promise<string[]> => {
  const info: any = await (await comfyFetch('/object_info/CheckpointLoaderSimple')).json();
  const spec = info?.CheckpointLoaderSimple?.input?.required?.ckpt_name;
  // Older builds: [[...names], {}]; newer builds: ["COMBO", { options: [...] }]
  const names = Array.isArray(spec?.[0]) ? spec[0] : spec?.[1]?.options;
  return Array.isArray(names) ? names : [];
};

const snap = (n: number | undefined, fallback: number) => {
  const v = Number.isFinite(n) ? (n as number) : fallback;
  return Math.min(1536, Math.max(256, Math.round(v / 64) * 64));
};

// Standard txt2img graph in ComfyUI's API format. Node ids are arbitrary but must be consistent.
// Samplers the visualiser offers; LCM-style samplers need the sgm_uniform scheduler, the rest use karras
const schedulerFor = (sampler: string) => (sampler === 'lcm' ? 'sgm_uniform' : 'karras');

const buildWorkflow = (req: HordeGenerateRequest, ckpt: string) => {
  const sampler = req.sampler || 'dpmpp_2m';
  // Clip skip 2 (common for anime SD1.5 models) = stop at the second-to-last CLIP layer
  const useClipSkip = (req.clipSkip ?? 1) > 1;
  const clip: [string, number] = useClipSkip ? ['10', 0] : ['4', 1];
  // LCM-distilled models: ComfyUI's LCM example adds ModelSamplingDiscrete(lcm) ahead of the sampler
  const isLcm = sampler === 'lcm';
  const samplerModel: [string, number] = isLcm ? ['11', 0] : ['4', 0];
  return {
  '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: ckpt } },
  ...(isLcm ? { '11': { class_type: 'ModelSamplingDiscrete', inputs: { model: ['4', 0], sampling: 'lcm', zsnr: false } } } : {}),
  ...(useClipSkip ? { '10': { class_type: 'CLIPSetLastLayer', inputs: { clip: ['4', 1], stop_at_clip_layer: -Math.min(4, req.clipSkip as number) } } } : {}),
  '5': { class_type: 'EmptyLatentImage', inputs: { width: snap(req.width, 832), height: snap(req.height, 1216), batch_size: 1 } },
  '6': { class_type: 'CLIPTextEncode', inputs: { text: req.prompt.trim(), clip } },
  '7': { class_type: 'CLIPTextEncode', inputs: { text: req.negativePrompt?.trim() || '', clip } },
  '3': {
    class_type: 'KSampler',
    inputs: {
      seed: req.seed ? Number(req.seed) : Math.floor(Math.random() * 2 ** 32),
      steps: Math.min(60, Math.max(1, req.steps ?? 25)),
      cfg: Math.min(30, Math.max(1, req.cfgScale ?? 6)),
      sampler_name: sampler,
      scheduler: schedulerFor(sampler),
      denoise: 1,
      model: samplerModel,
      positive: ['6', 0],
      negative: ['7', 0],
      latent_image: ['5', 0]
    }
  },
  '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
  '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'edgerunn', images: ['8', 0] } }
  };
};

export const submitComfyJob = async (req: HordeGenerateRequest): Promise<{ id: string; kudos: number }> => {
  let ckpt = req.model;
  if (!ckpt) {
    const all = await listComfyCheckpoints();
    if (!all.length) {
      const err: any = new Error('No checkpoints found in ComfyUI/models/checkpoints.');
      err.status = 400;
      throw err;
    }
    ckpt = all[0];
  }
  const res = await comfyFetch('/prompt', {
    method: 'POST',
    body: JSON.stringify({ prompt: buildWorkflow(req, ckpt), client_id: CLIENT_ID })
  });
  const body: any = await res.json();
  return { id: `${COMFY_JOB_PREFIX}${body.prompt_id}`, kudos: 0 };
};

const stripPrefix = (id: string) => id.startsWith(COMFY_JOB_PREFIX) ? id.slice(COMFY_JOB_PREFIX.length) : id;

export const checkComfyJob = async (id: string): Promise<HordeJobStatus> => {
  const promptId = stripPrefix(id);
  const status: HordeJobStatus = {
    id, done: false, faulted: false, isPossible: true,
    queuePosition: 0, waitTime: 0, processing: 0, waiting: 0, images: []
  };

  const history: any = await (await comfyFetch(`/history/${encodeURIComponent(promptId)}`)).json();
  const entry = history?.[promptId];
  if (!entry) {
    const queue: any = await (await comfyFetch('/queue')).json();
    const running = (queue.queue_running || []).some((q: any[]) => q[1] === promptId);
    const pendingIdx = (queue.queue_pending || [])
      .sort((a: any[], b: any[]) => a[0] - b[0])
      .findIndex((q: any[]) => q[1] === promptId);
    if (running) status.processing = 1;
    else if (pendingIdx >= 0) {
      status.waiting = 1;
      status.queuePosition = pendingIdx + 1;
    } else {
      // Not queued and not in history: it was cancelled or ComfyUI restarted.
      status.faulted = true;
    }
    return status;
  }

  if (entry.status?.status_str === 'error') {
    status.faulted = true;
    return status;
  }

  const outputs = Object.values(entry.outputs || {}) as any[];
  const files = outputs.flatMap(o => o.images || []).filter((f: any) => f.type === 'output');
  status.done = true;
  status.images = await Promise.all(
    files.map(async (f: any) => {
      const qs = new URLSearchParams({ filename: f.filename, subfolder: f.subfolder || '', type: f.type });
      const img = await comfyFetch(`/view?${qs}`, {}, 30000);
      const type = img.headers.get('content-type') || 'image/png';
      const b64 = Buffer.from(await img.arrayBuffer()).toString('base64');
      const ckpt = entry.prompt?.[2]?.['4']?.inputs?.ckpt_name || '';
      const seed = entry.prompt?.[2]?.['3']?.inputs?.seed;
      return { url: `data:${type};base64,${b64}`, seed: String(seed ?? ''), model: ckpt, worker: 'local', censored: false };
    })
  );
  return status;
};

export const cancelComfyJob = async (id: string) => {
  const promptId = stripPrefix(id);
  await comfyFetch('/queue', { method: 'POST', body: JSON.stringify({ delete: [promptId] }) });
  const queue: any = await (await comfyFetch('/queue')).json();
  if ((queue.queue_running || []).some((q: any[]) => q[1] === promptId)) {
    await comfyFetch('/interrupt', { method: 'POST', body: JSON.stringify({ prompt_id: promptId }) });
  }
};
