import { HUDState } from '../types';

// Builds a short visual description of the player's character for scene art, from everything the
// sheet knows: the player's own description, the lifepath's fashion style, installed chrome that
// shows, weapons and armour in the inventory, and current wounds. The result is a comma-separated
// phrase list: it goes to the AI prompt writer as the "character sheet" and straight into the
// offline prompt builder.

// What a role looks like at a glance (RED roles); unknown roles fall back to the role name
const ROLE_LOOK: Array<[RegExp, string]> = [
  [/solo/i, 'street mercenary'], [/netrunner/i, 'netrunner'], [/tech/i, 'street techie'], [/medtech|medic/i, 'medic'],
  [/fixer/i, 'street fixer'], [/nomad/i, 'road nomad'], [/media/i, 'journalist'], [/exec/i, 'corporate executive'],
  [/law/i, 'lawman'], [/rocker/i, 'rockerboy']
];

// Chrome that is visible from outside, in the words an image model understands.
// Hidden chrome (armour under the skin, neural boosters, organs) is deliberately absent.
const VISIBLE_CHROME: Array<[RegExp, string]> = [
  [/tsukuyomi/i, 'blood-red irises with three black tomoe'],
  [/cybereyes|kiroshi|optics|targeting scoop|visual cortex/i, 'glowing cybernetic eyes'],
  [/mantis/i, 'mantis blades built into the forearms'],
  [/mono-?we?i?re/i, 'monowire coiled at the wrist'],
  [/gorilla/i, 'massive chrome gorilla arms'],
  [/cyberarm|tool hand|med-scanner arm/i, 'chrome cybernetic arm'],
  [/light tattoo/i, 'glowing animated tattoos'],
  [/optical camo/i, 'shimmering optical-camo skin'],
  [/cyberaudio|audio scope/i, 'cybernetic ear implants'],
  [/interface plugs|neural link|cyberdeck port|smartgun link/i, 'neural interface plugs behind the ear'],
  [/projectile launch/i, 'grenade launcher in the forearm']
];

const WEAPON = /rifle|pistol|smg|shotgun|katana|sword|knife|blade|bow\b|launcher|taser|revolver|machete|axe\b|bat\b/i;
const WEARABLE = /armou?r|vest|jacket|coat|duster|suit|helmet|kevlar|\bjack\b|hoodie|boots|mask|shades|visor|cloak/i;
const BRAND = /\b(militech|arasaka|kang tao|dai lung|budget ?arms|federated arms|rostovic|midnight arms|zetatech|custom|engraved|heavy|very heavy)\b/gi;

// Sentences of the player's description that say what the character LOOKS like (the rest is backstory)
const LOOK_WORDS = /\b(hair|mohawk|bald|eyes?|skin|face|scar\w*|tattoo\w*|tall|short|slim|lean|broad|muscular|stocky|build|beard|jaw|wearing|wears|dressed|coat|jacket|duster|suit|boots|leather|hood\w*|mask|chrome|cyber\w*|implants?|optics|glowing|neon|dyed|pierc\w*|makeup|gaunt|athletic)\b/i;

const clip = (text: string, max: number) => {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max).replace(/[,;:\s]+\S*$/, '');
};

const lookSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .filter(s => LOOK_WORDS.test(s))
    .join(' ')
    .replace(/[.!?]+$/, '');

// "High Chrome: Metallic fabrics, glowing LED trims." -> "High Chrome fashion: metallic fabrics, glowing LED trims"
const fashionFromLifepath = (style: string) => {
  const m = style.match(/^([^:]+):\s*(.+)$/);
  if (!m) return clip(style, 120);
  const detail = m[2].replace(/\.$/, '');
  return `${m[1].trim()} fashion, ${detail.charAt(0).toLowerCase()}${detail.slice(1)}`; // keep acronyms like LED intact
};

const tidyGear = (name: string) =>
  name.replace(/\([^)]*\)/g, '').replace(BRAND, '').replace(/\s+/g, ' ').trim().toLowerCase();

export function describeCharacterLook(hud: Partial<HUDState>): string {
  const inventory = hud.inventory || [];
  const chromeNames = inventory.filter(i => /^cyberware:/i.test(i)).map(i => i.replace(/^cyberware:\s*/i, ''));
  const gear = inventory.filter(i => !/^cyberware:/i.test(i));

  const parts: string[] = [];

  // 1. Who they are
  const role = ROLE_LOOK.find(([re]) => re.test(hud.role || ''))?.[1] || (hud.role ? hud.role.toLowerCase() : '');
  if (role) parts.push(role);

  // 2. The player's own description, minus backstory
  const written = hud.customDescription ? lookSentences(hud.customDescription) : '';
  if (written) parts.push(clip(written, 220));

  // 3. Fashion from the lifepath they rolled or picked
  if (hud.lifepath?.visualStyle) parts.push(fashionFromLifepath(hud.lifepath.visualStyle));

  // 4. Chrome you can see
  const chrome = Array.from(new Set(
    chromeNames.flatMap(name => VISIBLE_CHROME.filter(([re]) => re.test(name)).map(([, look]) => look))
      // a custom description or a worn/inventory item may carry chrome too
      .concat(VISIBLE_CHROME.filter(([re]) => gear.some(g => re.test(g))).map(([, look]) => look))
  )).slice(0, 3);
  if (chrome.length) parts.push(chrome.join(', '));

  // 5. What they carry and wear
  const weapons = gear.filter(g => WEAPON.test(g)).map(tidyGear).filter(Boolean).slice(0, 2);
  if (weapons.length) parts.push(`armed with ${weapons.join(' and ')}`);
  const worn = gear.filter(g => WEARABLE.test(g) && !WEAPON.test(g)).map(tidyGear).filter(Boolean).slice(0, 2);
  if (worn.length) parts.push(`wearing ${worn.join(' and ')}`);

  // 6. Condition right now
  if (hud.woundState === 'Mortal Wound') parts.push('critically wounded, soaked in blood');
  else if (hud.woundState === 'Seriously Wounded') parts.push('bloodied and wounded');
  const injuries = (hud.criticalInjuries || []).map(i => i.split('(')[0].trim().toLowerCase()).filter(Boolean).slice(0, 2);
  if (injuries.length) parts.push(injuries.join(', '));

  return parts.join(', ');
}
