import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, X, Loader2, RotateCcw, Cpu, Cloud, Film } from 'lucide-react';
import { HUDState } from '../types';
import { buildScenePrompt, requestScenePrompt, requestSceneBeats, offlineBeats, composeFramePrompt, describePromptFallback, withPonyScore, withPonyNegative, isPonyModel, DEFAULT_NEGATIVE_PROMPT } from '../utils/scenePrompt';
import { describeCharacterLook } from '../utils/characterLook';
import { ImageBackend, SceneImageRequest } from '../utils/useSceneImages';

interface SceneVisualiserProps {
  messageId: string;
  sceneText: string;
  hudState: HUDState;
  context: string[]; // the few messages before this one, so NPC looks can be recalled
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
  'landscape-xl': { label: 'Landscape XL', width: 1024, height: 832 },
  // Native SDXL buckets; too big for anonymous Horde jobs, so local only.
  'portrait-sdxl': { label: 'Portrait SDXL', width: 832, height: 1216, localOnly: true },
  'landscape-sdxl': { label: 'Landscape SDXL', width: 1216, height: 832, localOnly: true }
} as const;
type AspectKey = keyof typeof ASPECTS;

interface VisualiserSettings {
  backend: ImageBackend;
  models: Record<ImageBackend, string>;
  nsfw: boolean;
  aspect: AspectKey;
  steps: number;
  cfg: number;
  sampler: string;
  clipSkip: number;
  negativePrompt: string;
  storyboardFrames: number;
}

const SETTINGS_KEY = 'edgerunn.sceneVisualiser.settings';
const DEFAULT_SETTINGS: VisualiserSettings = {
  backend: 'horde',
  models: { horde: '', comfyui: '' },
  nsfw: false,
  aspect: 'portrait',
  steps: 25,
  cfg: 6,
  sampler: 'dpmpp_2m',
  clipSkip: 1,
  negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  storyboardFrames: 4
};

// Samplers offered for local ComfyUI runs ('lcm' is for LCM-distilled models)
const SAMPLERS = ['dpmpp_2m', 'dpmpp_2m_sde', 'dpmpp_sde', 'euler', 'euler_ancestral', 'lcm'];

const loadSettings = (): VisualiserSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed, models: { ...DEFAULT_SETTINGS.models, ...parsed.models } };
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

export const SceneVisualiser: React.FC<SceneVisualiserProps> = ({ messageId, sceneText, hudState, context, onClose, onGenerate }) => {
  // Starts as the plain summary so something is there instantly; Gemini's rewrite replaces it
  // The protagonist's look, pulled from the character sheet (description, lifepath, chrome, gear, wounds)
  const characterLook = useMemo(() => describeCharacterLook(hudState), [hudState]);
  const [prompt, setPrompt] = useState(() => buildScenePrompt(sceneText, characterLook));
  const [promptSource, setPromptSource] = useState<'writing' | 'ai' | 'basic'>('writing');
  const [fallbackNote, setFallbackNote] = useState('');
  const userEdited = useRef(false);
  const startedFor = useRef<string | null>(null);
  const [settings, setSettings] = useState<VisualiserSettings>(loadSettings);
  const [models, setModels] = useState<HordeModelOption[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [comfyAvailable, setComfyAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beats, setBeats] = useState<string[] | null>(null);
  const [planning, setPlanning] = useState(false);
  const [beatNote, setBeatNote] = useState('');

  useEffect(() => {
    fetch('/api/image-backends')
      .then(r => r.json())
      .then(body => setComfyAvailable(!!body.comfyui))
      .catch(() => setComfyAvailable(false));
  }, []);

  useEffect(() => {
    // Ignore late responses after a backend switch, or the slower Horde list overwrites the local one.
    let stale = false;
    setModels([]);
    fetch(`/api/image-models?backend=${settings.backend}`)
      .then(r => r.json())
      .then(body => {
        if (stale) return;
        setModels(body.models || []);
        setHasApiKey(!!body.hasApiKey);
      })
      .catch(() => !stale && setModels([]));
    return () => { stale = true; };
  }, [settings.backend, comfyAvailable]);

  const writePrompt = async (force: boolean) => {
    if (force) userEdited.current = false;
    setPromptSource('writing');
    try {
      const written = await requestScenePrompt({
        sceneText,
        recent: context,
        protagonist: characterLook,
        modelName: settings.models[settings.backend],
        fresh: force
      });
      if (!userEdited.current) setPrompt(written);
      setPromptSource('ai');
    } catch (err) {
      if (!userEdited.current) setPrompt(buildScenePrompt(sceneText, characterLook));
      setFallbackNote(describePromptFallback(err));
      setPromptSource('basic');
    }
  };

  useEffect(() => {
    if (startedFor.current === messageId) return; // StrictMode runs effects twice in dev
    startedFor.current = messageId;
    writePrompt(false);
  }, [messageId]);

  // Pony models want tag-style prompts: rewrite when the model switches to or from one (unless you edited it)
  const ponyNow = isPonyModel(settings.models[settings.backend]);
  const wasPony = useRef(ponyNow);
  useEffect(() => {
    if (wasPony.current === ponyNow) return;
    wasPony.current = ponyNow;
    if (!userEdited.current) writePrompt(false);
  }, [ponyNow]);

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
        backend: settings.backend,
        prompt: withPonyScore(prompt, model),
        negativePrompt: withPonyNegative(settings.negativePrompt, model, prompt),
        model: model || undefined,
        nsfw: settings.nsfw,
        width,
        height,
        // Horde jobs below 10 steps aren't accepted; local runs can go as low as 1
        steps: Math.max(settings.backend === 'comfyui' ? 1 : 10, settings.steps),
        cfgScale: settings.cfg,
        sampler: settings.sampler,
        clipSkip: settings.clipSkip
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit image job.');
    } finally {
      setSubmitting(false);
    }
  };

  // Storyboard: split the scene into beats (AI, or a no-model fallback), let the player edit them, then
  // render one frame per beat. Same seed, character look, setting and style on every frame.
  const planStoryboard = async () => {
    setPlanning(true);
    setError(null);
    setBeatNote('');
    const count = settings.storyboardFrames;
    try {
      const written = await requestSceneBeats({ sceneText, recent: context, protagonist: characterLook, count, modelName: settings.models[settings.backend] });
      setBeats(written.slice(0, count));
      setBeatNote('✨ written from the scene');
    } catch (err) {
      const quick = offlineBeats(sceneText, count);
      if (!quick.length) {
        setError('Could not split this scene into shots. Try a longer scene.');
      } else {
        setBeats(quick);
        setBeatNote(`quick split: ${describePromptFallback(err)}`);
      }
    } finally {
      setPlanning(false);
    }
  };

  const generateStoryboard = async () => {
    if (!beats?.length) return;
    setSubmitting(true);
    setError(null);
    const { width, height } = ASPECTS[settings.aspect];
    const storyboardId = `sb_${Date.now()}`;
    const seed = String(Math.floor(Math.random() * 2 ** 31));
    try {
      for (let frame = 0; frame < beats.length; frame++) {
        if (!beats[frame].trim()) continue;
        await onGenerate({
          messageId,
          backend: settings.backend,
          prompt: withPonyScore(composeFramePrompt(beats[frame], sceneText, characterLook), model),
          negativePrompt: withPonyNegative(settings.negativePrompt, model, (beats || []).join(' ')),
          model: model || undefined,
          nsfw: settings.nsfw,
          width,
          height,
          steps: Math.max(settings.backend === 'comfyui' ? 1 : 10, settings.steps),
          cfgScale: settings.cfg,
          sampler: settings.sampler,
          clipSkip: settings.clipSkip,
          seed,
          storyboardId,
          frame
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit the storyboard frames.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLocal = settings.backend === 'comfyui';
  const model = settings.models[settings.backend];
  const isXL = settings.aspect.includes('-xl');
  const setModel = (name: string) => update({ models: { ...settings.models, [settings.backend]: name } });
  const setBackend = (backend: ImageBackend) => {
    const frameOk = backend === 'comfyui' || !('localOnly' in ASPECTS[settings.aspect]);
    update({ backend, ...(frameOk ? {} : { aspect: 'portrait' as AspectKey }) });
  };

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

        <div className="mb-3 grid grid-cols-2 gap-2">
          {([
            ['horde', 'AI Horde', Cloud, 'free cloud'],
            ['comfyui', 'Local GPU', Cpu, comfyAvailable === null ? 'checking…' : comfyAvailable ? 'online' : 'offline']
          ] as const).map(([key, label, Icon, sub]) => (
            <button
              key={key}
              onClick={() => setBackend(key)}
              className={`flex items-center gap-2 rounded border p-2 text-left transition ${
                settings.backend === key ? 'border-fuchsia-500 bg-fuchsia-950/40 text-fuchsia-200' : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex flex-col">
                <span className="font-bold">{label}</span>
                <span className={`text-[10px] ${key === 'comfyui' && comfyAvailable === false ? 'text-red-400' : 'text-neutral-500'}`}>{sub}</span>
              </span>
            </button>
          ))}
        </div>

        <label className="mb-1 flex items-center justify-between text-neutral-500">
          <span>
            PROMPT
            <span className={`ml-2 text-[10px] ${promptSource === 'ai' ? 'text-fuchsia-400' : promptSource === 'basic' ? 'text-yellow-500/80' : 'text-neutral-500'}`}>
              {promptSource === 'writing' ? 'writing from the scene…' : promptSource === 'ai' ? '✨ written from the scene' : `quick summary: ${fallbackNote || 'AI prompt writer unavailable'}. Edit freely.`}
            </span>
          </span>
          <button onClick={() => writePrompt(true)} disabled={promptSource === 'writing'} className="flex items-center gap-1 hover:text-fuchsia-300 disabled:opacity-50">
            <RotateCcw className={`h-3 w-3 ${promptSource === 'writing' ? 'animate-spin' : ''}`} /> rewrite from scene
          </button>
        </label>
        <textarea
          value={prompt}
          onChange={e => { userEdited.current = true; setPrompt(e.target.value); }}
          rows={6}
          className="mb-3 w-full resize-y rounded border border-neutral-800 bg-neutral-900 p-2 font-sans text-sm text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
        />

        <p className="mb-3 -mt-2 text-[10px] leading-snug text-neutral-500">
          <span className="text-neutral-400">Your character, from the sheet: </span>
          {characterLook || 'nothing yet. Describe your look on the HUD tab (EDIT DESCRIPTION).'}
        </p>

        <label className="mb-1 block text-neutral-500">NEGATIVE PROMPT</label>
        <textarea
          value={settings.negativePrompt}
          onChange={e => update({ negativePrompt: e.target.value })}
          rows={2}
          className="mb-3 w-full resize-y rounded border border-neutral-800 bg-neutral-900 p-2 font-sans text-xs text-neutral-400 focus:border-fuchsia-500 focus:outline-none"
        />

        {isPonyModel(model) && (
          <button
            type="button"
            onClick={() => update({ steps: 30, cfg: 6, sampler: 'dpmpp_sde', clipSkip: 2, aspect: isLocal ? 'portrait-sdxl' : 'portrait-xl' })}
            className="mb-3 w-full rounded border border-neutral-700 bg-neutral-900 py-1.5 text-[11px] text-neutral-300 transition hover:border-fuchsia-500 hover:text-fuchsia-300"
            title="From the Pony prompting guide: 30 steps, CFG 6, DPM++ SDE Karras, clip skip 2, 832 wide"
          >
            🐴 PONY PRESET: 30 steps · CFG 6 · DPM++ SDE · clip skip 2 · SDXL frame
          </button>
        )}
        {isLocal && (
          <button
            type="button"
            onClick={() => update({ steps: 10, cfg: 1, sampler: 'lcm', clipSkip: 1 })}
            className="mb-3 w-full rounded border border-neutral-700 bg-neutral-900 py-1.5 text-[11px] text-neutral-300 transition hover:border-fuchsia-500 hover:text-fuchsia-300"
            title="For LCM / Lightning / 'Fast' models that recommend CFG 1 and 8-15 steps"
          >
            ⚡ FAST-MODEL PRESET: 10 steps · CFG 1 · LCM sampler
          </button>
        )}

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-neutral-500">MODEL</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full rounded border border-neutral-800 bg-neutral-900 p-2 text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="">{isLocal ? 'First checkpoint found' : 'Any available (fastest)'}</option>
              {model && !models.some(m => m.name === model) && (
                <option value={model}>{model} (not found)</option>
              )}
              {models.map(m => (
                <option key={m.name} value={m.name}>
                  {isLocal ? m.name : `${m.name} · ${m.workers}w${m.eta ? ` · ~${m.eta}s` : ''}`}
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
              {Object.entries(ASPECTS).filter(([, a]) => isLocal || !('localOnly' in a)).map(([key, a]) => (
                <option key={key} value={key}>{a.label} ({a.width}×{a.height})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-neutral-500">STEPS: {Math.max(isLocal ? 1 : 10, settings.steps)}</label>
            <input
              type="range"
              min={isLocal ? 1 : 10}
              max={50}
              value={Math.max(isLocal ? 1 : 10, settings.steps)}
              onChange={e => update({ steps: Number(e.target.value) })}
              className="w-full accent-fuchsia-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-neutral-500">CFG: {settings.cfg}</label>
            <input
              type="range"
              min={1}
              max={12}
              step={0.5}
              value={settings.cfg}
              onChange={e => update({ cfg: Number(e.target.value) })}
              className="w-full accent-fuchsia-500"
            />
          </div>
          {isLocal && (
            <>
              <div>
                <label className="mb-1 block text-neutral-500">SAMPLER</label>
                <select
                  value={settings.sampler}
                  onChange={e => update({ sampler: e.target.value })}
                  className="w-full rounded border border-neutral-800 bg-neutral-900 p-2 text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
                >
                  {SAMPLERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-neutral-500">CLIP SKIP</label>
                <select
                  value={settings.clipSkip}
                  onChange={e => update({ clipSkip: Number(e.target.value) })}
                  className="w-full rounded border border-neutral-800 bg-neutral-900 p-2 text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
                >
                  <option value={1}>1 (default)</option>
                  <option value={2}>2 (many anime models)</option>
                </select>
              </div>
            </>
          )}
          {isLocal ? (
            <span className="self-end pb-1 text-[10px] text-neutral-500">Local GPU · no content filter</span>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 self-end pb-1">
              <input type="checkbox" checked={settings.nsfw} onChange={e => update({ nsfw: e.target.checked })} className="accent-fuchsia-500" />
              <span className={settings.nsfw ? 'text-fuchsia-300' : 'text-neutral-400'}>Allow NSFW (18+ workers only)</span>
            </label>
          )}
        </div>

        {isLocal && comfyAvailable === false && (
          <p className="mb-2 text-[10px] text-red-400">ComfyUI isn't reachable from the Edgerunn server. Start it on the PC (default port 8188) or set COMFYUI_URL.</p>
        )}
        {!isLocal && !hasApiKey && (
          <p className="mb-2 text-[10px] text-yellow-500/80">
            Running anonymously — lowest queue priority.{isXL ? ' XL frames may be rejected without kudos.' : ''} Set AI_HORDE_API_KEY for faster jobs.
          </p>
        )}
        {error && <p className="mb-2 text-red-400">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={submitting || !prompt.trim() || promptSource === 'writing'}
          className="flex w-full items-center justify-center gap-2 rounded border border-fuchsia-600 bg-fuchsia-950/60 py-2 font-bold tracking-wider text-fuchsia-300 transition hover:bg-fuchsia-900/60 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          {submitting ? 'UPLINKING...' : promptSource === 'writing' ? 'WRITING PROMPT...' : 'GENERATE'}
        </button>

        <div className="mt-4 border-t border-neutral-800 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold tracking-wider text-fuchsia-400"><Film className="h-3.5 w-3.5" /> STORYBOARD</span>
            <label className="flex items-center gap-2 text-neutral-500">
              frames
              <select
                value={settings.storyboardFrames}
                onChange={e => { update({ storyboardFrames: Number(e.target.value) }); setBeats(null); }}
                className="rounded border border-neutral-800 bg-neutral-900 p-1 text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
              >
                {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <p className="mb-2 text-[10px] leading-snug text-neutral-500">
            Splits the scene into shots and renders one picture each, with the same character look and seed, then you can play them as a slideshow or save a GIF.
            {settings.backend === 'horde' ? ' On AI Horde each frame waits in the queue, so it takes a while.' : ''}
          </p>
          {!beats ? (
            <button
              onClick={planStoryboard}
              disabled={planning || submitting}
              className="flex w-full items-center justify-center gap-2 rounded border border-neutral-700 bg-neutral-900 py-2 tracking-wider text-neutral-200 transition hover:border-fuchsia-500 hover:text-fuchsia-300 disabled:opacity-50"
            >
              {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {planning ? 'SPLITTING THE SCENE...' : `PLAN ${settings.storyboardFrames}-FRAME STORYBOARD`}
            </button>
          ) : (
            <>
              <p className={`mb-1 text-[10px] ${beatNote.startsWith('✨') ? 'text-fuchsia-400' : 'text-yellow-500/80'}`}>{beatNote} · edit any shot</p>
              <div className="mb-2 flex flex-col gap-1">
                {beats.map((beat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-right text-neutral-500">{i + 1}</span>
                    <input
                      value={beat}
                      onChange={e => setBeats(prev => (prev ? prev.map((b, j) => (j === i ? e.target.value : b)) : prev))}
                      className="w-full rounded border border-neutral-800 bg-neutral-900 p-1.5 font-sans text-xs text-neutral-200 focus:border-fuchsia-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generateStoryboard}
                  disabled={submitting || !beats.some(b => b.trim())}
                  className="flex flex-1 items-center justify-center gap-2 rounded border border-fuchsia-600 bg-fuchsia-950/60 py-2 font-bold tracking-wider text-fuchsia-300 transition hover:bg-fuchsia-900/60 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                  {submitting ? 'UPLINKING...' : `GENERATE ${beats.filter(b => b.trim()).length} FRAMES`}
                </button>
                <button onClick={() => { setBeats(null); setBeatNote(''); }} disabled={submitting} className="rounded border border-neutral-700 px-3 text-neutral-400 hover:text-white disabled:opacity-50">re-plan</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
