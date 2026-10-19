
// Deliberately setting-neutral: rain, neon and so on come from the scene itself, so an indoor scene doesn't get wet streets
export const DEFAULT_STYLE_TAGS = 'cyberpunk, cinematic lighting, highly detailed, sharp focus';
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

// ---- Offline builder -------------------------------------------------------------------------
// Used when Gemini can't write the prompt. No model involved: it keeps the sentences that describe
// something a camera could see (action verbs, bodies, gear), drops dialogue, questions and sensory
// filler, and adds setting tags it spots in the text.

const VISUAL_VERB = /\b(slid\w*|slides?|stumbl\w+|aims?|aimed|aiming|fires?|fired|firing|grabs?|grabbed|grip\w*|kneel\w*|lean\w*|leans|steps?|stepped|draws?|drew|drawn|swings?|swung|crouch\w*|holds?|held|holding|points?|pointed|leaps?|leapt|dives?|dove|ducks?|ducked|kicks?|kicked|punch\w*|slams?|slammed|shoves?|shoved|pulls?|pulled|pushes?|pushed|lifts?|lifted|raises?|raised|lowers?|lowered|turns?|turned|stares?|stared|glares?|glared|smiles?|smiled|grins?|grinned|sits?|sat|stands?|stood|walks?|walked|runs?|ran|climbs?|climbed|falls?|fell|bleeds?|bled|collapses?|collapsed|embraces?|embraced|kisses?|kissed|strips?|stripped|undress\w*|drinks?|drank|smokes?|smoked|hacks?|hacked|plugs?|plugged|split\w*|jacks?|jacked|unholsters?|levels?|leveled|sprint\w*|lunges?|lunged|dodges?|dodged|rolls?|rolled|vaults?|vaulted|spreads?|spread|knocks?|knocked|shatters?|shattered|erupts?|erupted|extends?|extended|retracts?|unfolds?|unfolded|glows?|glowed|flickers?|flickered|looms?|loomed|tower\w*|crawl\w*|spill\w*|drip\w*|burst\w*|tears?|tore|slash\w*|stab\w*|thrust\w*)\b/gi;
const BODY_OR_GEAR = /\b(hands?|fingers?|arms?|forearms?|eyes?|optics|face|jaw|blades?|gun|pistol|rifle|smg|shotgun|katana|knife|sword|chrome|cyber\w*|suit|jacket|coat|armou?r|desk|table|window|glass|door|bar|chair|couch|bed|car|bike|screen|hologram|neon|sign|rain|blood|smoke|steam)\b/gi;
const SENSORY_ONLY = /\b(smell\w*|scent|stench|tastes?|sound\w*|hiss\w*|hum\w*|echo\w*|silence|whisper\w*|thought|wonder\w*|remember\w*|feel\w*|felt|know|knew|realiz\w+)\b/gi;

const SETTING_TAGS: Array<[RegExp, string]> = [
  [/penthouse/i, 'luxury penthouse'], [/rooftop|roof\b/i, 'rooftop'], [/alley|backstreet/i, 'narrow alley'],
  [/diner|noodle|food stall|market/i, 'busy street food stall'], [/club|afterlife|lounge|\bbar\b/i, 'nightclub interior'],
  [/warehouse|dock|pier|factory|refinery/i, 'industrial warehouse'], [/apartment|bedroom|flat|megabuilding/i, 'cramped apartment'],
  [/clinic|ripperdoc|surgery|lab\b/i, 'clinic interior'], [/highway|freeway|car\b|vehicle|bike/i, 'night highway'],
  [/rain|drizzle|downpour|storm/i, 'rain'], [/neon/i, 'neon lights'], [/fog|steam|smoke/i, 'haze'],
  [/glass|window/i, 'large window'], [/night|midnight|dark/i, 'night']
];

// Second person -> something an image prompt can use: "you duck" -> "duck", "your elbow" -> "their
// elbow", "lunges at you" -> "lunges at the character"
const toStatement = (sentence: string) =>
  sentence
    .replace(/\b(at|to|toward|towards|between|behind|beside|over|from|with|around|on|against|past|near|beneath|under|above|before|after|into|onto|for) you\b/gi, '$1 the character')
    .replace(/\byour\b/gi, 'their')
    .replace(/\byou(?:'re|'ve|'ll|'d)?\s+/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[.;:,]+$/, '')
    .trim();

// Drop clauses that are only sound/smell/thought, or too short to carry meaning ("With a sharp")
const dropFiller = (sentence: string) => {
  const kept = sentence.split(/,\s*/).filter(clause => {
    const words = clause.split(/\s+/).length;
    const sensory = (clause.match(SENSORY_ONLY) || []).length;
    const visual = (clause.match(VISUAL_VERB) || []).length + (clause.match(BODY_OR_GEAR) || []).length;
    if (visual === 0) return words >= 4 && sensory === 0; // no action or object in it: keep only if substantial and not just sensory
    return words >= 2;
  });
  return kept.length ? kept.join(', ') : sentence;
};

// Trim to roughly `max` words, ending on a clause boundary instead of mid-phrase
const capAtClause = (text: string, max: number) => {
  if (text.split(/\s+/).length <= max) return text;
  const clauses = text.split(/(?<=[,;])\s+/);
  let out = '';
  for (const clause of clauses) {
    const next = out ? `${out} ${clause}` : clause;
    if (next.split(/\s+/).length > max) break;
    out = next;
  }
  return (out || text.split(/\s+/).slice(0, max).join(' ')).replace(/[.;:,]+$/, '');
};

const pickActionSentences = (text: string, count: number): string[] => {
  const noQuotes = text.replace(/["“][^"”]*["”]/g, ' ');
  const sentences = (noQuotes.match(/[^.!?]+[.!?]*/g) || []).map(x => x.trim()).filter(x => x.length > 12 && !x.endsWith('?'));
  const scored = sentences.map((sentence, index) => ({
    sentence,
    index,
    score:
      (sentence.match(VISUAL_VERB) || []).length * 2 +
      (sentence.match(BODY_OR_GEAR) || []).length -
      (sentence.match(SENSORY_ONLY) || []).length
  }));
  return scored
    .filter(x => x.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.index - b.index) // back into story order
    .map(x => capAtClause(dropFiller(toStatement(x.sentence)), 26));
};

// ---- Storyboard ------------------------------------------------------------------------------
// A storyboard is several frames of one scene. Every frame shares the same character look, setting
// tags and style, so the person stays recognisable; only the "beat" (what is happening) changes.

export const settingTags = (sceneText: string) =>
  SETTING_TAGS.filter(([re]) => re.test(stripMarkup(sceneText))).map(([, tag]) => tag).slice(0, 5);

// No model: cut the scene into `count` consecutive stretches and take the most visual sentence of each
export const offlineBeats = (sceneText: string, count: number): string[] => {
  const clean = stripMarkup(sceneText).replace(/["“][^"”]*["”]/g, ' ');
  const sentences = (clean.match(/[^.!?]+[.!?]*/g) || []).map(x => x.trim()).filter(x => x.length > 12 && !x.endsWith('?'));
  if (!sentences.length) return [];
  const score = (x: string) => (x.match(VISUAL_VERB) || []).length * 2 + (x.match(BODY_OR_GEAR) || []).length - (x.match(SENSORY_ONLY) || []).length;
  const beats: string[] = [];
  for (let i = 0; i < count; i++) {
    const from = Math.floor((i * sentences.length) / count);
    const to = Math.max(from + 1, Math.floor(((i + 1) * sentences.length) / count));
    const group = sentences.slice(from, to);
    const best = group.reduce((a, b) => (score(b) > score(a) ? b : a));
    beats.push(capAtClause(dropFiller(toStatement(best)), 18));
  }
  return beats;
};

// One frame's prompt: who they are (shared) + this beat + where (shared) + style (shared)
export const composeFramePrompt = (beat: string, sceneText: string, look?: string, styleTags = DEFAULT_STYLE_TAGS) =>
  [look ? clipToSentences(stripMarkup(look), 260) : '', beat.replace(/\byour\b/gi, 'their').replace(/\byou\b/gi, 'the character'), settingTags(sceneText).join(', '), styleTags.trim()]
    .map(p => p.replace(/[.,;\s]+$/, '')).filter(Boolean).join(', ');

// Ask the server (Gemini, or a local model) to split the scene into short visual beats
export const requestSceneBeats = async (args: { sceneText: string; recent: string[]; protagonist?: string; count: number }): Promise<string[]> => {
  const res = await fetch('/api/scene-beats', {
    method: 'POST',
    signal: AbortSignal.timeout(180000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneText: stripMarkup(args.sceneText),
      recent: args.recent.map(t => stripMarkup(t).slice(0, 1200)),
      protagonist: args.protagonist ? stripMarkup(args.protagonist) : '',
      count: args.count
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(body.beats) || !body.beats.length) {
    throw Object.assign(new Error(body.error || `Beat writer failed (${res.status})`), { quota: body.quota, retryAfterSec: body.retryAfterSec });
  }
  return body.beats as string[];
};

// `look` is the protagonist's visual description (see describeCharacterLook)
export const buildScenePrompt = (sceneText: string, look?: string, styleTags = DEFAULT_STYLE_TAGS) => {
  const clean = stripMarkup(sceneText);
  const actions = pickActionSentences(clean, 3);
  const setting = SETTING_TAGS.filter(([re]) => re.test(clean)).map(([, tag]) => tag).slice(0, 5);
  // Nothing scored (a quiet scene): fall back to the opening sentences rather than an empty prompt
  const scene = actions.length ? actions.join(', ') : clipToSentences(clean.replace(/["“][^"”]*["”]/g, ' ').replace(/[^.!?]*\?/g, ' ').replace(/\s+/g, ' ').trim() || clean, MAX_SCENE_CHARS);
  const parts = [
    look ? clipToSentences(stripMarkup(look), 260) : '',
    scene,
    setting.join(', '),
    styleTags.trim()
  ];
  return parts.map(p => p.replace(/[.,;\s]+$/, '')).filter(Boolean).join(', ');
};

// Ask the server (Gemini) to write a Stable Diffusion prompt that says who is doing what where.
// Throws when the writer is unavailable so the caller can fall back to buildScenePrompt.
const writtenPrompts = new Map<string, string>(); // so reopening a scene doesn't spend quota again

export const requestScenePrompt = async (args: {
  sceneText: string;
  recent: string[];
  protagonist?: string;
  modelName?: string;
  fresh?: boolean; // skip the cache ("rewrite from scene")
}): Promise<string> => {
  const cacheKey = `${args.modelName || ''}|${args.protagonist || ''}|${args.sceneText}`;
  const cached = !args.fresh && writtenPrompts.get(cacheKey);
  if (cached) return cached;
  const res = await fetch('/api/scene-prompt', {
    method: 'POST',
    signal: AbortSignal.timeout(180000), // slow local models need the time; Gemini alone gives up on the server after ~14s
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneText: stripMarkup(args.sceneText),
      recent: args.recent.map(t => stripMarkup(t).slice(0, 1200)),
      protagonist: args.protagonist ? stripMarkup(args.protagonist) : '',
      modelName: args.modelName || ''
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.prompt) {
    // Carry the server's reason (daily/minute quota) so the UI can explain the fallback
    throw Object.assign(new Error(body.error || `Prompt writer failed (${res.status})`), { quota: body.quota, retryAfterSec: body.retryAfterSec });
  }
  writtenPrompts.set(cacheKey, body.prompt);
  return body.prompt as string;
};

// Gemini's free quota resets at midnight Pacific time; say when that is on the player's own clock
export const geminiResetTimeLocal = (now = new Date()): string => {
  const la = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
    .formatToParts(now);
  const get = (type: string) => Number(la.find(p => p.type === type)?.value ?? 0);
  const msIntoDay = ((get('hour') * 60 + get('minute')) * 60 + get('second')) * 1000;
  const reset = new Date(now.getTime() + (24 * 3600 * 1000 - msIntoDay));
  return reset.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// One short line for the prompt box when the AI writer couldn't be used
export const describePromptFallback = (err: any): string => {
  if (err?.quota === 'daily') return `Gemini's free daily limit is used up (resets about ${geminiResetTimeLocal()})`;
  if (err?.quota === 'credits') return 'Gemini prepaid credits are used up (add funds in AI Studio billing)';
  if (err?.quota === 'minute') return `Gemini is rate-limited${err.retryAfterSec ? `, try again in ${err.retryAfterSec}s` : ''}`;
  if (err?.quota === 'unknown') return 'Gemini quota used up for now';
  return 'AI prompt writer unavailable';
};
