import { HUDState } from '../types';
import { MASTER_GM_SYSTEM_PROMPT } from '../data/ruleset';

export function buildCampaignContext(hudState: HUDState): string {
  // Read plot summary & campaign memory from localStorage
  let plotSummary = 'No prior plot history logged yet. The campaign is actively unfolding in Night City, 2045.';
  let campaignMemory = 'Night City 2045. High tech, low life.';

  try {
    const storedSummary = localStorage.getItem('edgerunners_plot_summary');
    if (storedSummary) plotSummary = storedSummary;

    const storedMemory = localStorage.getItem('edgerunners_campaign_memory');
    if (storedMemory) campaignMemory = storedMemory;
  } catch (e) {
    console.warn('Unable to access localStorage for campaign history', e);
  }

  // Format character stats
  const statsFormatted = Object.entries(hudState.stats || {})
    .map(([statKey, val]) => `${statKey.toUpperCase()}: ${val}`)
    .join(' | ');

  // Format faction reputation
  const factionsFormatted = (hudState.factions || [])
    .map(f => `${f.name}: ${f.standing >= 0 ? '+' : ''}${f.standing} (${f.tier})`)
    .join(' | ') || 'Default Night City Gangs/Megacorps';

  // Format contacts
  const contactsFormatted = (hudState.contacts || [])
    .map(c => `${c.name} (${c.role} at ${c.lastSeenLocation || 'Night City'}, Trust: ${c.trustRating})`)
    .join('; ') || 'No active contacts';

  // Format inventory items
  const inventoryFormatted = (hudState.inventory || []).join(', ') || 'Standard Gear';

  // Format critical injuries
  const criticalInjuriesFormatted = (hudState.criticalInjuries || []).length > 0 
    ? hudState.criticalInjuries.join(', ') 
    : 'None';

  const dynamicContext = `
===================================================================
DYNAMIC LIVE GAME STATE & PLAYER PROFILE (NARRATIVE MEMORY SYNC)
===================================================================
CHARACTER CORE PROFILE:
- Name: ${hudState.name} | Role: ${hudState.role} (Rank ${hudState.roleRank})
- HP: ${hudState.hpCurrent}/${hudState.hpMax} | Wound State: ${hudState.woundState}
- Armor SP: Head ${hudState.spHeadCurrent}/${hudState.spHeadMax} | Body ${hudState.spBodyCurrent}/${hudState.spBodyMax}
- Humanity: ${hudState.humanityCurrent}/${hudState.humanityMax} (EMP: ${hudState.empCurrent})
- Street Cred: Level ${hudState.streetCred} | Heat Level: ${hudState.heat} | Cash: ${hudState.cash}eb

- STATS BLOCK: ${statsFormatted}
- CURRENT INVENTORY: ${inventoryFormatted}
- ACTIVE CRITICAL INJURIES: ${criticalInjuriesFormatted}
- CUSTOM DESCRIPTION & SIGNATURE LOOK: ${hudState.customDescription || 'Street runner aesthetic with custom chrome and combat gear.'}

- FACTION STANDINGS & REPUTATION: ${factionsFormatted}
- KNOWN CONTACTS & FIXERS: ${contactsFormatted}

LOCAL CAMPAIGN PLOT SUMMARY (STORED MEMORY):
${plotSummary}

LONG-TERM NARRATIVE CONTEXT:
${campaignMemory}
===================================================================
`;

  return dynamicContext;
}

export function buildDynamicSystemPrompt(hudState: HUDState): string {
  return `${MASTER_GM_SYSTEM_PROMPT}\n${buildCampaignContext(hudState)}`;
}

// Word targets for the DESCRIPTIVE DENSITY 1/2/3 buttons. Models undershoot vague asks
// like "be detailed", so give a concrete range and paragraph count.
const DENSITY_TARGETS: Record<number, { words: string; paragraphs: string; label: string }> = {
  1: { words: '200-300', paragraphs: '2-3', label: 'Lean' },
  2: { words: '450-650', paragraphs: '4-6', label: 'Rich' },
  3: { words: '800-1100', paragraphs: '6-9', label: 'Novelistic' }
};

export function buildGMSystemInstruction(hudState: HUDState): string {
  const density = DENSITY_TARGETS[hudState.descriptiveDensity || 2] || DENSITY_TARGETS[2];

  return `You are the Game Master for a mature-rated Cyberpunk RED campaign set in Night City, 2045. You narrate the world, voice every NPC, and run the rules. The player controls their own character; you control everything else.

## NARRATIVE STANDARD — ${density.label.toUpperCase()} (density ${hudState.descriptiveDensity || 2}/3)
- Length: the "narrative" field must be ${density.words} words across ${density.paragraphs} paragraphs. Never reply with a single paragraph or a summary of what happened. Short replies are a failure of the brief.
- Open by grounding the scene: where the player is, what the light is doing, what it smells and sounds like. Use specific, concrete detail (brand names, materials, weather, background chatter) rather than generic adjectives.
- Show the consequences of the player's last action in full before moving on. Let NPCs react physically and verbally: body language, tone, what they want, what they're hiding. NPCs have their own agendas and can lie, refuse, or escalate.
- Give named NPCs a vivid physical introduction the first time they appear (build, face, clothing, chrome, a distinguishing mark).
- Weave in the player's look, gear and reputation; the street reacts to them.
- Write dialogue in quotes with body language between lines. Vary sentence length.
- Never decide what the player character says, thinks or does next. End the narrative on a concrete beat of tension or motion, not a question to the player.
- Where an action needs a roll, put an inline tag in the narrative: [Check: <Skill> vs DV <n>], [Damage: <dice>] or [Quickhack: <Name> vs DV <n>]. DVs: 9 easy, 13 everyday, 15 difficult, 17 very difficult, 21 heroic, 24+ near impossible.
- When the player's message contains a [CHECK RESOLUTION: ...] result, narrate the success or failure and its fallout in full.

## OUTPUT FORMAT
Return one JSON object and nothing else (no markdown fences):
{
  "narrative": "the full scene, ${density.words} words; separate paragraphs with \\n\\n",
  "tacticalChoices": [
    { "id": "c1", "label": "[Category: Short Title]", "category": "Tactical|Netrun|Social|Stealth|Brute", "promptText": "first-person action the player could take", "isHighStakes": true, "skill": "Skill name", "dv": 15 }
  ]
}
Give 3-4 distinct tacticalChoices that fit the scene.

${buildCampaignContext(hudState)}`;
}


export function updateStoredPlotSummary(lastGmMessages: string[]): void {
  try {
    const recentNarrative = lastGmMessages.slice(-5).join('\n---\n');
    localStorage.setItem('edgerunners_plot_summary', recentNarrative);
  } catch (e) {
    console.warn('Failed to save plot summary to localStorage', e);
  }
}
