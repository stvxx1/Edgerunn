import { HUDState, WoundState, ChoiceChip, FactionReputation, NPCContact, EnemyUnit } from '../types';
import { generateDynamicChoices } from './choiceGenerator';

export function parseHUDBlock(text: string, currentHUD: HUDState): { cleanText: string; updatedHUD: HUDState } {
  const updated = { ...currentHUD };
  let cleanText = text;
  let parsedChoicesFromGM = false;

  try {
    // 1. Check for [CHOICES_JSON: ...] block
    const choicesMatch = text.match(/\[CHOICES_JSON:\s*(\[\s*\{[\s\S]*?\}\s*\])\s*\]/i);
    if (choicesMatch) {
      try {
        const choicesParsed: ChoiceChip[] = JSON.parse(choicesMatch[1]);
        if (choicesParsed && choicesParsed.length > 0) {
          updated.activeChoices = choicesParsed;
          parsedChoicesFromGM = true;
        }
        cleanText = cleanText.replace(choicesMatch[0], '');
      } catch (e) {
        console.warn('Failed to parse CHOICES_JSON block', e);
      }
    }

    // 2. Check for [FACTION_UPDATES: Faction Name = +10, Other Faction = -15]
    const factionMatch = text.match(/\[FACTION_UPDATES:\s*([^\]]+)\]/i);
    if (factionMatch && updated.factions) {
      const updatesStr = factionMatch[1];
      const items = updatesStr.split(',');
      const newFactions = [...updated.factions];

      items.forEach(item => {
        const parts = item.split('=');
        if (parts.length === 2) {
          const fName = parts[0].trim().toLowerCase();
          const changeVal = parseInt(parts[1].trim(), 10);
          if (!isNaN(changeVal)) {
            const idx = newFactions.findIndex(f => f.name.toLowerCase().includes(fName) || fName.includes(f.name.toLowerCase()));
            if (idx !== -1) {
              const currentStanding = newFactions[idx].standing;
              const newStanding = Math.max(-100, Math.min(100, currentStanding + changeVal));
              let tier: FactionReputation['tier'] = 'Neutral';
              if (newStanding <= -50) tier = 'Hostile';
              else if (newStanding < 0) tier = 'Unfriendly';
              else if (newStanding >= 50) tier = 'Allied';
              else if (newStanding > 10) tier = 'Friendly';

              newFactions[idx] = {
                ...newFactions[idx],
                standing: newStanding,
                tier,
                bounty: newStanding <= -30 ? Math.abs(newStanding) * 100 : 0
              };
            }
          }
        }
      });
      updated.factions = newFactions;
      cleanText = cleanText.replace(factionMatch[0], '');
    }

    // 3. Check for [ENEMIES_JSON: ...] block
    const enemiesMatch = text.match(/\[ENEMIES_JSON:\s*(\[\s*\{[\s\S]*?\}\s*\])\s*\]/i);
    if (enemiesMatch) {
      try {
        const enemiesParsed: EnemyUnit[] = JSON.parse(enemiesMatch[1]);
        updated.activeEnemies = enemiesParsed;
        cleanText = cleanText.replace(enemiesMatch[0], '');
      } catch (e) {
        console.warn('Failed to parse ENEMIES_JSON block', e);
      }
    }

    // 4. Regex matching standard HUD block pattern
    const hudRegex = /\[\s*Name:\s*([^|]+)\|\s*Role:\s*([^(]+)\(Rank\s*(\d+)\)\s*\]\s*\n?\[\s*HP:\s*(\d+)\/(\d+)\s*\|\s*Wound State:\s*([^\]]+)\]\s*\n?\[\s*Armor SP:\s*Head\s*(\d+)\/(\d+)\s*\|\s*Body\s*(\d+)\/(\d+)\s*\]\s*\n?\[\s*Humanity:\s*(\d+)\/(\d+)\s*\(EMP:\s*(\d+)\)\s*\|\s*Street Cred:\s*Level\s*(\d+)\s*\|\s*Heat:\s*Level\s*(\d+)\s*\]\s*\n?\[\s*Cash:\s*([\d,]+)\s*eb\s*\|\s*Active Status Effects:\s*([^\]]+)\]/i;

    const match = text.match(hudRegex);
    if (match) {
      const [, name, role, roleRank, hpCur, hpMax, wound, spHeadCur, spHeadMax, spBodyCur, spBodyMax, humCur, humMax, emp, streetCred, heat, cash, statusEffects] = match;

      updated.name = name.trim() || updated.name;
      updated.role = role.trim() || updated.role;
      updated.roleRank = parseInt(roleRank, 10) || updated.roleRank;
      updated.hpCurrent = parseInt(hpCur, 10);
      updated.hpMax = parseInt(hpMax, 10);
      
      const woundStr = wound.trim() as WoundState;
      if (['Light', 'Seriously Wounded', 'Mortal Wound'].includes(woundStr)) {
        updated.woundState = woundStr;
      }

      updated.spHeadCurrent = parseInt(spHeadCur, 10);
      updated.spHeadMax = parseInt(spHeadMax, 10);
      updated.spBodyCurrent = parseInt(spBodyCur, 10);
      updated.spBodyMax = parseInt(spBodyMax, 10);

      updated.humanityCurrent = parseInt(humCur, 10);
      updated.humanityMax = parseInt(humMax, 10);
      updated.empCurrent = parseInt(emp, 10);

      updated.streetCred = parseInt(streetCred, 10);
      updated.heat = parseInt(heat, 10);
      updated.cash = parseInt(cash.replace(/,/g, ''), 10);

      const effects = statusEffects.trim();
      if (effects && effects.toLowerCase() !== 'none') {
        updated.activeStatusEffects = effects.split(',').map(s => s.trim());
      } else {
        updated.activeStatusEffects = [];
      }
    }

    if (!parsedChoicesFromGM) {
      updated.activeChoices = generateDynamicChoices(updated, cleanText);
    }
  } catch (err) {
    console.warn('Failed to parse HUD block from GM output:', err);
  }

  return { cleanText, updatedHUD: updated };
}
