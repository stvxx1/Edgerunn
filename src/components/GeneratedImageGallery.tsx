import React, { useState } from 'react';
import { Download, Loader2, Trash2, X, AlertTriangle, EyeOff } from 'lucide-react';
import { SceneImage, SceneImageJob } from '../utils/useSceneImages';

interface GeneratedImageGalleryProps {
  images: SceneImage[];
  jobs?: SceneImageJob[];
  onCancelJob?: (id: string) => void;
  onDismissJob?: (id: string) => void;
  onRemoveImage?: (id: string) => void;
}

const jobLabel = (job: SceneImageJob) => {
  if (job.state === 'processing') return `rendering${job.waitTime ? ` · ~${job.waitTime}s` : ''}`;
  if (job.state === 'queued') return `queued #${job.queuePosition}${job.waitTime ? ` · ~${job.waitTime}s` : ''}`;
  return job.error || job.state;
};

export const GeneratedImageGallery: React.FC<GeneratedImageGalleryProps> = ({ images, jobs = [], onCancelJob, onDismissJob, onRemoveImage }) => {
  const [expanded, setExpanded] = useState<SceneImage | null>(null);
  if (images.length === 0 && jobs.length === 0) return null;

  return (
    <>
      <div className="mt-2 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map(img => (
          <button
            key={img.id}
            onClick={() => setExpanded(img)}
            className="group relative overflow-hidden rounded-lg border border-neutral-700 text-left hover:border-fuchsia-500"
          >
            <img src={img.url} alt={img.prompt} className="aspect-[2/3] w-full object-cover" />
            {img.censored && (
              <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-black/80 px-1 text-[9px] text-yellow-400">
                <EyeOff className="h-3 w-3" /> filtered
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 truncate bg-black/70 p-1 font-mono text-[10px] text-neutral-300">{img.model}</div>
          </button>
        ))}
        {jobs.map(job => {
          const failed = job.state === 'faulted' || job.state === 'impossible' || job.state === 'error';
          return (
            <div
              key={job.id}
              className={`relative flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center font-mono text-[10px] ${
                failed ? 'border-red-800 bg-red-950/20 text-red-400' : 'border-fuchsia-800/60 bg-neutral-900 text-fuchsia-300'
              }`}
            >
              {failed ? <AlertTriangle className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              <span>{jobLabel(job)}</span>
              {!failed && job.error && <span className="text-[9px] text-yellow-500/80">{job.error}</span>}
              <button
                onClick={() => (failed ? onDismissJob?.(job.id) : onCancelJob?.(job.id))}
                className="rounded border border-neutral-700 px-2 py-0.5 text-neutral-400 hover:border-red-500 hover:text-red-400"
              >
                {failed ? 'dismiss' : 'cancel'}
              </button>
            </div>
          );
        })}
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setExpanded(null)}>
          <div className="flex max-h-full max-w-4xl flex-col gap-2" onClick={e => e.stopPropagation()}>
            <img src={expanded.url} alt={expanded.prompt} className="max-h-[75vh] w-auto rounded-lg object-contain" />
            <p className="max-h-24 overflow-y-auto font-sans text-xs text-neutral-400">{expanded.prompt}</p>
            <div className="flex items-center gap-3 font-mono text-[10px] text-neutral-500">
              <span>{expanded.model} · seed {expanded.seed}</span>
              <a href={expanded.url} download={`edgerunn_${expanded.id}.webp`} className="ml-auto flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                <Download className="h-3 w-3" /> save
              </a>
              {onRemoveImage && (
                <button onClick={() => { onRemoveImage(expanded.id); setExpanded(null); }} className="flex items-center gap-1 hover:text-red-400">
                  <Trash2 className="h-3 w-3" /> delete
                </button>
              )}
              <button onClick={() => setExpanded(null)} className="hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
