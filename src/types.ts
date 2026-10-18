export interface CharacterStats {
  INT: number;
  REF: number;
  DEX: number;
  TECH: number;
  COOL: number;
  WILL: number;
  LUCK: number;
  MOVE: number;
  BODY: number;
  EMP: number;
}

export type WoundState = 'Light' | 'Seriously Wounded' | 'Mortal Wound';

export interface FactionReputation {
  id: string;
  name: string;
  standing: number; // -100 to 100
  tier: 'Hostile' | 'Unfriendly' | 'Neutral' | 'Friendly' | 'Allied';
  bounty: number;
  description: string;
}

export interface NPCContact {
  id: string;
  name: string;
  role: string; // Fixer, Ripperdoc, Solo, Netrunner, Cop, Exec
  faction: string;
  trustRating: number; // 0 to 100
  favorBalance: number; // Negative means player owes favor, Positive means NPC owes player
  lastSeenLocation: string;
  notes: string;
  status: 'Active' | 'Missing' | 'Deceased' | 'Hostile';
}

export interface ChoiceChip {
  id: string;
  label: string;
  category: 'Tactical' | 'Brute' | 'Social' | 'Stealth' | 'Netrun';
  promptText: string;
  isHighStakes?: boolean;
  dv?: number;
  skill?: string;
}

export interface EnemyUnit {
  id: string;
  name: string;
  faction: string;
  hpCurrent: number;
  hpMax: number;
  spBody: number;
  iceDefense: number;
  weapon: string;
  ammoCurrent: number;
  ammoMax: number;
  status: string;
}

export interface HUDState {
  name: string;
  role: string;
  roleRank: number;
  hpCurrent: number;
  hpMax: number;
  woundState: WoundState;
  spHeadCurrent: number;
  spHeadMax: number;
  spBodyCurrent: number;
  spBodyMax: number;
  humanityCurrent: number;
  humanityMax: number;
  empCurrent: number;
  streetCred: number;
  heat: number;
  cash: number;
  activeStatusEffects: string[];
  criticalInjuries: string[];
  stats: CharacterStats;
  inventory: string[];
  customDescription?: string;
  factions?: FactionReputation[];
  contacts?: NPCContact[];
  activeChoices?: ChoiceChip[];
  activeEnemies?: EnemyUnit[];
  descriptiveDensity: number; // 1-3
  skills?: Record<string, number>; // skill name -> rank; older saves lack it (see getSkills)
}

export interface LifepathDetails {
  culturalOrigin: string;
  primaryLanguage: string;
  visualStyle: string;
  familyBackground: string;
  primaryMotivator: string;
  personality: string;
  valuedPerson: string;
  valuedPossession: string;
  lifeGoals: string;
  tragicPast: string;
}

export interface CyberwareItem {
  id: string;
  name: string;
  category: 'Neural' | 'Cyberlimb' | 'Subdermal' | 'Sensory' | 'Weaponry' | 'Bioware';
  cost: number;
  humanityLoss: string;
  description: string;
}

export interface GearItem {
  id: string;
  name: string;
  category: 'Weapon' | 'Armor' | 'Cyberdeck' | 'Medical' | 'Utility';
  cost: number;
  description: string;
}

export interface QuickhackDef {
  id: string;
  name: string;
  targetType: string;
  dv: string;
  description: string;
  effect: string;
}

export interface CriticalInjuryDef {
  roll: number;
  name: string;
  effect: string;
  treatment: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gm' | 'system';
  text: string;
  timestamp: string;
  hudUpdate?: Partial<HUDState>;
  choices?: ChoiceChip[];
  // State from just before this GM reply, so regenerate/undo can roll it back
  hudBefore?: HUDState;
  memoryBefore?: string | null;
}

export interface CheckResult {
  d10Rolls: number[];
  statVal: number;
  skillVal: number;
  modVal: number;
  total: number;
  isExploded: boolean;
  isImploded: boolean;
  dv: number;
  success: boolean;
  margin: number;
}

export interface DamageResult {
  damageDice: number[];
  rawDamage: number;
  location: 'Head' | 'Body';
  armorSP: number;
  damageBlocked: number;
  hpDamageTaken: number;
  newSP: number;
  isAblated: boolean;
  isCrushingHit: boolean;
  criticalInjury?: CriticalInjuryDef;
}

export type MissionType = 
  | 'Assassination' 
  | 'Data Theft' 
  | 'Escort' 
  | 'Sabotage' 
  | 'Heist' 
  | 'Cyberpsycho Hunt' 
  | 'Extraction';

export interface MissionGig {
  id: string;
  title: string;
  fixerName: string;
  fixerLocation: string;
  missionType: MissionType;
  district: string;
  clientOrTarget: string;
  difficultyDV: number;
  basePayout: number;
  requiredStreetCred: number;
  briefingSummary: string;
  hazards: string[];
  keySkill: string;
  loreHook: string;
}
