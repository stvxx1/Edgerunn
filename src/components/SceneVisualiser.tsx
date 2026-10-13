import React, { useEffect, useState } from 'react';
import { ImageIcon, X, Loader2, RotateCcw } from 'lucide-react';
import { HUDState } from '../types';
import { buildScenePrompt, DEFAULT_NEGATIVE_PROMPT } from '../utils/scenePrompt';
import { SceneImageRequest } from '../utils/useSceneImages';

interface SceneVisualiserProps {
  messageId: string;
  sceneText: string;
  hudState: HUDState;
  onClose: () => void;
  onGenerate: (req: SceneImageRequest) => Promise<void>;
}

interface HordeModelOption {
  name: string;
  workers: number;
  eta: number;
}

const ASPECTS = {
  portrait: { label: 'Portrait', width: 512, height: 768 },
  landscape: { label: 'Landscape', width: 768, height: 512 },
  square: { label: 'Square', width: 640, height: 640 },
  'portrait-xl': { label: 'Portrait XL', width: 832, height: 1024 },
  'landscape-xl': { label: 'Landscape XL', width: 1024, height: 832 }
} as const;
type AspectKey = keyof typeof ASPECTS;

interface VisualiserSettings {
  model: string;
  nsfw: boolean;
  aspect: AspectKey;
  steps: number;
  negativePrompt: string;
}

const SETTINGS_KEY = 'edgerunn.sceneVisualiser.settings';
const DEFAULT_SETTINGS: VisualiserSettings = {
  model: '',
  nsfw: false,
  aspect: 'portrait',
  steps: 25,
  negativePrompt: DEFAULT_NEGATIVE_PROMPT
};

const loadSettings = (): VisualiserSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (s: VisualiserSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable (private mode etc.) — settings just won't persist.
  }
};

export const SceneVisualiser: React.FC<SceneVisualiserProps> = ({ messageId, sceneText, hudState, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState(() => buildScenePrompt(sceneText, hudState));
  const [settings, setSettings] = useState<VisualiserSettings>(loadSettings);
  const [models, setModels] = useState<HordeModelOption[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/image-models')
      .then(r => r.json())
      .then(body => {
        setModels(body.models || []);
        setHasApiKey(!!body.hasApiKey);
      })
      .catch(() => setModels([]));
  }, []);

  const update = (patch: Partial<VisualiserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setSubmitting(true);
    setError(null);
    const { width, height } = ASPECTS[settings.aspect];
    try {
      await onGenerate({
        messageId,
        prompt,
        negativePrompt: settings.negativePrompt,
        model: settings.model || undefined,
        nsfw: settings.nsfw,
        width,
        height,
        steps: settings.steps
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit image job.');
    } finally {
      setSubmitting(false);
    }
  };

  const isXL = settings.aspect.endsWith('-xl');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-fuchsia-500/40 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 shadow-[0_0_30px_rgba(217,70,239,0.15)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold tracking-wider text-fuchsia-400">
            <ImageIcon className="h-4 w-4" /> SCENE VISUALISER
          </span>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <label className="mb-1 flex items-center justify-between text-neutral-500">
          <span>PROMPT</span>
          <button onClick={() => setPrompt(buildScenePrompt(sceneText, hudState))} className="flex items-center gap-1 hover:text-fuchsia-300">
            <RotateCcw className="h-3 w-3" /> rebuild from scene
          </button>
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={6}
          className="mb-3 w-full resize-y rounded border border-neutral-800 bg-neutral-900 p-2 font-sans text-sm text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
        />

        <label className="mb-1 block text-neutral-500">NEGATIVE PROMPT</label>
        <textarea
          value={settings.negativePrompt}
          onChange={e => update({ negativePrompt: e.target.value })}
          rows={2}
          className="mb-3 w-full resize-y rounded border border-neutral-800 bg-neutral-900 p-2 font-sans text-xs text-neutral-400 focus:border-fuchsia-500 focus:outline-none"
        />

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-neutral-500">MODEL</label>
            <select
              value={settings.model}
              onChange={e => update({ model: e.target.value })}
              className="w-full rounded border border-neutral-800 bg-neutral-900 p-2 text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="">Any available (fastest)</option>
              {settings.model && !models.some(m => m.name === settings.model) && (
                <option value={settings.model}>{settings.model} (offline?)</option>
              )}
              {models.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name} · {m.workers}w{m.eta ? ` · ~${m.eta}s` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-neutral-500">FRAME</label>
            <select
              value={settings.aspect}
              onChange={e => update({ aspect: e.target.value as AspectKey })}
              className="w-full rounded border border-neutral-800 bg-neutral-900 p-2 text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
            >
              {Object.entries(ASPECTS).map(([key, a]) => (
                <option key={key} value={key}>{a.label} ({a.width}×{a.height})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-neutral-500">STEPS: {settings.steps}</label>
            <input
              type="range"
              min={10}
              max={50}
              value={settings.steps}
              onChange={e => update({ steps: Number(e.target.value) })}
              className="w-full accent-fuchsia-500"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 self-end pb-1">
            <input type="checkbox" checked={settings.nsfw} onChange={e => update({ nsfw: e.target.checked })} className="accent-fuchsia-500" />
            <span className={settings.nsfw ? 'text-fuchsia-300' : 'text-neutral-400'}>Allow NSFW (18+ workers only)</span>
          </label>
        </div>

        {!hasApiKey && (
          <p className="mb-2 text-[10px] text-yellow-500/80">
            Running anonymously — lowest queue priority.{isXL ? ' XL frames may be rejected without kudos.' : ''} Set AI_HORDE_API_KEY for faster jobs.
          </p>
        )}
        {error && <p className="mb-2 text-red-400">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={submitting || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded border border-fuchsia-600 bg-fuchsia-950/60 py-2 font-bold tracking-wider text-fuchsia-300 transition hover:bg-fuchsia-900/60 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          {submitting ? 'UPLINKING...' : 'GENERATE'}
        </button>
      </div>
    </div>
  );
};
