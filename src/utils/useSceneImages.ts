import { useCallback, useEffect, useRef, useState } from 'react';

export interface SceneImage {
  id: string;
  messageId: string;
  url: string;
  prompt: string;
  model: string;
  seed: string;
  censored: boolean;
  createdAt: number;
}

export interface SceneImageJob {
  id: string;
  messageId: string;
  prompt: string;
  model: string;
  state: 'queued' | 'processing' | 'faulted' | 'impossible' | 'error';
  queuePosition: number;
  waitTime: number;
  error?: string;
}

export type ImageBackend = 'horde' | 'comfyui';

export interface SceneImageRequest {
  messageId: string;
  backend?: ImageBackend;
  prompt: string;
  negativePrompt?: string;
  model?: string;
  nsfw?: boolean;
  width?: number;
  height?: number;
  steps?: number;
}

const POLL_MS = 4000;

const readJson = async (res: Response) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body;
};

// Owns AI Horde job submission/polling so jobs keep running after the visualiser modal closes.
export const useSceneImages = () => {
  const [images, setImages] = useState<SceneImage[]>([]);
  const [jobs, setJobs] = useState<SceneImageJob[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => () => timers.current.forEach(t => clearTimeout(t)), []);

  const patchJob = (id: string, patch: Partial<SceneImageJob>) =>
    setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...patch } : j)));

  const dropJob = (id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const poll = useCallback((job: SceneImageJob) => {
    const tick = async () => {
      try {
        const status = await readJson(await fetch(`/api/generate-image/${encodeURIComponent(job.id)}`));
        if (status.faulted) return patchJob(job.id, { state: 'faulted', error: 'A Horde worker faulted on this job.' });
        if (!status.isPossible) return patchJob(job.id, { state: 'impossible', error: 'No worker can serve this model/size right now.' });
        if (status.done) {
          const fresh: SceneImage[] = (status.images || []).map((img: any, i: number) => ({
            id: `${job.id}_${i}`,
            messageId: job.messageId,
            url: img.url,
            prompt: job.prompt,
            model: img.model || job.model,
            seed: img.seed,
            censored: img.censored,
            createdAt: Date.now()
          }));
          setImages(prev => [...prev, ...fresh]);
          dropJob(job.id);
          return;
        }
        patchJob(job.id, {
          state: status.processing > 0 ? 'processing' : 'queued',
          queuePosition: status.queuePosition,
          waitTime: status.waitTime
        });
      } catch (err: any) {
        // Transient network/rate-limit errors: keep polling, but surface the message.
        patchJob(job.id, { error: err?.message });
      }
      timers.current.set(job.id, setTimeout(tick, POLL_MS));
    };
    timers.current.set(job.id, setTimeout(tick, POLL_MS));
  }, []);

  const generate = useCallback(async (req: SceneImageRequest) => {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    const { id } = await readJson(res);
    const job: SceneImageJob = {
      id,
      messageId: req.messageId,
      prompt: req.prompt,
      model: req.model || 'any',
      state: 'queued',
      queuePosition: 0,
      waitTime: 0
    };
    setJobs(prev => [...prev, job]);
    poll(job);
  }, [poll]);

  const cancel = useCallback(async (id: string) => {
    dropJob(id);
    await fetch(`/api/generate-image/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const removeImage = useCallback((id: string) => setImages(prev => prev.filter(i => i.id !== id)), []);

  return { images, jobs, generate, cancel, dismissJob: dropJob, removeImage };
};

export type SceneImagesController = ReturnType<typeof useSceneImages>;
