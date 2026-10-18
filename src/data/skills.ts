import { CharacterStats, HUDState } from '../types';

export type StatKey = keyof CharacterStats;

export interface SkillDef {
  name: string;
  stat: StatKey;
  category: 'Awareness' | 'Body' | 'Control' | 'Education' | 'Fighting' | 'Performance' | 'Ranged' | 'Social' | 'Technique' | 'Role';
}

// Cyberpunk RED core skill list with each skill's linked STAT.
export const SKILL_LIST: SkillDef[] = [
  { name: 'Concentration', stat: 'WILL', category: 'Awareness' },
  { name: 'Conceal/Reveal Object', stat: 'INT', category: 'Awareness' },
  { name: 'Lip Reading', stat: 'INT', category: 'Awareness' },
  { name: 'Perception', stat: 'INT', category: 'Awareness' },
  { name: 'Tracking', stat: 'INT', category: 'Awareness' },
  { name: 'Athletics', stat: 'DEX', category: 'Body' },
  { name: 'Contortionist', stat: 'DEX', category: 'Body' },
  { name: 'Dance', stat: 'DEX', category: 'Body' },
  { name: 'Endurance', stat: 'WILL', category: 'Body' },
  { name: 'Resist Torture/Drugs', stat: 'WILL', category: 'Body' },
  { name: 'Stealth', stat: 'DEX', category: 'Body' },
  { name: 'Drive Land Vehicle', stat: 'REF', category: 'Control' },
  { name: 'Pilot Air Vehicle', stat: 'REF', category: 'Control' },
  { name: 'Pilot Sea Vehicle', stat: 'REF', category: 'Control' },
  { name: 'Riding', stat: 'REF', category: 'Control' },
  { name: 'Accounting', stat: 'INT', category: 'Education' },
  { name: 'Animal Handling', stat: 'INT', category: 'Education' },
  { name: 'Bureaucracy', stat: 'INT', category: 'Education' },
  { name: 'Business', stat: 'INT', category: 'Education' },
  { name: 'Composition', stat: 'INT', category: 'Education' },
  { name: 'Criminology', stat: 'INT', category: 'Education' },
  { name: 'Cryptography', stat: 'INT', category: 'Education' },
  { name: 'Deduction', stat: 'INT', category: 'Education' },
  { name: 'Education', stat: 'INT', category: 'Education' },
  { name: 'Gamble', stat: 'INT', category: 'Education' },
  { name: 'Language (Streetslang)', stat: 'INT', category: 'Education' },
  { name: 'Library Search', stat: 'INT', category: 'Education' },
  { name: 'Local Expert', stat: 'INT', category: 'Education' },
  { name: 'Science', stat: 'INT', category: 'Education' },
  { name: 'Tactics', stat: 'INT', category: 'Education' },
  { name: 'Wilderness Survival', stat: 'INT', category: 'Education' },
  { name: 'Brawling', stat: 'DEX', category: 'Fighting' },
  { name: 'Evasion', stat: 'DEX', category: 'Fighting' },
  { name: 'Martial Arts', stat: 'DEX', category: 'Fighting' },
  { name: 'Melee Weapon', stat: 'DEX', category: 'Fighting' },
  { name: 'Acting', stat: 'COOL', category: 'Performance' },
  { name: 'Play Instrument', stat: 'TECH', category: 'Performance' },
  { name: 'Archery', stat: 'REF', category: 'Ranged' },
  { name: 'Autofire', stat: 'REF', category: 'Ranged' },
  { name: 'Handgun', stat: 'REF', category: 'Ranged' },
  { name: 'Heavy Weapons', stat: 'REF', category: 'Ranged' },
  { name: 'Shoulder Arms', stat: 'REF', category: 'Ranged' },
  { name: 'Bribery', stat: 'COOL', category: 'Social' },
  { name: 'Conversation', stat: 'EMP', category: 'Social' },
  { name: 'Human Perception', stat: 'EMP', category: 'Social' },
  { name: 'Interrogation', stat: 'COOL', category: 'Social' },
  { name: 'Persuasion', stat: 'COOL', category: 'Social' },
  { name: 'Personal Grooming', stat: 'COOL', category: 'Social' },
  { name: 'Streetwise', stat: 'COOL', category: 'Social' },
  { name: 'Trading', stat: 'COOL', category: 'Social' },
  { name: 'Wardrobe & Style', stat: 'COOL', category: 'Social' },
  { name: 'Air Vehicle Tech', stat: 'TECH', category: 'Technique' },
  { name: 'Basic Tech', stat: 'TECH', category: 'Technique' },
  { name: 'Cybertech', stat: 'TECH', category: 'Technique' },
  { name: 'Demolitions', stat: 'TECH', category: 'Technique' },
  { name: 'Electronics/Security Tech', stat: 'TECH', category: 'Technique' },
  { name: 'First Aid', stat: 'TECH', category: 'Technique' },
  { name: 'Forgery', stat: 'TECH', category: 'Technique' },
  { name: 'Land Vehicle Tech', stat: 'TECH', category: 'Technique' },
  { name: 'Paint/Draw/Sculpt', stat: 'TECH', category: 'Technique' },
  { name: 'Paramedic', stat: 'TECH', category: 'Technique' },
  { name: 'Photography/Film', stat: 'TECH', category: 'Technique' },
  { name: 'Pick Lock', stat: 'TECH', category: 'Technique' },
  { name: 'Pick Pocket', stat: 'TECH', category: 'Technique' },
  { name: 'Sea Vehicle Tech', stat: 'TECH', category: 'Technique' },
  { name: 'Weaponstech', stat: 'TECH', category: 'Technique' },
  // Netrunner role ability; used for netrunning and quickhack checks
  { name: 'Interface', stat: 'INT', category: 'Role' }
];

// RED's basic skills every character starts with at 2
const BASIC_SKILLS = [
  'Athletics', 'Brawling', 'Concentration', 'Conversation', 'Education', 'Evasion', 'First Aid',
  'Human Perception', 'Language (Streetslang)', 'Local Expert', 'Perception', 'Persuasion', 'Stealth'
];

// Starting skill packages per role (ranks overwrite the basic 2s)
const ROLE_PACKAGES: Record<string, Record<string, number>> = {
  Solo: { Handgun: 6, 'Shoulder Arms': 6, Autofire: 4, 'Melee Weapon': 6, Evasion: 6, Brawling: 6, Athletics: 4, Perception: 4, Tactics: 6, 'Resist Torture/Drugs': 4, Stealth: 4, Interrogation: 4 },
  Netrunner: { Interface: 6, 'Electronics/Security Tech': 6, 'Basic Tech': 6, Cryptography: 6, 'Library Search': 6, 'Conceal/Reveal Object': 4, Stealth: 6, Handgun: 4, Evasion: 4, Education: 4 },
  Tech: { 'Basic Tech': 6, Cybertech: 6, 'Electronics/Security Tech': 6, Weaponstech: 6, 'Land Vehicle Tech': 6, Demolitions: 4, Science: 4, Handgun: 4, 'Shoulder Arms': 4 },
  Medtech: { Paramedic: 6, 'First Aid': 6, Science: 6, Cybertech: 4, 'Human Perception': 6, Deduction: 4, Handgun: 4, 'Resist Torture/Drugs': 4 },
  Fixer: { Trading: 6, Bribery: 6, Business: 6, Streetwise: 6, Persuasion: 6, 'Human Perception': 6, 'Local Expert': 6, Conversation: 4, Handgun: 4 },
  Nomad: { 'Drive Land Vehicle': 6, 'Land Vehicle Tech': 6, 'Wilderness Survival': 6, 'Melee Weapon': 4, 'Shoulder Arms': 4, Tracking: 4, Endurance: 4 },
  Media: { Composition: 6, Deduction: 6, Persuasion: 6, 'Photography/Film': 6, 'Human Perception': 6, 'Library Search': 4, Handgun: 4 },
  Exec: { Business: 6, Bureaucracy: 6, Persuasion: 6, 'Wardrobe & Style': 4, 'Human Perception': 4, Accounting: 4, Handgun: 4 },
  Lawman: { Handgun: 6, Criminology: 6, Interrogation: 6, 'Shoulder Arms': 4, Tracking: 4, Deduction: 4, 'Drive Land Vehicle': 4 },
  Rockerboy: { 'Play Instrument': 6, Composition: 6, Persuasion: 6, 'Wardrobe & Style': 4, Streetwise: 4, Brawling: 4, Handgun: 4 }
};

export function buildDefaultSkills(role: string): Record<string, number> {
  const skills: Record<string, number> = {};
  for (const s of SKILL_LIST) skills[s.name] = 0;
  for (const s of BASIC_SKILLS) skills[s] = 2;
  const pkg = ROLE_PACKAGES[role] || ROLE_PACKAGES[Object.keys(ROLE_PACKAGES).find(r => role.toLowerCase().includes(r.toLowerCase())) || ''] || {};
  return { ...skills, ...pkg };
}

// Characters and saves from before the skill sheet existed have no skills; derive them from the role.
export function getSkills(hud: Pick<HUDState, 'role' | 'skills'>): Record<string, number> {
  return hud.skills && Object.keys(hud.skills).length ? hud.skills : buildDefaultSkills(hud.role);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

// Common ways the GM (or a player) names a skill that isn't its exact RED name
const ALIASES: Record<string, string> = {
  electronics: 'Electronics/Security Tech', security: 'Electronics/Security Tech', securitytech: 'Electronics/Security Tech',
  netrun: 'Interface', netrunning: 'Interface', hacking: 'Interface', hack: 'Interface', quickhack: 'Interface',
  pistol: 'Handgun', pistols: 'Handgun', rifle: 'Shoulder Arms', rifles: 'Shoulder Arms', shotgun: 'Shoulder Arms',
  melee: 'Melee Weapon', blade: 'Melee Weapon', blades: 'Melee Weapon', unarmed: 'Brawling',
  insight: 'Human Perception', empathy: 'Human Perception', readpeople: 'Human Perception',
  intimidation: 'Interrogation', intimidate: 'Interrogation', deception: 'Acting', bluff: 'Acting',
  driving: 'Drive Land Vehicle', drive: 'Drive Land Vehicle', piloting: 'Pilot Air Vehicle',
  medicine: 'Paramedic', medical: 'Paramedic', investigation: 'Deduction', awareness: 'Perception',
  lockpicking: 'Pick Lock', sleightofhand: 'Pick Pocket', explosives: 'Demolitions', climbing: 'Athletics',
  language: 'Language (Streetslang)', streetslang: 'Language (Streetslang)', heavyweapon: 'Heavy Weapons'
};

const STAT_NAMES = /^(INT|REF|DEX|TECH|COOL|WILL|LUCK|MOVE|BODY|EMP)$/i;

const matchOne = (raw: string): SkillDef | undefined => {
  const whole = norm(raw);
  const key = norm(raw.replace(/\([^)]*\)/g, ' ').split('/')[0]);
  if (!key) return undefined;
  const exact = SKILL_LIST.find(s => norm(s.name) === whole || norm(s.name) === key);
  if (exact) return exact;
  if (ALIASES[key]) return SKILL_LIST.find(s => s.name === ALIASES[key]);
  const alias = Object.keys(ALIASES).find(a => key.includes(a));
  if (alias) return SKILL_LIST.find(s => s.name === ALIASES[alias]);
  // Partial names only when long enough to be unambiguous ("perc" -> Perception)
  return key.length >= 4 ? SKILL_LIST.find(s => norm(s.name).startsWith(key) || key.startsWith(norm(s.name))) : undefined;
};

// Resolve a free-text skill name (e.g. "Electronics", "Netrun", "INT + Perception", "Handgun (REF)").
export function findSkill(name: string | undefined): SkillDef | undefined {
  if (!name) return undefined;
  const direct = SKILL_LIST.find(s => norm(s.name) === norm(name));
  if (direct) return direct;
  const parts = name.split(/[+,]| or /i).map(p => p.trim()).filter(p => p && !STAT_NAMES.test(p));
  for (const part of parts) {
    const hit = matchOne(part);
    if (hit) return hit;
  }
  return undefined;
}
