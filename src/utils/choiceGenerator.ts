import { HUDState, ChoiceChip } from '../types';

export function generateDynamicChoices(hudState: HUDState, lastMessageText: string = ''): ChoiceChip[] {
  const textLower = lastMessageText.toLowerCase();
  const choices: ChoiceChip[] = [];
  const stats = hudState.stats || { INT: 6, REF: 6, DEX: 6, TECH: 6, COOL: 6, WILL: 6, LUCK: 6, MOVE: 6, BODY: 6, EMP: 6 };
  const role = hudState.role || 'Solo';

  const hasEnemies = (hudState.activeEnemies && hudState.activeEnemies.length > 0) ||
    textLower.includes('combat') || textLower.includes('gunfire') || textLower.includes('enemy') ||
    textLower.includes('hostile') || textLower.includes('sentry') || textLower.includes('maelstrom') ||
    textLower.includes('arasaka') || textLower.includes('militech') || textLower.includes('draws weapon') ||
    textLower.includes('initiative');

  const isWounded = hudState.hpCurrent < hudState.hpMax / 2 || hudState.criticalInjuries.length > 0;

  const isTechnical = textLower.includes('terminal') || textLower.includes('door') || textLower.includes('security') ||
    textLower.includes('lock') || textLower.includes('vent') || textLower.includes('camera') ||
    textLower.includes('hack') || textLower.includes('network') || textLower.includes('node');

  // Emergency survival option if severely hurt
  if (isWounded) {
    choices.push({
      id: `c_heal_${Date.now()}_1`,
      label: '[Emergency: Stim & Field Patch]',
      category: 'Tactical',
      promptText: `I duck behind cover, inject a Speedheal combat stim, and roll TECH (${stats.TECH}) + First Aid (DV 13) to patch my HP (${hudState.hpCurrent}/${hudState.hpMax}).`,
      dv: 13,
      skill: 'First Aid'
    });
  }

  // Combat Scenario
  if (hasEnemies) {
    choices.push({
      id: `c_combat_${Date.now()}_1`,
      label: '[Combat: Fire Weapon / Suppress]',
      category: 'Brute',
      promptText: `I target the closest hostile and fire a heavy volley! 1d10 + REF (${stats.REF}) + Handgun/Rifle check (DV 15) for weapon damage.`,
      isHighStakes: true,
      dv: 15,
      skill: 'Handgun / Shoulder Arms'
    });

    choices.push({
      id: `c_combat_${Date.now()}_2`,
      label: '[Netrun: Cyberdeck Daemon Attack]',
      category: 'Netrun',
      promptText: `I upload an Overheat quickhack to target enemy cyberware! 1d10 + INT (${stats.INT}) + Interface check vs target ICE (DV 15).`,
      isHighStakes: true,
      dv: 15,
      skill: 'Interface'
    });

    choices.push({
      id: `c_combat_${Date.now()}_3`,
      label: '[Tactical: Cover & Evasion Flank]',
      category: 'Tactical',
      promptText: `I power-slide to hard concrete cover and roll DEX (${stats.DEX}) + Athletics / Evasion (DV 14) to evade incoming fire.`,
      dv: 14,
      skill: 'Evasion'
    });

    choices.push({
      id: `c_combat_${Date.now()}_4`,
      label: '[Social: Intimidate Hostiles]',
      category: 'Social',
      promptText: `I flex my Street Cred Level ${hudState.streetCred} and roll COOL (${stats.COOL}) + Facing Check (DV 15) to break their morale!`,
      isHighStakes: true,
      dv: 15,
      skill: 'Facing / Cool'
    });
  } else if (isTechnical) {
    // Infiltration / Tech Scenario
    choices.push({
      id: `c_tech_${Date.now()}_1`,
      label: '[Tech: Bypass Security Wiring]',
      category: 'Tactical',
      promptText: `I pull out my tech scanner and slice the access panel. 1d10 + TECH (${stats.TECH}) + Security Tech check (DV 15).`,
      isHighStakes: true,
      dv: 15,
      skill: 'Security Tech'
    });

    choices.push({
      id: `c_tech_${Date.now()}_2`,
      label: '[Netrun: Deep Node Breach]',
      category: 'Netrun',
      promptText: `I jack into the local data port and breach system nodes. 1d10 + INT (${stats.INT}) + Interface check (DV 14).`,
      dv: 14,
      skill: 'Interface'
    });

    choices.push({
      id: `c_tech_${Date.now()}_3`,
      label: '[Stealth: Slip Through Shadows]',
      category: 'Stealth',
      promptText: `I stick to dark blind spots and move silently. 1d10 + DEX (${stats.DEX}) + Stealth check (DV 13).`,
      dv: 13,
      skill: 'Stealth'
    });

    choices.push({
      id: `c_tech_${Date.now()}_4`,
      label: '[Social: Bluff Duty Operator]',
      category: 'Social',
      promptText: `I present fake clearance protocols with supreme confidence. 1d10 + COOL (${stats.COOL}) + Persuasion/Deception check (DV 14).`,
      dv: 14,
      skill: 'Deception'
    });
  } else {
    // General Exploration / Social / Investigation Scenario
    choices.push({
      id: `c_gen_${Date.now()}_1`,
      label: '[Tactical: Threat & Perception Scan]',
      category: 'Tactical',
      promptText: `I scan my surroundings for hidden cameras, egress routes, and threat indicators. 1d10 + INT (${stats.INT}) + Perception check (DV 13).`,
      dv: 13,
      skill: 'Perception'
    });

    choices.push({
      id: `c_gen_${Date.now()}_2`,
      label: '[Social: Leverage Street Cred]',
      category: 'Social',
      promptText: `I approach the contact, leveraging my Street Cred Level ${hudState.streetCred}. 1d10 + COOL (${stats.COOL}) + Persuasion check (DV 14).`,
      dv: 14,
      skill: 'Persuasion'
    });

    choices.push({
      id: `c_gen_${Date.now()}_3`,
      label: `[Role: ${role} Ability Action]`,
      category: role === 'Netrunner' ? 'Netrun' : role === 'Solo' ? 'Brute' : 'Tactical',
      promptText: getRoleAbilityPrompt(role, stats, hudState),
      dv: 14,
      skill: role
    });

    choices.push({
      id: `c_gen_${Date.now()}_4`,
      label: '[Stealth: Scout Perimeter]',
      category: 'Stealth',
      promptText: `I circle the perimeter quietly to spot secondary entrances. 1d10 + DEX (${stats.DEX}) + Stealth check (DV 13).`,
      dv: 13,
      skill: 'Stealth'
    });
  }

  return choices.slice(0, 4);
}

function getRoleAbilityPrompt(role: string, stats: any, hudState: HUDState): string {
  switch (role) {
    case 'Solo':
      return `I activate Combat Sense (REF ${stats.REF}) to analyze enemy weapons, armor weak points, and tactical positions.`;
    case 'Netrunner':
      return `I activate my cyberdeck scanner to sniff out local wireless subnets and ICE defenses (INT ${stats.INT}).`;
    case 'Fixer':
      return `I tap into my contact network to check local fixer intel and market prices (EMP ${stats.EMP}).`;
    case 'Tech':
      return `I inspect the local machinery and gear for quick field modifications or Jury Rigging (TECH ${stats.TECH}).`;
    case 'Rockerboy':
      return `I use Charismatic Impact (COOL ${stats.COOL}) to rally onlookers or sway local bystanders.`;
    case 'Nomad':
      return `I call in my Moto family channel to request local road intel or backup support.`;
    case 'Medtech':
      return `I run a biological scan to assess nearby vitals and cyberware trauma risks.`;
    case 'Exec':
      return `I leverage Corporate Authority (COOL ${stats.COOL}) to demand VIP access.`;
    default:
      return `I leverage my ${role} experience to assess the immediate situation. 1d10 + STAT check.`;
  }
}
