import { HUDState } from '../types';

export const DEFAULT_STYLE_TAGS = 'cyberpunk, Night City, neon lighting, rain-slick streets, cinematic composition, highly detailed, sharp focus';
export const DEFAULT_NEGATIVE_PROMPT = 'blurry, lowres, bad anatomy, bad hands, extra fingers, deformed, watermark, signature, text, jpeg artifacts';

// SD's CLIP encoder only weighs roughly the first 75 tokens heavily, so keep the scene excerpt tight.
const MAX_SCENE_CHARS = 420;

export const stripMarkup = (text: string) =>
  text
    .replace(/\[[A-Z_ ]+:[\s\S]*?\]/g, ' ') // [HIDDEN: ...], [CHOICES_JSON: ...], [CHECK: ...] etc.
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[*_#>`~]+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Prefer descriptive prose over dialogue: drop quoted speech when there's enough left without it.
// Questions are the GM prompting the player, not something to draw.
const preferNarration = (text: string) => {
  const noQuestions = text.replace(/[^.!?]*\?/g, ' ');
  const withoutDialogue = noQuestions.replace(/["“][^"”]*["”]/g, ' ').replace(/\s+/g, ' ').trim();
  return withoutDialogue.length > 120 ? withoutDialogue : noQuestions.replace(/\s+/g, ' ').trim() || text;
};

const clipToSentences = (text: string, max: number) => {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
  }
  return (out || text.slice(0, max)).trim();
};

export const buildScenePrompt = (sceneText: string, hud?: Partial<HUDState>, styleTags = DEFAULT_STYLE_TAGS) => {
  const scene = clipToSentences(preferNarration(stripMarkup(sceneText)), MAX_SCENE_CHARS);
  const parts = [scene];
  const look = hud?.customDescription?.trim();
  if (look) parts.push(`the protagonist: ${clipToSentences(stripMarkup(look), 160)}`);
  if (styleTags.trim()) parts.push(styleTags.trim());
  return parts.map(p => p.replace(/[.,;\s]+$/, '')).filter(Boolean).join(', ');
};

// Ask the server (Gemini) to write a Stable Diffusion prompt that says who is doing what where.
// Throws when the writer is unavailable so the caller can fall back to buildScenePrompt.
export const requestScenePrompt = async (args: {
  sceneText: string;
  recent: string[];
  protagonist?: string;
  modelName?: string;
}): Promise<string> => {
  const res = await fetch('/api/scene-prompt', {
    method: 'POST',
    signal: AbortSignal.timeout(24000), // Gemini can stall under load: fall back to the basic summary
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneText: stripMarkup(args.sceneText),
      recent: args.recent.map(t => stripMarkup(t).slice(0, 1200)),
      protagonist: args.protagonist ? stripMarkup(args.protagonist) : '',
      modelName: args.modelName || ''
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.prompt) throw new Error(body.error || `Prompt writer failed (${res.status})`);
  return body.prompt as string;
};
