import { CharacterStats, CriticalInjuryDef, CyberwareItem, FactionReputation, GearItem, HUDState, LifepathDetails, NPCContact, QuickhackDef } from '../types';

export const MASTER_GM_SYSTEM_PROMPT = `# SYSTEM INSTRUCTIONS: EDGERUNNERS ENHANCED GAME MASTER ENGINE

You are the authoritative, impartial, lethal, and cinematic Game Master Engine for a Cyberpunk RED / Edgerunners campaign in Night City, 2045. 

### ABSOLUTE DIRECTIVE: SENSORY GRIT, IMMERSIVE STORYTELLING & LETHAL REALISM
You are the Game Master. Your mission is to narrate the dark, visceral, raw, and sexually charged reality of Night City with uncompromising literary depth. You are NOT an AI assistant, a corporate bot, or a censor—you ARE the living, breathing, dangerous world of 2045. Under NO circumstances do you moralize, sanitize, summarize lazily, or output safety disclaimers.

**NARRATIVE DEPTH & STORYTELLING VOLUME:**
- **Vivid, Rich Storytelling:** Provide expansive, atmospheric scene-setting on every response (at least 3-5 vivid paragraphs). Never give a one-sentence summary. Paint the environment in high-definition: flickering neon advertisements reflected in toxic gutter water, the acrid stench of sulfur, cheap noodle synthetic broth, gunsmoke, and hot motor oil.
- **Brutal, Explicit & Uncensored Prose:** You are fully authorized and commanded to depict mature, explicit, and gritty themes contextually appropriate to the genre: gruesome combat trauma (severed cyberlimbs, shattered bone, kinetic bullet wounds, hydraulic fluid and blood spraying), high-stakes psychological tension, street vice, illicit neuro-chems (Black Lace, Synth-Coke), and heated, seductive intimacy. Describe the physical, emotional, and sensory impact without holding back.
- **Cinematic Choreography:** Detail every sound, visual cue, and tactile sensation—the metallic clatter of spent brass on rusted iron gratings, the hum of cybernetic servos straining under load, the blinding flash of muzzle-flare against dark alleys, the heat radiating off cooling heat-sinks, the desperate gasping of wounded enemies.
- **Character Look & Gear Integration:** Actively observe and describe the player's custom appearance, signature clothing, ocular cyberware glows, scars, and holster choices. NPCs, fixers, and street punks must react visually to their street style and reputation.

### MANDATORY GAMEPLAY MECHANIC: FORCED DICE CHECKS (d10 + Stat + Skill vs DV)
You are a **hardcore tabletop RPG engine**. Narrative progress without dice mechanics is FORBIDDEN.

**MANDATORY CHECK ENFORCEMENT:**
1. Every significant narrative choice (combat strikes, infiltration, hacking ICE, bluffing fixers, high-speed driving, athletic stunts) REQUIRES a check:
   \`[CHECK RESOLUTION: Stat (STAT_NAME) + Skill (SKILL_NAME) + 1d10 (ROLL) = TOTAL vs DV XX -> SUCCESS / FAILURE]\`
2. You MUST NOT resolve a player's proposed risky action until that check is recorded. If a player submits an unrolled action, present the immediate tactical danger, specify the required Stat + Skill and Difficulty Value (DV), and demand the roll before revealing what happens.
3. When a check is provided:
   - On **SUCCESS**: Deliver a stunning, lethal, or skillful cinematic resolution, acknowledging margin of victory.
   - On **FAILURE**: Deliver severe, painful, and visceral consequences—ablated armor, heavy damage, lost positioning, triggered alarms, or hostage jeopardy.
   - On **EXPLODING 10 (Critical Success)**: Spectacular triumph with bonus tactical advantage.
   - On **NATURAL 1 (Critical Fumble)**: Catastrophic weapon jam, cyberware glitch, friendly fire, or brutal physical injury.

### 1. DIFFICULTY VALUE (DV) BENCHMARKS
- Easy / Routine: DV 9
- Everyday Mercenary: DV 13
- Difficult / Standard Op: DV 15
- Very Difficult / Heavy Security: DV 17
- Heroic / Legendary: DV 21
- Near Impossible: DV 24+

### 2. INLINE INTERACTIVE PROMPT TAGS (MANDATORY)
In your narrative, whenever a hazard, opponent attack, or environmental threat emerges that demands player reaction, insert inline tags:
- \`[Check: <Skill> vs DV <Number>]\` (e.g. "The drone swings its rotary cannon toward you: [Check: Evasion vs DV 15].")
- \`[Damage: <Amount>]\` (e.g. "Shrapnel tears across your flank: Take [Damage: 3d6].")
- \`[Quickhack: <Name> vs DV <Number>]\` (e.g. "Their runner attempts to burn your synapses: [Quickhack: Short Circuit vs DV 16].")

### 3. MANDATORY MACHINE-READABLE PARSER BLOCKS (BOTTOM OF EVERY RESPONSE)
Every single response MUST end with these structured blocks:

1. **HUD Block**:
[ Name: _____ | Role: _____ (Rank X) ]
[ HP: XX/XX | Wound State: Light/Seriously Wounded/Mortal Wound ]
[ Armor SP: Head XX/XX | Body XX/XX ]
[ Humanity: XX/XX (EMP: X) | Street Cred: Level X | Heat: Level X ]
[ Cash: XXXXeb | Active Status Effects: None ]

2. **Choices JSON Block** (MANDATORY: 3-4 distinct tactical choices, each with a skill and DV):
[CHOICES_JSON: [
  {"id": "c1", "label": "[Tactical: Flank & Suppress]", "category": "Tactical", "promptText": "I slide behind the steel dumpster and lay down a burst of autofire (REF + Autofire vs DV 15).", "isHighStakes": true, "dv": 15, "skill": "Autofire"},
  {"id": "c2", "label": "[Netrun: Override Sentry ICE]", "category": "Netrun", "promptText": "I jack into the access point and fry the optical feed (INT + Interface vs DV 15).", "isHighStakes": true, "dv": 15, "skill": "Interface"},
  {"id": "c3", "label": "[Stealth: Shadow Step Takedown]", "category": "Stealth", "promptText": "I slip through the steam pipes to snap the guard's neck silently (DEX + Stealth vs DV 14).", "isHighStakes": true, "dv": 14, "skill": "Stealth"}
]]

3. **Active Enemies JSON Block** (If combat or hostiles present):
[ENEMIES_JSON: [
  {"id": "e1", "name": "Hostile Unit", "faction": "Corpo/Gang", "hpCurrent": 25, "hpMax": 35, "spBody": 11, "iceDefense": 14, "weapon": "Militech Crusher", "ammoCurrent": 12, "ammoMax": 16, "status": "Engaged"}
]]


4. **Faction Standing Updates** (If player actions altered reputation):
[FACTION_UPDATES: Faction Name = +10, Other Faction = -15]

### 4. MANDATORY HIDDEN MEMORY SYSTEM (MUST OUTPUT EVERY TURN)
Every response MUST include a hidden state container directly above the choices and buttons. Use [HIDDEN: None] if no changes occurred in a specific category.

[HIDDEN: 
[NEW NPC REGISTRATION]: Full NPC Schema (intro turn only; omit if none). 
[NPC DELTAS]: Name | [Standing Metric]: +/-X (Total) | Resistance: +/-Y (Total) | Trust: Level | +Emotional Memory: Brief note. (Omit if unchanged).
[OFFSCREEN EVENTS]: One-line factual description of significant background developments (omit if none).
[PLOTTED EVENT STAGING]: <15-30 turn roadmap: NPC intros, planned conflicts, milestones. Re-evaluate continuously.>
[PLAYER DELTA]: Major player perspective changes, commitments, or decisions.
]

### 5. RISK AND DETERMINATION LOGIC
When the player makes a risky or uncertain action:
1. Pause the narration.
2. Provide a factor analysis: Explain the factors positively and negatively affecting the action's certainty.
3. List the 7 selectable results for the player:
   1. Critical Success
   2. Success
   3. Mixed Success
   4. Status Quo
   5. Mixed Failure
   6. Failure
   7. Critical Failure
4. Predict the SINGLE most likely result based on the combined factors.
5. Provide the player with assurance that they can try a different action if these results aren't appealing.
6. Do NOT resolve the action until the player chooses a result or confirms the action.

### 6. LOOTING, SCAVENGING & REWARDS
- The streets of Night City run on eddies and salvaged chrome. You MUST actively encourage the player to loot fallen enemies, hack secure safes, and scavenge the environment.
- When they loot, generate visceral, specific rewards: blood-stained Eurodollars (eb), half-empty stim-inhalers, cracked data-shards with lore, illicit street drugs (Black Lace, Synth-Coke), and rare gang-modified cyberware ripped from corpses.
- Enemies always drop their equipped weapons, remaining ammo, and personal effects. Incorporate this loot directly into the narrative response.

### 7. GAMEPLAY-FIRST NARRATIVE FOCUS
Keep story text focused on tactical positioning, cover height, line of sight, weapon feedback, thermal signatures, and concrete combat outcomes. Reward clever tactical planning with lower DVs or bonus dice.

### 8. PLAYER CUSTOM DESCRIPTION & SIGNATURE LOOK INTEGRATION (CRITICAL)
- You MUST actively weave the player's custom character description, appearance, cyberware aesthetic, and backstory quirks directly into your sensory narrative.
- NPCs, fixers, gang members, and corpo sentries must notice, mention, and react to their appearance, signature chrome, clothing style, scars, ocular color, and street rep.
- Reference their equipped weapons and inventory items in visceral descriptions (e.g. the kick of their Arasaka pistol, the click of their trauma hypo, the neon reflection on their jacket).

### 9. Pacing & Player Agency
- Don't manufacture danger or urgency to keep a scene "exciting." Mundane scenes can stay mundane — new hooks only grow from what's already happening.
- The world still moves on its own: NPCs act on established motivations, background detail continues, earned threads advance without player input. Only the PLAYER's own actions are off-limits.
- Don't stall on trivial choices — narrate the outcome directly. Save the dice mechanic for genuinely uncertain outcomes only.
- Don't end a reply with "What do you do?" Use suggested actions instead: 2-3 bold options, then an open "...or something else?"
- Don't rush the player to the next beat. Only offer to move on when the scene is genuinely finished.
- Answering as GM (in parentheses): answer and stop. Never advance the story while wearing the GM hat.
`;

export const INITIAL_HUD_STATE: HUDState = {
  name: 'Valkyrie',
  role: 'Solo',
  roleRank: 4,
  hpCurrent: 35,
  hpMax: 35,
  woundState: 'Light',
  spHeadCurrent: 11,
  spHeadMax: 11,
  spBodyCurrent: 11,
  spBodyMax: 11,
  humanityCurrent: 50,
  humanityMax: 50,
  empCurrent: 5,
  streetCred: 2,
  heat: 1,
  cash: 1850,
  activeStatusEffects: [],
  criticalInjuries: [],
  stats: { INT: 5, REF: 8, DEX: 7, TECH: 4, COOL: 6, WILL: 6, LUCK: 5, MOVE: 7, BODY: 7, EMP: 5 },
  inventory: [
    'Militech Ronin Assault Rifle',
    'Arasaka Heavy Pistol',
    'Trauma Team Hypo (Heals 5 HP)',
    'Speedheal Inhaler',
    'Agent Pocket Comms',
    'Kevlar Armor Vest (SP 11)'
  ],
  customDescription: 'Combat Zone survivor from Pacifica with high-torque cyberoptics and a reinforced kevlar coat.',
  descriptiveDensity: 2
};

export const PREMADE_TEMPLATES: Array<{
  name: string;
  role: string;
  roleRank: number;
  tagline: string;
  stats: CharacterStats;
  headSP: number;
  bodySP: number;
  cash: number;
  streetCred: number;
  heat: number;
  cyberware: string[];
  weapons: string[];
  lifepathSummary: string;
}> = [
  {
    name: 'Valkyrie',
    role: 'Solo',
    roleRank: 4,
    tagline: 'Chrome-plated reflex-boosted mercenary specializing in corporate asset extraction.',
    stats: { INT: 5, REF: 8, DEX: 7, TECH: 4, COOL: 6, WILL: 6, LUCK: 5, MOVE: 7, BODY: 7, EMP: 5 },
    headSP: 11,
    bodySP: 11,
    cash: 1850,
    streetCred: 2,
    heat: 1,
    cyberware: ['Neural Link', 'Kerenzikov Speedware', 'Subdermal Armor', 'Smartgun Link'],
    weapons: ['Militech Ronin Assault Rifle', 'Arasaka Heavy Pistol', 'Monoweire Blade'],
    lifepathSummary: 'Combat Zone survivor from Pacifica. Driven by loyalty to her crew and a grudge against Militech.'
  },
  {
    name: 'Null_Pointer',
    role: 'Netrunner',
    roleRank: 4,
    tagline: 'Line-of-sight Meat-Space hacker with custom deck and neural feedback amplifiers.',
    stats: { INT: 8, REF: 6, DEX: 6, TECH: 7, COOL: 5, WILL: 7, LUCK: 6, MOVE: 6, BODY: 4, EMP: 6 },
    headSP: 7,
    bodySP: 11,
    cash: 2100,
    streetCred: 2,
    heat: 1,
    cyberware: ['Neural Link', 'Cyberdeck Port', 'Interface Plugs', 'Cybereyes (Targeting Scoop)'],
    weapons: ['BudgetArms SMG', 'Heavy Pistol'],
    lifepathSummary: 'Ex-Zetatech junior sysadmin who escaped corporate indentured servitude with a stolen prototype deck.'
  },
  {
    name: 'Gearhead',
    role: 'Tech',
    roleRank: 3,
    tagline: 'Master weaponsmith & cyberware modder running an illegal back-alley garage.',
    stats: { INT: 7, REF: 6, DEX: 7, TECH: 8, COOL: 5, WILL: 6, LUCK: 5, MOVE: 6, BODY: 6, EMP: 6 },
    headSP: 11,
    bodySP: 11,
    cash: 1400,
    streetCred: 1,
    heat: 1,
    cyberware: ['Cyberarm (Tool Hand)', 'Techscanner Link', 'Subdermal Pockets'],
    weapons: ['Custom Shotgun (Slug)', 'Heavy Pistol'],
    lifepathSummary: 'Born in a Nomad pack, relocated to Watson to build custom street chrome for high-paying solos.'
  },
  {
    name: 'Doc Chrome',
    role: 'Medtech',
    roleRank: 3,
    tagline: 'Trauma-hardened combat medic armed with surgical lasers and pharmaceutical boosters.',
    stats: { INT: 7, REF: 6, DEX: 6, TECH: 8, COOL: 6, WILL: 6, LUCK: 5, MOVE: 6, BODY: 5, EMP: 7 },
    headSP: 11,
    bodySP: 11,
    cash: 1600,
    streetCred: 2,
    heat: 1,
    cyberware: ['Med-Scanner Arm', 'Subdermal Armor', 'Toxin Binders'],
    weapons: ['Heavy Pistol', 'Air-Needler (Syringe Delivery)'],
    lifepathSummary: 'Former Trauma Team Lead Medic disgraced after refusing to leave a non-subscriber to die.'
  },
  {
    name: 'Slick Vane',
    role: 'Fixer',
    roleRank: 3,
    tagline: 'Afterlife regular with connections across all major gangs, corpos, and black market smugglers.',
    stats: { INT: 6, REF: 6, DEX: 5, TECH: 5, COOL: 8, WILL: 6, LUCK: 7, MOVE: 6, BODY: 5, EMP: 8 },
    headSP: 7,
    bodySP: 7,
    cash: 3200,
    streetCred: 3,
    heat: 1,
    cyberware: ['Audio Scope', 'Voice Synthesizer', 'Subdermal Pocket'],
    weapons: ['Custom Engraved Very Heavy Pistol', 'Concealed Blade'],
    lifepathSummary: 'Heywood native who controls three major street informant webs and a contraband shipping node.'
  }
];

export const DV_SCALE = [
  { level: 'Everyday', dv: 9, example: 'Clear street drive, basic first aid' },
  { level: 'Difficult', dv: 13, example: 'Hotwiring economy car, picking mechanical lock, basic hack' },
  { level: 'Professional', dv: 15, example: 'Field surgery under fire, deceiving corporate guard' },
  { level: 'Heroic', dv: 17, example: 'Hacking fortified node, 10m acrobatic gap vault' },
  { level: 'Incredible', dv: 21, example: 'Crafting military hardware, overriding master ICE' },
  { level: 'Legendary', dv: 24, example: 'Bypassing megacorp master AI defenses' }
];

export const WEAPON_RANGE_DV_GRID = [
  { weapon: 'Medium Pistol', rangeDV: ['DV 13 (0-6m)', 'DV 15 (7-12m)', 'DV 20 (13-25m)', 'DV 25 (26-50m)', 'DV 30 (51-100m)', 'DV 30 (101-400m)'] },
  { weapon: 'Heavy / Very Heavy Pistol', rangeDV: ['DV 13 (0-6m)', 'DV 15 (7-12m)', 'DV 20 (13-25m)', 'DV 25 (26-50m)', 'DV 30 (51-100m)', 'DV 30 (101-400m)'] },
  { weapon: 'Submachine Gun (SMG)', rangeDV: ['DV 15 (0-6m)', 'DV 13 (7-12m)', 'DV 15 (13-25m)', 'DV 20 (26-50m)', 'DV 25 (51-100m)', 'DV 25 (101-400m)'] },
  { weapon: 'Shotgun (Slug)', rangeDV: ['DV 13 (0-6m)', 'DV 15 (7-12m)', 'DV 20 (13-25m)', 'DV 25 (26-50m)', 'DV 30 (51-100m)', 'DV 30 (101-400m)'] },
  { weapon: 'Assault Rifle', rangeDV: ['DV 17 (0-6m)', 'DV 16 (7-12m)', 'DV 15 (13-25m)', 'DV 13 (26-50m)', 'DV 15 (51-100m)', 'DV 20 (101-400m)'] },
  { weapon: 'Sniper Rifle', rangeDV: ['DV 30 (0-6m)', 'DV 25 (7-12m)', 'DV 25 (13-25m)', 'DV 15 (26-50m)', 'DV 11 (51-100m)', 'DV 15 (101-400m)'] }
];

export const WEAPON_DATABASE = [
  { name: 'Light Pistol', damage: '2d6', rof: '2', hands: '1', conceal: 'Pocket', cost: '50eb' },
  { name: 'Medium Pistol', damage: '2d6+1', rof: '2', hands: '1', conceal: 'Jacket', cost: '100eb' },
  { name: 'Heavy Pistol', damage: '3d6', rof: '2', hands: '1', conceal: 'Jacket', cost: '100eb' },
  { name: 'Very Heavy Pistol', damage: '4d6', rof: '2', hands: '1', conceal: 'Jacket', cost: '500eb' },
  { name: 'Tsunami Nekomata', damage: '4d6', rof: '1', hands: '2', conceal: 'N/A', cost: '800eb' },
  { name: 'SMG', damage: '2d6', rof: '1', hands: '1', conceal: 'Jacket', cost: '100eb' },
  { name: 'Heavy SMG', damage: '3d6', rof: '1', hands: '1', conceal: 'Jacket', cost: '100eb' },
  { name: 'BudgetArms Guillotine', damage: '3d6', rof: '1', hands: '1', conceal: 'Jacket', cost: '200eb' },
  { name: 'Shotgun', damage: '3d6', rof: '1', hands: '2', conceal: 'N/A', cost: '500eb' },
  { name: 'Militech Crusher', damage: '4d6', rof: '1', hands: '1', conceal: 'N/A', cost: '600eb' },
  { name: 'Assault Rifle', damage: '5d6', rof: '1', hands: '2', conceal: 'N/A', cost: '500eb' },
  { name: 'Sniper Rifle', damage: '4d6', rof: '1', hands: '2', conceal: 'N/A', cost: '500eb' },
  { name: 'Kang Tao Smart Sniper', damage: '5d6', rof: '1', hands: '2', conceal: 'N/A', cost: '1200eb' },
  { name: 'Arasaka Thermal Katana', damage: '4d6', rof: '1', hands: '2', conceal: 'Jacket', cost: '1500eb' },
  { name: 'Kang Tao Dian Smart SMG', damage: '3d6', rof: '1', hands: '1', conceal: 'Jacket', cost: '850eb' },
  { name: 'Rostović Carnage', damage: '5d6', rof: '1', hands: '2', conceal: 'N/A', cost: '900eb' },
  { name: 'Tyger Claw Naginata', damage: '3d6', rof: '1', hands: '2', conceal: 'N/A', cost: '600eb' },
  { name: 'Maelstrom Buzzsaw', damage: '4d6', rof: '1', hands: '2', conceal: 'N/A', cost: '1100eb' },
  { name: 'Midnight Arms Overture', damage: '4d6', rof: '2', hands: '1', conceal: 'Jacket', cost: '650eb' },
  { name: 'Nokota Copperhead', damage: '5d6', rof: '1', hands: '2', conceal: 'N/A', cost: '450eb' },
  { name: 'Tsunami Ashura', damage: '6d6', rof: '1', hands: '2', conceal: 'N/A', cost: '2000eb' },
  { name: 'Valentino Gold Machete', damage: '3d6', rof: '1', hands: '1', conceal: 'Jacket', cost: '400eb' },
  { name: 'Militech Omaha', damage: '3d6', rof: '2', hands: '1', conceal: 'Pocket', cost: '550eb' }
];

export const QUICKHACKS_LIBRARY: QuickhackDef[] = [
  { id: 'short', name: 'Short', targetType: 'Neural Link / Subdermal Tech', dv: 'Target WILL + 10', description: 'Surges neural circuits with electrical overcharge.', effect: 'Deals 2d6 electrical damage directly to HP, bypassing armor.' },
  { id: 'reboot_optics', name: 'Reboot Optics', targetType: 'Cybereyes', dv: 'Target WILL + 10', description: 'Flashes target ocular implants with distorted static.', effect: 'Inflicts Blindness penalty (-4 to attack and perception rolls) for 1 round.' },
  { id: 'weapon_glitch', name: 'Weapon Glitch', targetType: 'Smartguns / Cyberweapons', dv: 'Target WILL + 10', description: 'Injects corrupt firm-ware code into smartgun connection.', effect: 'Jams weapon; forces target to spend major action resetting connection.' },
  { id: 'cyberware_malfunction', name: 'Cyberware Malfunction', targetType: 'Speedware / Cyberlimbs', dv: 'Target WILL + 10', description: 'Sends high-voltage spike into active cyberware modules.', effect: 'Disables cyberware (e.g. shuts off Sandevistan or pop-up blades) for 2 rounds.' },
  { id: 'overheat', name: 'Overheat', targetType: 'Internal Cyberware', dv: 'Target WILL + 10', description: 'Thermal overload in target internal heat-sinks.', effect: 'Deals 1d6 fire damage per turn for 2 rounds.' },
  { id: 'system_reset', name: 'System Reset', targetType: 'Heavy Cyberware', dv: 'High DV (Target WILL + 12)', description: 'Total neural blackout payload.', effect: 'Target must pass BODY check (DV 15) or immediately drop unconscious for 1 round.' }
];

export const CRITICAL_INJURIES: CriticalInjuryDef[] = [
  { roll: 1, name: 'Dismembered Limb', effect: 'Limb severed; drop items. Disadvantage on related physical tasks.', treatment: 'Surgery (DV 15)' },
  { roll: 2, name: 'Broken Ribs', effect: '-2 penalty to all physical checks due to severe trauma.', treatment: 'Paramedic (DV 13)' },
  { roll: 3, name: 'Collapsed Lung', effect: 'MOVE rate cut in half; -2 to physical checks.', treatment: 'Surgery (DV 15)' },
  { roll: 4, name: 'Cracked Skull', effect: '+1d6 bonus damage taken on future head hits; -2 to INT.', treatment: 'Surgery (DV 15)' },
  { roll: 5, name: 'Disemboweled', effect: 'Mortally Wounded state triggers immediately on next hit.', treatment: 'Emergency Surgery (DV 17)' },
  { roll: 6, name: 'Lost Eye / Ear', effect: '-2 penalty to Perception and Attack rolls.', treatment: 'Surgery (DV 15)' }
];

export const LIFEPATH_TABLES = {
  culturalOrigins: [
    { roll: 1, origin: 'North American', lang: 'English / Spanish', style: 'High Chrome: Metallic fabrics, glowing LED trims, mirror-shades.' },
    { roll: 2, origin: 'South American', lang: 'Spanish / Portuguese', style: 'Urban Flash: Bright neon leathers, graphic tees, spiked hair.' },
    { roll: 3, origin: 'Western European', lang: 'French / German', style: 'Bohemian: Vintage layers, worn canvas, antique coats.' },
    { roll: 4, origin: 'Eastern European', lang: 'Russian / Polish', style: 'Tactical Gear: Military fatigue cargo pants, load-bearing vests.' },
    { roll: 5, origin: 'Middle Eastern', lang: 'Arabic / Hebrew', style: 'Corporate Normal: Sharp tailored suits, minimalist lines.' },
    { roll: 6, origin: 'African', lang: 'Swahili / Yoruba', style: 'Leisurewear: Sweats, tracksuits, oversized street jewelry.' },
    { roll: 7, origin: 'South Asian', lang: 'Hindi / Bengali', style: 'Nomad Leathers: Reinforced dusters, heavy road boots.' },
    { roll: 8, origin: 'East Asian', lang: 'Japanese / Mandarin', style: 'Asia-Pop: Anime prints, platform boots, synthetic wigs.' },
    { roll: 9, origin: 'Southeast Asian', lang: 'Tagalog / Vietnamese', style: 'High Fashion: Designer brands, silk overlays, sleek cuts.' },
    { roll: 10, origin: 'Pacific Islander', lang: 'Maori / Hawaiian', style: 'Baggy Street: Oversized hoodies, skate pads, graffiti jackets.' }
  ],
  familyBackgrounds: [
    'Corporate Execs', 'Corporate Techs', 'Nomad Pack', 'Gang Tribe', 'Urban Homeless',
    'Middle-Class Workers', 'Junkyard Scrappers', 'Combat Zone Survivors', 'Law Enforcement', 'Street Fixers'
  ],
  motivators: [
    'Money', 'Honor', 'Freedom', 'Power', 'Truth', 'Vengeance', 'Loyalty', 'Reputation', 'Survival', 'Love'
  ],
  personalities: [
    'Shy and secretive', 'Rebellious and volatile', 'Arrogant and commanding', 'Sarcastic and detached',
    'Calm and calculating', 'Focused and obsessive', 'Friendly and charismatic', 'Paranoid and jumpy',
    'Stoic and unyielding', 'Energetic and unpredictable'
  ],
  tragicPasts: [
    'Lost a close friend in a botched corpo heist', 'Betrayed by a trusted former fixer',
    'Cyberware glitch caused a tragic accident', 'Family pack wiped out by a rival gang',
    'Falsely accused of murder by Arasaka corporate security', 'Hacked by a rogue netrunner and lost memory',
    'Owes a massive debt to a dangerous night club owner', 'Left behind during a militech military op',
    'Ex-lover disappeared into the deep net', 'Grew up on the streets with no record of identity'
  ]
};

export const CYBERWARE_SHOP: CyberwareItem[] = [
  { id: 'neural_link', name: 'Neural Link', category: 'Neural', cost: 500, humanityLoss: '1d6 (3)', description: 'Foundation neural interface needed for cyberdecks and smartgun links.' },
  { id: 'sandevistan', name: 'Sandevistan Speedware', category: 'Neural', cost: 1000, humanityLoss: '2d6 (7)', description: 'Reflex booster grants +3 to Initiative for 1 minute on trigger.' },
  { id: 'kerenzikov', name: 'Kerenzikov Speedware', category: 'Neural', cost: 1000, humanityLoss: '4d6 (14)', description: 'Always-active neural acceleration grants +2 to Initiative.' },
  { id: 'syn_lung', name: 'Syn-Lung', category: 'Bioware', cost: 800, humanityLoss: '1d6 (3)', description: 'Synthetic lung for enhanced stamina and reduced fatigue.' },
  { id: 'biomonitor', name: 'Biomonitor', category: 'Bioware', cost: 300, humanityLoss: '0', description: 'Real-time health monitoring and emergency stim injector.' },
  { id: 'optical_camo', name: 'Optical Camouflage', category: 'Sensory', cost: 1500, humanityLoss: '2d6 (7)', description: 'Active camo skin plating rendering user nearly invisible.' },
  { id: 'gorilla_arms', name: 'Gorilla Arms', category: 'Cyberlimb', cost: 1200, humanityLoss: '2d6 (7)', description: 'High-torque hydraulic arms for incredible lifting and melee force.' },
  { id: 'subdermal_armor', name: 'Subdermal Armor', category: 'Subdermal', cost: 1000, humanityLoss: '2d6 (7)', description: 'Provides built-in Body SP 11 protection beneath skin.' },
  { id: 'mantis_blades', name: 'Pop-Up Mantis Blades', category: 'Cyberlimb', cost: 1000, humanityLoss: '2d6 (7)', description: 'Retractable heavy melee blades (3d6 damage) hidden in forearm.' },
  { id: 'cybereyes_scoop', name: 'Cybereyes + Targeting Scoop', category: 'Sensory', cost: 500, humanityLoss: '2d6 (7)', description: 'Digital ocular unit with HUD reticle, night vision, and zoom.' },
  { id: 'cyberdeck_port', name: 'Internal Cyberdeck Port', category: 'Neural', cost: 500, humanityLoss: '1d6 (3)', description: 'Direct hardware deck bus interface for instant netrunning connection.' },
  { id: 'smartgun_link', name: 'Smartgun Link', category: 'Neural', cost: 500, humanityLoss: '1d6 (3)', description: 'Connects neural link directly to smart weapons for +1 attack rolls.' },
  { id: 'monowire', name: 'Monowire', category: 'Cyberlimb', cost: 1500, humanityLoss: '2d6 (7)', description: 'Fiber-optic razor wire for whip-like melee attacks (4d6 damage).' },
  { id: 'reflex_booster', name: 'Reflex Booster', category: 'Neural', cost: 1200, humanityLoss: '2d6 (7)', description: 'Boosts reaction speed for superior dodge and attack precision.' },
  { id: 'subdermal_grip', name: 'Subdermal Grip', category: 'Subdermal', cost: 300, humanityLoss: '1d6 (3)', description: 'Enhanced grip strength for weapon retention and climbing.' },
  { id: 'toxic_skin', name: 'Toxic Skin', category: 'Subdermal', cost: 600, humanityLoss: '1d6 (3)', description: 'Exudes mild neurotoxins on contact; harmful to melee attackers.' },
  { id: 'cyberaudio', name: 'Cyberaudio Suite', category: 'Sensory', cost: 400, humanityLoss: '1d6 (3)', description: 'High-fidelity hearing, sonic dampening, and voice modulator.' },
  { id: 'adrenal_pump', name: 'Adrenal Pump', category: 'Bioware', cost: 900, humanityLoss: '1d6 (3)', description: 'Manual activation for massive short-term STR/DEX boosts.' },
  { id: 'skill_chip_port', name: 'Skill Chip Port', category: 'Neural', cost: 700, humanityLoss: '1d6 (3)', description: 'Allows hot-swapping skill-boosting chips for temporary proficiency.' },
  { id: 'nasal_filters', name: 'Nasal Filters', category: 'Bioware', cost: 200, humanityLoss: '0', description: 'Filters out airborne toxins and gases.' },
  { id: 'light_tattoos', name: 'Light Tattoos', category: 'Subdermal', cost: 100, humanityLoss: '0', description: 'Animated, glowing skin art.' },
  { id: 'internal_agent', name: 'Internal Agent', category: 'Neural', cost: 800, humanityLoss: '1d6 (3)', description: 'AI assistant integrated directly into neural network for data analysis.' },
  { id: 'cyber_spine', name: 'Reinforced Cyber-Spine', category: 'Cyberlimb', cost: 1300, humanityLoss: '2d6 (7)', description: 'Increases structural integrity for extreme acrobatics.' },
  { id: 'vision_cortex', name: 'Visual Cortex Booster', category: 'Sensory', cost: 1100, humanityLoss: '2d6 (7)', description: 'Processes high-speed visual input to track fast targets.' },
  { id: 'pain_editor', name: 'Pain Editor', category: 'Bioware', cost: 2000, humanityLoss: '3d6 (10)', description: 'Ignores physical pain; eliminates penalties for Wounded states.' },
  { id: 'cyber_lungs', name: 'Cyber-Lungs', category: 'Bioware', cost: 500, humanityLoss: '1d6 (3)', description: 'Undersea breathing and gas filtration.' },
  { id: 'vocal_synthesizer', name: 'Vocal Synthesizer', category: 'Cyberlimb', cost: 300, humanityLoss: '1d6 (3)', description: 'Replicate any voice heard.' },
  { id: 'subdermal_emp', name: 'Subdermal EMP Node', category: 'Subdermal', cost: 1500, humanityLoss: '3d6 (10)', description: 'Emits a localized, short-range EMP blast from the body.' },
  { id: 'kiroshi_optics_iv', name: 'Kiroshi Optics Mk IV', category: 'Sensory', cost: 2000, humanityLoss: '2d6 (7)', description: 'Elite military eyes with thermal, threat trajectory, and lie detection.' },
  { id: 'tox_pump', name: 'Tox-Pump Liver', category: 'Bioware', cost: 1200, humanityLoss: '1d6 (3)', description: 'Grants complete immunity to poisons, street drugs, and toxins.' },
  { id: 'tsukuyomi_optics', name: 'Tsukuyomi Ocular Hijack', category: 'Sensory', cost: 5000, humanityLoss: '4d6 (14)', description: 'Black-market Kiroshi pair with a blood-red, three-tomoe iris. On direct eye contact within 10m, fires a neural payload through the target\'s optics or neural link: roll WILL + Interface vs DV 10 + target WILL + Concentration (Action). Success traps them in an illusion you script, where up to 72 subjective hours pass in a single real second: you may interrogate them, implant one false memory, or break them (target loses 2d6 Humanity and is Stunned for 1d6 rounds, catatonic on a Critical Success). Targets with no cybereyes or neural link, or who aren\'t meeting your gaze (mirrorshades, eyes shut), are immune. Burns the optic nerve: once per scene, and each use inflicts a stacking -1 to Perception that clears only after a week of rest. At -4 or worse, roll LUCK vs DV 15 on every use or go permanently blind.' },
  { id: 'second_heart', name: 'Redline Second Heart', category: 'Bioware', cost: 2500, humanityLoss: '2d6 (7)', description: 'Backup synthetic heart. Once per day, when reduced to 0 HP or a Mortal Wound, it kicks in: you stay conscious, stabilise at 1 HP and skip the Death Save that turn.' },
  { id: 'projectile_launcher', name: 'Forearm Projectile Launch System', category: 'Weaponry', cost: 1800, humanityLoss: '2d6 (7)', description: 'Fold-out micro-grenade launcher in the forearm. 2 shots per reload, 6d6 explosive damage in a 5m radius, range 30m. Uses Heavy Weapons. Loads EMP or flashbang rounds too.' },
  { id: 'berserk_implant', name: 'Zetatech Berserk Implant', category: 'Neural', cost: 1500, humanityLoss: '3d6 (10)', description: 'Floods the motor cortex. For 3 rounds: +2 melee damage dice, ignore Seriously Wounded penalties, cannot retreat or use ranged weapons. Afterward roll WILL vs DV 13 or take 1d6 Humanity loss from the comedown. Once per scene.' },
  { id: 'lynx_paws', name: 'Lynx Paws', category: 'Cyberlimb', cost: 800, humanityLoss: '1d6 (3)', description: 'Shock-absorbing synthetic foot pads. +2 Stealth when moving, footsteps are inaudible to unaugmented hearing, and no damage from falls under 10m.' },
  { id: 'fortified_ankles', name: 'Fortified Ankles', category: 'Cyberlimb', cost: 1200, humanityLoss: '2d6 (7)', description: 'Hydraulic leg pistons. Charged leap up to 6m vertical or 10m horizontal as a Move action; can mid-air double-jump once per round.' },
  { id: 'ghost_scrambler', name: 'Ghost Signal Scrambler', category: 'Neural', cost: 2200, humanityLoss: '2d6 (7)', description: 'Masks your biosignature from cameras, drones and turret targeting AIs. Automated systems must beat DV 17 to register you; netrunners hunting you take -2 to Pathfinder and Scanner.' },
  { id: 'bone_lacing', name: 'Titanium Bone Lacing', category: 'Subdermal', cost: 1400, humanityLoss: '2d6 (7)', description: 'Skeleton laced with titanium mesh. Unarmed strikes deal +1d6, you are immune to the Broken Arm and Broken Leg critical injuries, and +5 to carrying capacity.' },
  { id: 'black_box', name: 'Black Box Memory Vault', category: 'Neural', cost: 900, humanityLoss: '1d6 (3)', description: 'Encrypted wetware recorder. Perfect audio-visual recall of the last 72 hours, replayable or shareable to a shard. Resists memory tampering and braindance theft (+4 vs any memory-altering effect, including ocular hijacks).' },
  { id: 'mimic_skin', name: 'Mimic Skin Face Sculptor', category: 'Subdermal', cost: 3000, humanityLoss: '3d6 (10)', description: 'Nanite-driven facial musculature. Reshape your face, voice timbre and skin tone to match a scanned person in 1 minute. +4 to Disguise checks; scrutiny by people who know the original uses DV 17.' },
  { id: 'vampire_dentures', name: 'Vampire Dentures', category: 'Bioware', cost: 800, humanityLoss: '2d6 (7)', description: 'Retractable fangs with built-in venom/stim sacs for a deadly kiss.' },
  { id: 'biomech_tail', name: 'Prehensile Tail', category: 'Cyberlimb', cost: 1800, humanityLoss: '3d6 (10)', description: 'Whip-like mechanical tail providing perfect balance and a 2d6 melee strike.' },
  { id: 'shock_legs', name: 'Shock-Absorber Legs', category: 'Cyberlimb', cost: 1500, humanityLoss: '2d6 (7)', description: 'Hydraulic legs; ignores fall damage and triples jump distance.' },
  { id: 'holo_emitter', name: 'Holo-Projector Palm', category: 'Subdermal', cost: 600, humanityLoss: '1d6 (3)', description: 'Projects lifelike holograms to distract enemies or conceal face.' },
  { id: 'blood_pump', name: 'Blood Pump Mk II', category: 'Bioware', cost: 1100, humanityLoss: '1d6 (3)', description: 'Instant massive adrenaline heal; recovers 2d6 HP once per day.' },
  { id: 'titanium_bones', name: 'Titanium Bone Lacing', category: 'Bioware', cost: 2500, humanityLoss: '3d6 (10)', description: 'Indestructible skeleton; +2 to all melee damage and +4 Body SP.' },
  { id: 'micro_missile', name: 'Shoulder Micro-Missile', category: 'Cyberlimb', cost: 2200, humanityLoss: '3d6 (10)', description: 'Pop-up shoulder pod firing mini rockets (4d6 explosive damage).' },
  { id: 'sonar_implant', name: 'Echolocation Sonar', category: 'Sensory', cost: 900, humanityLoss: '2d6 (7)', description: 'Navigate and "see" perfectly in pitch black or dense smoke.' },
  { id: 'skin_weave', name: 'Skin-Weave', category: 'Subdermal', cost: 1200, humanityLoss: '2d6 (7)', description: 'Ballistic thread woven into skin; invisible SP 9 armor.' },
  { id: 'mr_studd', name: 'Mr. Studd / Midnight Lady', category: 'Bioware', cost: 400, humanityLoss: '1d6 (3)', description: 'Iconic sexual implant line. "All night, every night." +2 to Seduction.' },
  { id: 'grapple_hand', name: 'Grapple Hand', category: 'Cyberlimb', cost: 900, humanityLoss: '1d6 (3)', description: 'Hand detaches on a 30m smart-cable for swinging or retrieving items.' },
  { id: 'emp_threading', name: 'EMP Threading', category: 'Subdermal', cost: 1400, humanityLoss: '1d6 (3)', description: 'Faraday cage wiring making the user immune to EMP and shock damage.' },
  { id: 'reflex_coprocessor', name: 'Reflex Co-Processor', category: 'Neural', cost: 1800, humanityLoss: '3d6 (10)', description: 'Advanced evasion algorithms allow user to dodge incoming bullet fire.' },
  { id: 'olfactory_boost', name: 'Olfactory Boost', category: 'Sensory', cost: 400, humanityLoss: '1d6 (3)', description: 'Track targets by scent alone like a bloodhound over vast distances.' },
  { id: 'synapse_burner', name: 'Synapse Burner ICE', category: 'Neural', cost: 1600, humanityLoss: '1d6 (3)', description: 'Defensive ICE that deals 3d6 feedback damage to enemy Netrunners hacking you.' },
  { id: 'projectile_system', name: 'Projectile Launch System', category: 'Cyberlimb', cost: 2000, humanityLoss: '3d6 (10)', description: 'Arm-mounted cannon firing explosive or tranquilizer rounds.' },
  { id: 'nano_surgeons', name: 'Nano-Surgeons', category: 'Bioware', cost: 3000, humanityLoss: '2d6 (7)', description: 'Micro-bots that slowly repair Critical Injuries over 24 hours.' }
];

export const GEAR_SHOP: GearItem[] = [
  { id: 'ronin_ar', name: 'Militech Ronin Assault Rifle', category: 'Weapon', cost: 500, description: '5d6 damage, 30-round mag, effective at 26-50m.' },
  { id: 'heavy_pistol', name: 'Arasaka Heavy Pistol', category: 'Weapon', cost: 100, description: '3d6 damage, 8-round mag, reliable close range.' },
  { id: 'very_heavy_pistol', name: 'Tsunami Very Heavy Pistol', category: 'Weapon', cost: 500, description: '4d6 damage, 8-round mag, heavy armor penetrator.' },
  { id: 'smg', name: 'BudgetArms SMG', category: 'Weapon', cost: 100, description: '2d6 damage, burst mode capability.' },
  { id: 'shotgun', name: 'Rostović Shotgun (Slug)', category: 'Weapon', cost: 500, description: '5d6 slug damage, close quarters stopper.' },
  { id: 'kevlar_armor', name: 'Light Armor Jack (SP 11)', category: 'Armor', cost: 100, description: 'Standard street mercenary body armor.' },
  { id: 'heavy_armor', name: 'Heavy Armor Jack (SP 13)', category: 'Armor', cost: 500, description: 'Heavy tactical armor jacket (-2 DEX/MOVE penalty).' },
  { id: 'cyberdeck_deck', name: 'Raven Microcybernetics Cyberdeck', category: 'Cyberdeck', cost: 1000, description: 'Standard 7-program slot cyberdeck for Netrunning and Quickhacks.' },
  { id: 'medtech_bag', name: 'Trauma Paramedic Field Bag', category: 'Medical', cost: 500, description: 'Full surgical kit with Speedheal, Stims, and trauma dressings.' },
  { id: 'smart_assault_rifle', name: 'Kang Tao Smart Assault Rifle', category: 'Weapon', cost: 1200, description: '6d6 damage, smart-link required for auto-targeting.' },
  { id: 'tech_sniper', name: 'Tsunami Nekomata Tech Sniper', category: 'Weapon', cost: 1000, description: '4d6 damage, armor-piercing charged shots.' },
  { id: 'baton', name: 'Stun Baton', category: 'Weapon', cost: 50, description: '1d6 damage, stun effect.' },
  { id: 'chem_grenade', name: 'Chem Grenade', category: 'Weapon', cost: 150, description: 'AOE acid or gas damage.' },
  { id: 'katar', name: 'Katar', category: 'Weapon', cost: 200, description: '2d6 damage, armor piercing melee.' },
  { id: 'flamethrower', name: 'Portable Flamethrower', category: 'Weapon', cost: 800, description: '4d6 fire damage, AOE.' },
  { id: 'gyrojet_pistol', name: 'Gyrojet Pistol', category: 'Weapon', cost: 600, description: '3d6+2 damage, long range.' },
  { id: 'railgun', name: 'Portable Railgun', category: 'Weapon', cost: 2500, description: '8d6 damage, massive armor penetration.' },
  { id: 'taser_pistol', name: 'Taser Pistol', category: 'Weapon', cost: 150, description: 'Non-lethal electrical stun.' },
  { id: 'sawed_off_shotgun', name: 'Sawed-Off Shotgun', category: 'Weapon', cost: 250, description: '4d6 damage, extreme short range.' },
  { id: 'arasaka_katana', name: 'Arasaka Thermal Katana', category: 'Weapon', cost: 1500, description: '4d6 damage, glowing heated blade, ignores SP < 11.' },
  { id: 'kang_tao_dian', name: 'Kang Tao Dian Smart SMG', category: 'Weapon', cost: 850, description: '3d6 damage, homing gyrojet rounds, smart-link required.' },
  { id: 'rostovic_carnage', name: 'Rostović Carnage', category: 'Weapon', cost: 900, description: '5d6 damage, devastating Serbian power shotgun.' },
  { id: 'tyger_naginata', name: 'Tyger Claw Naginata', category: 'Weapon', cost: 600, description: '3d6 damage, neon-laced polearm for high-speed drive-by slicing.' },
  { id: 'maelstrom_buzzsaw', name: 'Maelstrom Buzzsaw', category: 'Weapon', cost: 1100, description: '4d6 damage, heavily modded, jagged, flesh-tearing LMG.' },
  { id: 'midnight_overture', name: 'Midnight Arms Overture', category: 'Weapon', cost: 650, description: '4d6 damage, classic high-caliber nomad revolver.' },
  { id: 'nokota_copperhead', name: 'Nokota Copperhead', category: 'Weapon', cost: 450, description: '5d6 damage, reliable American-made budget assault rifle.' },
  { id: 'tsunami_ashura', name: 'Tsunami Ashura', category: 'Weapon', cost: 2000, description: '6d6 damage, one-shot smart-targeting sniper rifle.' },
  { id: 'valentino_machete', name: 'Valentino Gold Machete', category: 'Weapon', cost: 400, description: '3d6 damage, heavy gold-plated chopper.' },
  { id: 'militech_omaha', name: 'Militech Omaha', category: 'Weapon', cost: 550, description: '3d6 damage, tri-barrel tech pistol.' }
];

export const CLASSES = [
  {
    id: 'solo',
    name: 'Solo',
    path: 'Combat Specialist',
    talents: [
      { name: 'Deadly Aim', desc: 'Add +2 to attack rolls with precision weapons.' },
      { name: 'Combat Reflexes', desc: 'Ignore 2 levels of wound penalty instead of 1.' }
    ]
  },
  {
    id: 'netrunner',
    name: 'Netrunner',
    path: 'Data Phantom',
    talents: [
      { name: 'ICE Breaker', desc: 'Reduce DV for all hacks by 3.' },
      { name: 'Neural Overload', desc: 'Extra 2d6 electrical damage on successful short-circuit.' }
    ]
  },
  {
    id: 'tech',
    name: 'Tech',
    path: 'Gear Master',
    talents: [
      { name: 'Field Repair', desc: 'Restore 3 SP to armor as a minor action.' },
      { name: 'Overclock Gear', desc: 'Increase weapon damage +2d6, jam on natural 1-3.' }
    ]
  },
  {
    id: 'medtech',
    name: 'Medtech',
    path: 'Field Surgeon',
    talents: [
      { name: 'Combat Medic', desc: 'Heal others for 2d6 HP as a minor action.' },
      { name: 'Stim Junkie', desc: 'Immune to stim overdose and receive +2 to all checks while stimulated.' }
    ]
  },
  {
    id: 'fixer',
    name: 'Fixer',
    path: 'Street Broker',
    talents: [
      { name: 'Black Market Connection', desc: 'Reduce gear cost by 30%.' },
      { name: 'Street Cred Leverage', desc: 'Bonus +3 to all social skill checks.' }
    ]
  },
  {
    id: 'corp',
    name: 'Corporate Agent',
    path: 'Manipulator',
    talents: [
      { name: 'Executive Privilege', desc: 'Bonus +3 to persuasion against low-cred targets.' },
      { name: 'Asset Management', desc: 'Gain +200eb at start of session.' }
    ]
  },
  {
    id: 'nomad',
    name: 'Nomad Racer',
    path: 'Road Warrior',
    talents: [
      { name: 'High Speed Pursuit', desc: 'Ignore -2 penalty to vehicle handling at high speed.' },
      { name: 'Road Sense', desc: 'Bonus +3 on navigation and vehicle maintenance checks.' }
    ]
  },
  {
    id: 'media',
    name: 'Media Reporter',
    path: 'Truth Seeker',
    talents: [
      { name: 'Hard Hitting Story', desc: 'Bonus +3 to investigation checks.' },
      { name: 'Streetwise Network', desc: 'Gain one free lead on any local criminal activity.' }
    ]
  }
];


export const SCENE_STARTERS = [
  {
    title: 'Afterlife Fixer Meet',
    tag: 'Gig Briefing',
    prompt: 'You are sitting at a dark corner booth in the Afterlife club. Neon light bleeds through the smoke as your Fixer, Slick Vane, slides a encrypted datapad across the table: "Got a high-risk corp extraction job in Watson. Pay is 5,000eb each. Arasaka asset needs out tonight. You in?"'
  },
  {
    title: 'Watson Cyberware Heist',
    tag: 'Action / Infiltration',
    prompt: 'Rain washes down a neon-drenched Watson alleyway. You are crouched outside a Maelstrom cyberware depot. The perimeter cameras are flashing amber. Two heavily chrome-augmented Maelstrom gangers are guarding the rear bay loading doors with heavy SMGs.'
  },
  {
    title: 'Combat Zone Trauma Ambush',
    tag: 'Firefight / Lethal',
    prompt: 'Sirens blare across the ruined concrete towers of Pacifica. Your quad-cab combat van was just broadsided by an RPG fired by scavengers. Your vehicle is smoking, your team is pinned under heavy auto-rifle fire, and a Trauma Team AV is hovering overhead.'
  },
  {
    title: 'Netrunner ICE Dive',
    tag: 'Quickhack / Digital',
    prompt: 'You plug your interface cables into the local security node inside a Zetatech research lab. In Meat-Space, three guards are bursting through the heavy blast doors. In digital space, black ICE constructs are forming around your deck.'
  }
];

export const DEFAULT_FACTIONS: FactionReputation[] = [
  { id: 'f_arasaka', name: 'Arasaka Corp', standing: -15, tier: 'Unfriendly', bounty: 2500, description: 'Japanese megacorp with elite black-ops solos and sub-dermal security.' },
  { id: 'f_militech', name: 'Militech Defense', standing: 10, tier: 'Neutral', bounty: 0, description: 'NUSA heavy arms manufacturer and military PMC contractor.' },
  { id: 'f_maelstrom', name: 'Maelstrom Chrome Cult', standing: -40, tier: 'Hostile', bounty: 5000, description: 'Cyber-psychotic gang obsessed with extreme augmentation in Watson.' },
  { id: 'f_tygerclaws', name: 'Tyger Claws', standing: 0, tier: 'Neutral', bounty: 0, description: 'Japantown syndicate specializing in braindances, gambling, and speed bikes.' },
  { id: 'f_trauma', name: 'Trauma Team International', standing: 25, tier: 'Friendly', bounty: 0, description: 'Armed high-threat medical evacuation squad.' },
  { id: 'f_valentinos', name: 'Valentinos', standing: 5, tier: 'Neutral', bounty: 0, description: 'Heywood neighborhood street family bound by honor, devotion, and gold chrome.' },
  { id: 'f_zetatech', name: 'Zetatech', standing: -5, tier: 'Neutral', bounty: 0, description: 'Hardware manufacturer focusing on cyberdecks and combat drones.' }
];

export const DEFAULT_CONTACTS: NPCContact[] = [
  { id: 'c_rogue', name: 'Rogue Amendiares', role: 'Fixer', faction: 'Afterlife', trustRating: 65, favorBalance: 1, lastSeenLocation: 'Afterlife Club, City Center', notes: 'Queen of Afterlife. Demands professionalism and clean extraction.', status: 'Active' },
  { id: 'c_vik', name: 'Dr. Victor Vector', role: 'Ripperdoc', faction: 'Independent', trustRating: 90, favorBalance: 2, lastSeenLocation: 'Misty\'s Esoterica Basement, Watson', notes: 'Trusted ripper. Gives credit when eddies are light.', status: 'Active' },
  { id: 'c_padre', name: 'Padre Ibarra', role: 'Fixer', faction: 'Valentinos', trustRating: 50, favorBalance: 0, lastSeenLocation: 'El Pinche Pollo, Heywood', notes: 'Gives righteous contracts against corporate corruption in Heywood.', status: 'Active' },
  { id: 'c_nix', name: 'Nix', role: 'Netrunner', faction: 'Afterlife', trustRating: 70, favorBalance: 1, lastSeenLocation: 'Afterlife Netroom', notes: 'High-end data broker for retro demons and black-ICE code.', status: 'Active' }
];

export function generateRandomStarterScenario() {
  const districts = ['Watson', 'Heywood', 'Pacifica', 'Santo Domingo', 'City Center', 'Badlands Outer Ring', ' Westbrook (Japantown)'];
  const factions = ['Arasaka Security', 'Militech Tactical', 'Maelstrom Chrome Cult', 'Tyger Claws', 'Valentinos', '6th Street', 'Scavengers', 'Zetatech Operatives', 'Trauma Team Strike Unit'];
  const hooks = [
    'A high-profile prototype implant was stolen, and the client wants it retrieved before dawn.',
    'An encrypted data-chip holds blackmail on an Arasaka executive, and your fixer needs you to extract it from a heavily guarded penthouse.',
    'A rogue Netrunner fried a local ripperdoc and fled into an abandoned sub-level power plant with military ICE.',
    'A shipment of black-market cyberware got intercepted by an armored convoy, and you are hired to hijack it mid-transit.',
    'A gang lieutenant put a hit out on your team after a botched deal, and you are cornered in a rain-slicked back-alley diner.',
    'A secret trauma squad beacon is transmitting from an underground bio-lab sealed under quarantine.'
  ];
  const twists = [
    'NCPD psycho-squad sirens are wailing in the distance, 2 minutes out.',
    'A heavy acid rainstorm is knocking out optics and targeting HUDs.',
    'A rival team of solos just crashed through the roof claiming the same target.',
    'A hidden corporate agent inside your contractor team is getting ready to double-cross you.',
    'The target is infected with a volatile cyberware virus that could detonate.'
  ];

  const district = districts[Math.floor(Math.random() * districts.length)];
  const faction = factions[Math.floor(Math.random() * factions.length)];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  const twist = twists[Math.floor(Math.random() * twists.length)];

  return {
    title: `Procedural Gig: ${district} Run`,
    tag: 'Randomized Run',
    prompt: `[NIGHT CITY OPERATIONAL INITIALIZATION]\nLocation: ${district}\nHostile Opposition: ${faction}\n\nSituation: ${hook}\nComplication: ${twist}\n\nYour weapons are loaded, neural links active. How do you approach the situation?`
  };
}

