import { HUDState } from '../types';
import { MASTER_GM_SYSTEM_PROMPT } from '../data/ruleset';

export function buildDynamicSystemPrompt(hudState: HUDState): string {
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

  return `${MASTER_GM_SYSTEM_PROMPT}\n${dynamicContext}`;
}


export function updateStoredPlotSummary(lastGmMessages: string[]): void {
  try {
    const recentNarrative = lastGmMessages.slice(-5).join('\n---\n');
    localStorage.setItem('edgerunners_plot_summary', recentNarrative);
  } catch (e) {
    console.warn('Failed to save plot summary to localStorage', e);
  }
}
