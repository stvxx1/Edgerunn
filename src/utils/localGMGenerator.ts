import { HUDState } from '../types';
import { generateDynamicChoices } from './choiceGenerator';

// Rich varied narrative seeds for different contexts when completely disconnected
const COMBAT_SCENARIOS = [
  {
    success: (char: string, action: string) => `You pivot with calibrated reflexes into the strobing shadows of Upper Watson. Your weapon hammers out three sharp concussions, punching through the rusted metal divider and tearing into the point-man's exposed servos. Sparks erupt in violent arcs, spraying boiling hydraulic lubricant across the pavement. The surviving hostile scrambles backwards into an alcove, desperately thumbing a jammed magazine release while coughing up bloody phlegm into the toxic smog.`,
    failure: (char: string, action: string) => `A sudden flare of emergency strobe lights blinds your optical sensors as you commit to the engagement. Your volley chews into concrete, throwing showers of pulverized brick across your face. Before you can recover your stance, high-caliber lead gouges into the partition right beside your head, showering you with razor-sharp ceramic shrapnel and ringing your audio cyberware with deafening static.`
  },
  {
    success: (char: string, action: string) => `Closing the distance in an explosive burst of momentum, you shatter their defensive line. The impact buckles their chest harness, driving the breath from their lungs with a sickening crack. You wrench their carbine free and throw them headfirst into the corrugated container wall, leaving them limp in a puddle of oily chemical runoff as the alley plunges back into tense silence.`,
    failure: (char: string, action: string) => `You overcommit into the killzone. A hidden automated sentry turret swivels on a rusted gantry above, its laser sight locking dead onto your center mass. Tracer fire rakes across your position, forcing you to throw yourself flat onto the rain-slicked asphalt as ricochets whine inches above your spine.`
  }
];

const NETRUN_SCENARIOS = [
  {
    success: (char: string, action: string) => `Your neural link flares white-hot as you slip past their gateway daemon. Sub-dermal cooling coils hiss against your collarbone, dispersing the thermal surge as you slice through their subnet encryption. Data cascades across your retinas: personnel rosters, patrol rotations, and unencrypted security camera feeds now submit directly to your interface command.`,
    failure: (char: string, action: string) => `Black-ICE strikes back before your daemon handshake can stabilize. A brutal spike of feedback burns behind your ocular implants, sending a jolt of pure vertigo tearing through your central nervous system. Warning klaxons shriek in your audio canal as local intrusion countermeasures scramble your feed.`
  }
];

const SOCIAL_SCENARIOS = [
  {
    success: (char: string, action: string) => `Your words drop like cold chrome into the dim room. You don't raise your voice or posture—your reputation and the sheer lethal calm in your posture do the heavy lifting. The contact's throat bobs as they swallow their retort, their hands slowly drifting away from their hidden sidearm. They slide the datashard across the scuffed steel table with trembling fingers.`,
    failure: (char: string, action: string) => `The contact's expression hardens into a tight, contemptuous smirk. "You think you're the first chromed-up solo to strut into my club throwing weight around?" A subtle hand sign beneath the counter triggers the deadbolt on the rear exit, and two augmented heavies step out from the strobe-lit curtain behind you.`
  }
];

const GENERAL_SCENARIOS = [
  {
    success: (char: string, action: string) => `Moving with patient, lethal economy, you slip past the roving searchlights slicing through the acid-rain drizzle of Night City. The ambient roar of aerodyne traffic overhead masks your footsteps as you breach the threshold and secure an advantageous vantage overlooking the courtyard.`,
    failure: (char: string, action: string) => `A loose metal plate clatters beneath your weight, echoing sharply off the damp alleyway bricks. Down at the perimeter gate, two flashlights snap toward your direction in unison. "Got movement on the catwalk!" a gravelly voice barks over open comms.`
  },
  {
    success: (char: string, action: string) => `You trust your street instincts and push through the maze of alleyways. Night City's nocturnal underbelly opens up ahead: flickering holo-billboards advertising cheap noodles and chrome upgrades, the thumping bass of an underground ripper clinic vibrating through your boots, and a clear path toward your objective.`,
    failure: (char: string, action: string) => `The passage ends abruptly in a razor-wire dead end choked with burning trash bins. Footsteps splash rapidly through the puddles behind you, closing the distance before you can find an alternate climb.`
  }
];

export function generateOfflineGMResponse(
  message: string,
  history: Array<{ sender: string; text: string }>,
  currentHUD?: HUDState,
  isRateLimit: boolean = true
): string {
  const hud = currentHUD || {
    name: 'Edgerunner',
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
    cash: 2100,
    activeStatusEffects: [],
    criticalInjuries: [],
    stats: { INT: 6, REF: 7, DEX: 7, TECH: 6, COOL: 6, WILL: 6, LUCK: 5, MOVE: 6, BODY: 7, EMP: 5 },
    inventory: ['Heavy Pistol', 'Militech Assault Rifle', 'Trauma Team Hypo', 'Kevlar Vest'],
    customDescription: 'Chrome-plated street operative in a scuffed leather duster.',
    descriptiveDensity: 2
  };

  const inputLower = message.toLowerCase();
  const stats = hud.stats;

  // Determine check context
  const isCombat = inputLower.includes('shoot') || inputLower.includes('fire') || inputLower.includes('aim') || 
                   inputLower.includes('gun') || inputLower.includes('slash') || inputLower.includes('attack') || 
                   inputLower.includes('kill') || inputLower.includes('stab') || inputLower.includes('strike');
  
  const isNetrun = inputLower.includes('hack') || inputLower.includes('interface') || inputLower.includes('deck') || 
                   inputLower.includes('breach') || inputLower.includes('daemon') || inputLower.includes('ice');

  const isSocial = inputLower.includes('talk') || inputLower.includes('persuade') || inputLower.includes('intimidat') || 
                   inputLower.includes('bribe') || inputLower.includes('lie') || inputLower.includes('bluff') || inputLower.includes('ask');

  const isSneak = inputLower.includes('sneak') || inputLower.includes('stealth') || inputLower.includes('hide') || 
                  inputLower.includes('shadow') || inputLower.includes('evade') || inputLower.includes('dodge');

  // Roll d10
  const d10 = Math.floor(Math.random() * 10) + 1;
  const isExploding = d10 === 10;
  const isFumble = d10 === 1;
  const bonus = isExploding ? Math.floor(Math.random() * 10) + 1 : 0;
  const penalty = isFumble ? Math.floor(Math.random() * 10) + 1 : 0;
  const rollTotal = d10 + bonus - penalty;

  let statVal = stats.REF;
  let skillRank = 6;
  let dv = 14;

  if (isNetrun) {
    statVal = stats.INT;
    dv = 15;
  } else if (isSocial) {
    statVal = stats.COOL;
    dv = 13;
  } else if (isSneak) {
    statVal = stats.DEX;
    dv = 14;
  }

  const grandTotal = rollTotal + statVal + skillRank;
  const success = grandTotal >= dv;

  // Select appropriate varied scenario
  let scenarioPool = GENERAL_SCENARIOS;
  if (isCombat) scenarioPool = COMBAT_SCENARIOS;
  else if (isNetrun) scenarioPool = NETRUN_SCENARIOS;
  else if (isSocial) scenarioPool = SOCIAL_SCENARIOS;

  const scenario = scenarioPool[Math.floor(Math.random() * scenarioPool.length)];
  const narrative = success 
    ? scenario.success(hud.customDescription || '', message)
    : scenario.failure(hud.customDescription || '', message);

  // Dynamic consequences
  let newHP = hud.hpCurrent;
  let newSPBody = hud.spBodyCurrent;
  let newCash = hud.cash;

  if (!success && (isCombat || isNetrun)) {
    newHP = Math.max(1, newHP - Math.floor(Math.random() * 5 + 3));
    newSPBody = Math.max(0, newSPBody - 1);
  } else if (success && (inputLower.includes('loot') || inputLower.includes('search') || inputLower.includes('pay') || inputLower.includes('creds'))) {
    newCash += 350;
  }

  const woundState = newHP <= Math.floor(hud.hpMax / 2) ? (newHP <= 5 ? 'Mortal Wound' : 'Seriously Wounded') : 'Light';

  const updatedHudState: HUDState = {
    ...hud,
    hpCurrent: newHP,
    spBodyCurrent: newSPBody,
    woundState,
    cash: newCash
  };

  const hudBlock = `[ Name: ${hud.name} | Role: ${hud.role} (Rank ${hud.roleRank}) ]
[ HP: ${newHP}/${hud.hpMax} | Wound State: ${woundState} ]
[ Armor SP: Head ${hud.spHeadCurrent}/${hud.spHeadMax} | Body ${newSPBody}/${hud.spBodyMax} ]
[ Humanity: ${hud.humanityCurrent}/${hud.humanityMax} (EMP: ${hud.empCurrent}) | Street Cred: Level ${hud.streetCred} | Heat: Level ${hud.heat} ]
[ Cash: ${newCash}eb | Active Status Effects: ${hud.activeStatusEffects.length > 0 ? hud.activeStatusEffects.join(', ') : 'None'} ]`;

  const choices = generateDynamicChoices(updatedHudState, narrative);
  const choicesBlock = `[CHOICES_JSON: ${JSON.stringify(choices.slice(0, 3))}]`;

  // Provide seamless narrative output without repetitive mechanical prefix loop
  return [narrative, hudBlock, choicesBlock].filter(Boolean).join('\n\n');
}
