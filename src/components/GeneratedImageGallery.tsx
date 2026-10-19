import React, { useEffect, useState } from 'react';
import { Download, Loader2, Trash2, X, AlertTriangle, EyeOff, Play, Pause, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { SceneImage, SceneImageJob } from '../utils/useSceneImages';
import { makeGif } from '../utils/makeGif';

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

// Plays a storyboard's frames in order; arrows step through them, the GIF button saves a looping copy
const StoryboardPlayer: React.FC<{ frames: SceneImage[]; onClose: () => void }> = ({ frames, onClose }) => {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % frames.length), 1400);
    return () => clearInterval(t);
  }, [playing, frames.length]);

  const saveGif = async () => {
    setBusy(true);
    setError('');
    try {
      const blob = await makeGif(frames.map(f => f.url));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `edgerunn_storyboard_${Date.now()}.gif`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (err: any) {
      setError(err?.message || 'GIF export failed.');
    } finally {
      setBusy(false);
    }
  };

  const frame = frames[Math.min(index, frames.length - 1)];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="flex max-h-full max-w-4xl flex-col gap-2" onClick={e => e.stopPropagation()}>
        <img src={frame.url} alt={frame.prompt} className="max-h-[70vh] w-auto rounded-lg object-contain" />
        <p className="max-h-20 overflow-y-auto font-sans text-xs text-neutral-400">{frame.prompt}</p>
        <div className="flex items-center gap-3 font-mono text-[10px] text-neutral-400">
          <button onClick={() => { setPlaying(false); setIndex(i => (i - 1 + frames.length) % frames.length); }} className="hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setPlaying(p => !p)} className="hover:text-white">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={() => { setPlaying(false); setIndex(i => (i + 1) % frames.length); }} className="hover:text-white"><ChevronRight className="h-4 w-4" /></button>
          <span>frame {Math.min(index, frames.length - 1) + 1} / {frames.length}</span>
          <button onClick={saveGif} disabled={busy} className="ml-auto flex items-center gap-1 text-cyan-400 hover:text-cyan-300 disabled:opacity-50">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Film className="h-3 w-3" />} {busy ? 'building GIF…' : 'save as GIF'}
          </button>
          <button onClick={onClose} className="hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {error && <p className="text-[10px] text-red-400">{error}</p>}
      </div>
    </div>
  );
};

export const GeneratedImageGallery: React.FC<GeneratedImageGalleryProps> = ({ images, jobs = [], onCancelJob, onDismissJob, onRemoveImage }) => {
  const [expanded, setExpanded] = useState<SceneImage | null>(null);
  const [playingBoard, setPlayingBoard] = useState<string | null>(null);
  if (images.length === 0 && jobs.length === 0) return null;

  const singles = images.filter(img => !img.storyboardId);
  const boardIds: string[] = Array.from(new Set<string>(images.flatMap(img => (img.storyboardId ? [img.storyboardId] : []))));
  const boardFrames = (id: string) => images.filter(img => img.storyboardId === id).sort((a, b) => (a.frame ?? 0) - (b.frame ?? 0));

  return (
    <>
      {boardIds.map(id => {
        const frames = boardFrames(id);
        const pending = jobs.filter(j => j.storyboardId === id && j.state !== 'faulted' && j.state !== 'impossible' && j.state !== 'error').length;
        return (
          <div key={id} className="mt-2 w-full max-w-2xl rounded-lg border border-fuchsia-900/60 bg-neutral-950/60 p-2">
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-fuchsia-300">
              <span className="flex items-center gap-1"><Film className="h-3 w-3" /> STORYBOARD · {frames.length} frame{frames.length === 1 ? '' : 's'}{pending ? ` · ${pending} still rendering` : ''}</span>
              <button onClick={() => setPlayingBoard(id)} className="flex items-center gap-1 rounded border border-fuchsia-700 px-2 py-0.5 hover:bg-fuchsia-900/40"><Play className="h-3 w-3" /> play / GIF</button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {frames.map(img => (
                <button key={img.id} onClick={() => setExpanded(img)} className="relative w-28 shrink-0 overflow-hidden rounded border border-neutral-700 hover:border-fuchsia-500">
                  <img src={img.url} alt={img.prompt} className="aspect-[2/3] w-full object-cover" />
                  <span className="absolute left-1 top-1 rounded bg-black/80 px-1 font-mono text-[9px] text-neutral-300">{(img.frame ?? 0) + 1}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div className="mt-2 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
        {singles.map(img => (
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
              {job.frame !== undefined && <span className="text-neutral-400">frame {job.frame + 1}</span>}
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

      {playingBoard && boardFrames(playingBoard).length > 0 && (
        <StoryboardPlayer frames={boardFrames(playingBoard)} onClose={() => setPlayingBoard(null)} />
      )}

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
