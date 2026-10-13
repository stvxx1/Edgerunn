import React, { useEffect, useState } from 'react';
import { Cpu, ImageIcon, Loader2, X } from 'lucide-react';

export interface VisualiseResult {
  id: string;
  url: string;
  prompt: string;
}

interface VisualiseModalProps {
  isOpen: boolean;
  sourceText: string;
  appearance?: string;
  onClose: () => void;
  onGenerated: (img: VisualiseResult) => void;
}

const FRAMES = [
  { label: 'Portrait (832×1216)', width: 832, height: 1216 },
  { label: 'Landscape (1216×832)', width: 1216, height: 832 },
  { label: 'Square (1024×1024)', width: 1024, height: 1024 },
  { label: 'Portrait (512×768)', width: 512, height: 768 }
];

const PONY_PREFIX = 'score_9, score_8_up, score_7_up, ';
const DEFAULT_NEGATIVE = 'lowres, blurry, bad anatomy, extra fingers, deformed hands, watermark, text, signature, jpeg artifacts';

const buildDefaultPrompt = (text: string, appearance?: string) => {
  const scene = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#>`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
  return [
    'cyberpunk, Night City, cinematic lighting, neon, highly detailed',
    appearance ? `protagonist: ${appearance}` : '',
    scene
  ].filter(Boolean).join(', ');
};

export const VisualiseModal: React.FC<VisualiseModalProps> = ({ isOpen, sourceText, appearance, onClose, onGenerated }) => {
  const [status, setStatus] = useState<{ online: boolean; checkpoints: string[]; error?: string } | null>(null);
  const [checkpoint, setCheckpoint] = useState('');
  const [frameIdx, setFrameIdx] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState(DEFAULT_NEGATIVE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPrompt(buildDefaultPrompt(sourceText, appearance));
    setError(null);
    setStatus(null);
    fetch('/api/comfy/status')
      .then(r => r.json())
      .then(s => {
        setStatus(s);
        const saved = localStorage.getItem('edgerunn.comfy.checkpoint');
        setCheckpoint(s.checkpoints.includes(saved) ? saved : s.checkpoints[0] || '');
      })
      .catch(e => setStatus({ online: false, checkpoints: [], error: String(e) }));
  }, [isOpen, sourceText, appearance]);

  if (!isOpen) return null;

  const isPony = /pony/i.test(checkpoint);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const frame = FRAMES[frameIdx];
      const finalPrompt = isPony && !prompt.startsWith('score_9') ? PONY_PREFIX + prompt : prompt;
      const res = await fetch('/api/comfy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, negativePrompt: negative, checkpoint, width: frame.width, height: frame.height })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      try { localStorage.setItem('edgerunn.comfy.checkpoint', checkpoint); } catch { /* ignore */ }
      onGenerated({ id: `img-${Date.now()}`, url: data.url, prompt: finalPrompt });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={busy ? undefined : onClose}>
      <div className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto bg-neutral-950 border border-fuchsia-500/40 sm:rounded-lg p-4 font-mono text-xs text-neutral-300 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-fuchsia-400 font-bold tracking-wider flex items-center gap-2"><ImageIcon className="w-4 h-4" /> VISUALISE</span>
          <button onClick={onClose} disabled={busy} className="p-1 text-neutral-500 hover:text-red-400"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <div className="text-neutral-500 mb-1">ENGINE</div>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded border border-fuchsia-500 bg-fuchsia-950/40 text-fuchsia-300">
            <Cpu className="w-4 h-4" /> Local GPU (ComfyUI)
            <span className={`ml-auto text-[10px] ${status?.online ? 'text-emerald-400' : 'text-red-400'}`}>
              {status === null ? 'CHECKING…' : status.online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>
          {status && !status.online && (
            <p className="mt-1 text-red-400 break-words">{status.error || 'ComfyUI is not running on the PC.'}</p>
          )}
          {status?.online && status.checkpoints.length === 0 && (
            <p className="mt-1 text-yellow-400">No .safetensors checkpoints found in ComfyUI/models/checkpoints/.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block">
            <span className="text-neutral-500">CHECKPOINT</span>
            <select value={checkpoint} onChange={e => setCheckpoint(e.target.value)} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-2 text-neutral-200">
              {status?.checkpoints.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-neutral-500">FRAME</span>
            <select value={frameIdx} onChange={e => setFrameIdx(Number(e.target.value))} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-2 text-neutral-200">
              {FRAMES.map((f, i) => <option key={f.label} value={i}>{f.label}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-neutral-500">PROMPT {isPony && <span className="text-fuchsia-400">(Pony score tags added automatically)</span>}</span>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-2 text-neutral-200 font-sans text-sm" />
        </label>
        <label className="block">
          <span className="text-neutral-500">NEGATIVE</span>
          <textarea value={negative} onChange={e => setNegative(e.target.value)} rows={2} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-2 text-neutral-200 font-sans text-sm" />
        </label>

        {error && <p className="text-red-400 break-words">{error}</p>}

        <button
          onClick={generate}
          disabled={busy || !status?.online || !checkpoint || !prompt.trim()}
          className="w-full py-3 rounded font-bold tracking-widest bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white flex items-center justify-center gap-2"
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> RENDERING ON GPU…</> : 'GENERATE'}
        </button>
      </div>
    </div>
  );
};
