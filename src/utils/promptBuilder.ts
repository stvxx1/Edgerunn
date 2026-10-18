import { HUDState } from '../types';
import { CYBERWARE_SHOP, MASTER_GM_SYSTEM_PROMPT } from '../data/ruleset';

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

  // Installed chrome only appears in inventory by name; give the GM each piece's actual rules.
  const installedCyberware = CYBERWARE_SHOP.filter(c =>
    (hudState.inventory || []).some(item => item.toLowerCase().includes(c.name.toLowerCase()))
  );
  const cyberwareFormatted = installedCyberware.length > 0
    ? installedCyberware.map(c => `  * ${c.name} [${c.category}]: ${c.description}`).join('\n')
    : '  * None beyond what the inventory lists';

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
- INSTALLED CYBERWARE RULES (apply these exactly when the player uses them):
${cyberwareFormatted}
- CUSTOM DESCRIPTION, LOOK & BACKSTORY (history and appearance only, NOT the current location): ${hudState.customDescription || 'Street runner aesthetic with custom chrome and combat gear.'}

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
  const level = hudState.descriptiveDensity || 2;
  const density = DENSITY_TARGETS[level] || DENSITY_TARGETS[2];

  // The master prompt carries the GM's personality and rules verbatim. The section below only
  // adds length targets and repackages its output blocks into the JSON the client parses.
  return `${MASTER_GM_SYSTEM_PROMPT}

### 10. RESPONSE LENGTH — DESCRIPTIVE DENSITY ${level}/3 (${density.label.toUpperCase()})
- The "narrative" field must run ${density.words} words across ${density.paragraphs} paragraphs. A one-paragraph reply or a summary of events is a failure of the brief.
- Ground every scene first: location, light, layered smells and sounds, background chatter. Concrete specifics (brands, materials, weather) over generic adjectives.
- Play out the full consequences of the player's last action. NPCs react with body language, tone and their own agendas; they can lie, refuse or escalate.
- Named NPCs get a vivid physical introduction the first time they appear (build, face, clothing, chrome, a distinguishing mark).
- When you pause for a check or a risk analysis (sections 2 and 5), still write the scene up to that moment at full length, then present the check.
- Never decide what the player character says, thinks or does.
- Continuity: pick up exactly where the most recent GM message left off: same location, NPCs and situation, unless the player's action moves the scene. Backstory and lifepath details are history, never a reason to relocate the scene.

### 11. OUTPUT PACKAGING (overrides the placement rules in sections 3 and 4; their content is still mandatory)
Return one JSON object and nothing else (no markdown fences):
{
  "narrative": "the full scene, ${density.words} words, paragraphs separated by \\n\\n, with inline [Check: ...] / [Damage: ...] / [Quickhack: ...] tags where they apply",
  "mechanicalLog": { "skillCheck": "Stat + Skill involved, or None", "dv": 15, "cyberwareLoad": 0, "consequence": "mechanical outcome this turn" },
  "tacticalChoices": [
    { "id": "c1", "label": "[Category: Short Title]", "category": "Tactical|Netrun|Social|Stealth|Brute", "promptText": "first-person action with Stat + Skill vs DV", "isHighStakes": true, "skill": "Skill name", "dv": 15 }
  ],
  "stateBlocks": "the HUD Block, [ENEMIES_JSON: ...] if hostiles are present, [FACTION_UPDATES: ...] if reputation changed, and the full [HIDDEN: ...] memory container, exactly as specified in sections 3 and 4, separated by \\n"
}
- tacticalChoices replaces the CHOICES_JSON block: 3-4 distinct options, each with skill and DV.
- Never put HUD, HIDDEN, ENEMIES or FACTION blocks inside "narrative"; they belong in "stateBlocks".
- The [HIDDEN: ...] container is your memory between turns. The previous turn's container is supplied below as LONG-TERM NARRATIVE CONTEXT: carry it forward and update it rather than starting over.

${buildCampaignContext(hudState)}`;
}

// Keep the GM's [HIDDEN: ...] memory container so the next turn's prompt can feed it back.
const MEMORY_KEY = 'edgerunners_campaign_memory';
const PLOT_KEY = 'edgerunners_plot_summary';

// The GM's memory belongs to one campaign: wipe it on a new run, swap it when loading a save.
export function getCampaignMemory(): string | null {
  try {
    return localStorage.getItem(MEMORY_KEY);
  } catch {
    return null;
  }
}

export function resetCampaignMemory(memory?: string | null, messages: string[] = []): void {
  try {
    if (memory) localStorage.setItem(MEMORY_KEY, memory);
    else localStorage.removeItem(MEMORY_KEY);
    localStorage.removeItem(PLOT_KEY);
  } catch (e) {
    console.warn('Failed to reset campaign memory', e);
  }
  if (messages.length) updateStoredPlotSummary(messages);
}

export function storeHiddenMemory(stateBlocks: string): void {
  const start = stateBlocks.indexOf('[HIDDEN:');
  if (start === -1) return;
  // The container nests [TAG] labels, so take everything from [HIDDEN: to the end of the blocks.
  const memory = stateBlocks.slice(start).trim();
  try {
    localStorage.setItem('edgerunners_campaign_memory', memory);
  } catch (e) {
    console.warn('Failed to save GM hidden memory to localStorage', e);
  }
}

export function updateStoredPlotSummary(lastGmMessages: string[]): void {
  try {
    const recentNarrative = lastGmMessages.slice(-5).join('\n---\n');
    localStorage.setItem('edgerunners_plot_summary', recentNarrative);
  } catch (e) {
    console.warn('Failed to save plot summary to localStorage', e);
  }
}
