import { MissionGig, MissionType, HUDState } from '../types';

export const INITIAL_MISSION_BOARD_GIGS: MissionGig[] = [
  {
    id: 'gig_assassination_padre',
    title: 'Operation Blood Debt: Corrupt NCPD Lieutenant',
    fixerName: 'Sebastian "Padre" Ibarra',
    fixerLocation: 'Heywood (The Glen)',
    missionType: 'Assassination',
    district: 'Heywood',
    clientOrTarget: 'NCPD Lieutenant Frank Brody / 6th Street Syndicate',
    difficultyDV: 15,
    basePayout: 3200,
    requiredStreetCred: 1,
    briefingSummary: 'Brody has been selling street kids to scavengers and framing Valentin gang members. He is celebrating tonight at a protected backroom bar in The Glen. Terminate him cleanly or make it loud—Padre wants the message sent.',
    hazards: ['Armed Off-Duty Cops', 'Security Cameras (DV 13 Hack)', 'Reinforced Blast Doors'],
    keySkill: 'Handgun / Stealth',
    loreHook: 'God watches from above, but in Heywood, Padre collects the tithes.'
  },
  {
    id: 'gig_data_theft_rogue',
    title: 'Project Blackwall Shard: Arasaka Datavault Siphon',
    fixerName: 'Rogue Amendiares',
    fixerLocation: 'The Afterlife (Watson)',
    missionType: 'Data Theft',
    district: 'City Center',
    clientOrTarget: 'Arasaka Counter-Intel Secure Server Farm',
    difficultyDV: 17,
    basePayout: 7500,
    requiredStreetCred: 3,
    briefingSummary: 'A high-level client wants a decrypted fragment of pre-war AI telemetry sealed in a subterranean Arasaka server bunker in Downtown. High-tier ICE, laser tripwires, and biometric retina scanners stand between you and the terminal.',
    hazards: ['Black ICE (Hellhound & Brainwipe)', 'Optical Camo Sentries', 'Turret Hardpoints (SP 15)'],
    keySkill: 'Interface / Electronics/Security',
    loreHook: 'You want into the big leagues? Survive an Arasaka raid and maybe you earn a drink named after you.'
  },
  {
    id: 'gig_escort_dakota',
    title: 'Corpo Defector: Highway Extraction to the Badlands',
    fixerName: 'Dakota Smith',
    fixerLocation: 'Badlands / Southern Outskirts',
    missionType: 'Escort',
    district: 'Santo Domingo',
    clientOrTarget: 'Dr. Evelyn Cross (Ex-Biotechnica Geneticist)',
    difficultyDV: 15,
    basePayout: 4200,
    requiredStreetCred: 2,
    briefingSummary: 'Biotechnica molecular specialist Dr. Cross is fleeing Night City with synthesized viral antidote formulas in her cyberware cache. Militech pursuit teams and private bounty hunters are tailing her sedan through Santo Domingo.',
    hazards: ['Armed Pursuit Drones', 'Militech Combat Cruisers', 'Roadblock Ambush'],
    keySkill: 'Drive Land Vehicle / Autofire',
    loreHook: 'The desert forgives nothing, but the city kills you faster.'
  },
  {
    id: 'gig_sabotage_regina',
    title: 'Chrome Forge Meltdown: Maelstrom Meat-Lab',
    fixerName: 'Regina Jones',
    fixerLocation: 'Watson (Kabuki)',
    missionType: 'Sabotage',
    district: 'Watson',
    clientOrTarget: 'Maelstrom Cyberware Chop-Shop & Refinery',
    difficultyDV: 14,
    basePayout: 3800,
    requiredStreetCred: 1,
    briefingSummary: 'Maelstrom psychos have set up an illegal chrome foundry in an abandoned food processing facility. They are stripping chrome off captured nomads and synthesizing combat boosters. Rig their cooling reactors to go critical.',
    hazards: ['Pain-Immune Maelstromers', 'Toxic Sludge Vats', 'Automated Monofilament Saws'],
    keySkill: 'Demolitions / Athletics',
    loreHook: 'Stop the bleeding in Watson before these chromeheads turn the district into a furnace.'
  },
  {
    id: 'gig_heist_capitan',
    title: 'The Golden Falcon: Kang Tao Military AV Hijack',
    fixerName: 'Muamar "El Capitan" Reyes',
    fixerLocation: 'Santo Domingo (Arroyo)',
    missionType: 'Heist',
    district: 'Santo Domingo',
    clientOrTarget: 'Kang Tao Armored Cargo Transporter',
    difficultyDV: 18,
    basePayout: 8500,
    requiredStreetCred: 3,
    briefingSummary: 'A prototype smart-weapon shipment is touching down on a private corporate landing pad atop the Santo Domingo industrial district. Hijack the freight container before Kang Tao escort squads load it into orbital transit.',
    hazards: ['Smartgun Auto-Turrets', 'Heavy Powered Exoskeletons', 'Laser Fence Perimeter'],
    keySkill: 'Heavy Weapons / Interface',
    loreHook: 'El Capitan keeps his promises: deliver the metal, take the eddies, live like a king.'
  },
  {
    id: 'gig_cyberpsycho_regina',
    title: 'Psycho on the Pavement: The Chrome Gorgon',
    fixerName: 'Regina Jones',
    fixerLocation: 'Watson / Pacifica Border',
    missionType: 'Cyberpsycho Hunt',
    district: 'Pacifica',
    clientOrTarget: 'Lt. Viktor Reyes (Ex-Borg Dragoon Unit)',
    difficultyDV: 17,
    basePayout: 6200,
    requiredStreetCred: 2,
    briefingSummary: 'A former military solo with dual cyberarms and a sandevistan has suffered complete cyberpsychosis inside an abandoned luxury resort in Pacifica. Max-Tac hasn’t arrived yet. Regina wants him neutralized, alive if possible.',
    hazards: ['Sandevistan Reflex Boost (REF 10)', 'Gorilla Arm Ground Slams', 'Shotgun Flak Cannons'],
    keySkill: 'Brawling / Evasion',
    loreHook: 'Under all that iron and blood is a human being who snapped. Bring him down.'
  },
  {
    id: 'gig_extraction_dino',
    title: 'Night Market Bloodbath: Fixer Runner Rescue',
    fixerName: 'Dino Dinovic',
    fixerLocation: 'City Center (Downtown)',
    missionType: 'Extraction',
    district: 'Westbrook',
    clientOrTarget: 'Tyger Claw Syndicate / Scavenger Cell',
    difficultyDV: 16,
    basePayout: 5100,
    requiredStreetCred: 2,
    briefingSummary: 'Dino’s favorite data courier was grabbed by Tyger Claws after skimming gambling eddies in Japantown. She is locked in an underground torture den beneath a pachinko parlor. Breach, wipe the crew, and bring her out in one piece.',
    hazards: ['Katana Specialists with Reflex Co-Processors', 'Subdermal Armor Goons', 'Gas Grenades'],
    keySkill: 'Melee Weapon / First Aid',
    loreHook: 'In Downtown, image is everything, but loyalty is the only currency that doesn’t depreciate.'
  },
  {
    id: 'gig_assassination_legendary',
    title: 'Kingmaker Fall: Arasaka Special Operations Director',
    fixerName: 'Rogue Amendiares',
    fixerLocation: 'The Afterlife VIP Booth',
    missionType: 'Assassination',
    district: 'Westbrook',
    clientOrTarget: 'Executive Director Kenjiro Sato (Arasaka Black Ops)',
    difficultyDV: 21,
    basePayout: 16000,
    requiredStreetCred: 4,
    briefingSummary: 'The crown jewel of contract work. Kenjiro Sato is attending a private gala at a heavily fortified penthouse in Charter Hill. Personal security includes two full-conversion cyborg bodyguards and an orbital signal jammer.',
    hazards: ['Full Conversion Cyborgs (SP 18)', 'Orbital Laser Targeting Lock', 'Elite Arasaka Snipers'],
    keySkill: 'Tactics / Sniper Rifle / Conceal/Reveal Object',
    loreHook: 'Do this, and your name gets carved into the stone of the Afterlife forever.'
  }
];

export function generateDynamicGig(hudState: HUDState): MissionGig {
  const types: MissionType[] = ['Assassination', 'Data Theft', 'Escort', 'Sabotage', 'Heist', 'Cyberpsycho Hunt', 'Extraction'];
  const districts = ['Watson', 'Heywood', 'Pacifica', 'City Center', 'Santo Domingo', 'Westbrook'];
  const fixers = [
    { name: 'Sebastian "Padre" Ibarra', loc: 'Heywood' },
    { name: 'Rogue Amendiares', loc: 'The Afterlife' },
    { name: 'Regina Jones', loc: 'Watson' },
    { name: 'Muamar "El Capitan" Reyes', loc: 'Santo Domingo' },
    { name: 'Dino Dinovic', loc: 'City Center' },
    { name: 'Dakota Smith', loc: 'Badlands' }
  ];
  const targets = [
    'Militech Armored Supply Convoy',
    'Zetatech Neural R&D Lab',
    'Scavenger Chop-Shop Collective',
    'Arasaka Regional Black-Site',
    'Trauma Team Platinum Card Defector',
    'Kiroshi Cyberoptics Prototype Depot'
  ];

  const selType = types[Math.floor(Math.random() * types.length)];
  const selDistrict = districts[Math.floor(Math.random() * districts.length)];
  const selFixer = fixers[Math.floor(Math.random() * fixers.length)];
  const selTarget = targets[Math.floor(Math.random() * targets.length)];

  const minCred = Math.min(4, Math.max(1, Math.floor(Math.random() * 3) + 1));
  const dv = 13 + (minCred * 2);
  const basePayout = 2000 + (minCred * 1800);

  return {
    id: `dyn_gig_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: `Operation ${selType.toUpperCase()}: ${selTarget}`,
    fixerName: selFixer.name,
    fixerLocation: selFixer.loc,
    missionType: selType,
    district: selDistrict,
    clientOrTarget: selTarget,
    difficultyDV: dv,
    basePayout,
    requiredStreetCred: minCred,
    briefingSummary: `Fixer ${selFixer.name} urgently requires a seasoned crew for a ${selType} contract in ${selDistrict}. Primary target is ${selTarget}. Expect heavy resistance, corporate security protocols, and zero margin for error.`,
    hazards: ['Armed Sentries', 'Electronic Surveillance (DV ' + dv + ')', 'Reinforcement Call Responders'],
    keySkill: selType === 'Data Theft' ? 'Interface' : selType === 'Assassination' ? 'Handgun/Melee' : 'Tactics',
    loreHook: 'The street never sleeps, and the eddies don’t wait.'
  };
}

export function buildMissionBriefingPrompt(gig: MissionGig, hudState: HUDState): string {
  const finalPayout = gig.basePayout * Math.max(1, hudState.streetCred);
  
  return `[MISSION CONTRACT BRIEFING INITIATED]
CONTRACT: "${gig.title}"
MISSION TYPE: ${gig.missionType.toUpperCase()} | DISTRICT: ${gig.district}
BROKERED BY: Fixer ${gig.fixerName} (${gig.fixerLocation})
TARGET / OBJECTIVE: ${gig.clientOrTarget}
BASE DIFFICULTY: DV ${gig.difficultyDV}
REWARD: ${finalPayout}eb (${gig.basePayout}eb base x Street Cred Lvl ${hudState.streetCred})
HAZARDS & THREATS: ${gig.hazards.join(', ')}
OPERATOR ON DECK: ${hudState.name} (${hudState.role} Rank ${hudState.roleRank}) | Heat Level: ${hudState.heat}

BRIEFING FROM FIXER:
"${gig.briefingSummary}"

[GM DIRECTIVE]:
Deploy the opening scene immediately at the mission drop site in ${gig.district}. 
Describe the grim, rain-slicked atmosphere, the sensory details of the target perimeter, the tactical cover, the armed sentries or security measures, and how the fixer contacts the crew over encrypted holo-comms. Incorporate ${hudState.name}'s signature appearance and equipped gear. 
Provide 3-4 tactical choices with explicit dice checks [Check: <Skill> vs DV ${gig.difficultyDV}] to breach the perimeter or initiate the op!`;
}
