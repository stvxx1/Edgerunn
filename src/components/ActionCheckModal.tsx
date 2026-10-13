import React, { useState, useEffect } from 'react';
import { Dices, AlertTriangle, ShieldAlert, Sparkles, X, Flame, Zap, Crosshair, CheckCircle2, XCircle } from 'lucide-react';
import { HUDState, ChoiceChip, CheckResult } from '../types';

interface ActionCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  hudState: HUDState;
  initialChoice?: ChoiceChip | null;
  onExecuteCheck: (checkPrompt: string) => void;
}

export const ActionCheckModal: React.FC<ActionCheckModalProps> = ({
  isOpen,
  onClose,
  hudState,
  initialChoice,
  onExecuteCheck
}) => {
  const [selectedStat, setSelectedStat] = useState<keyof typeof hudState.stats>('REF');
  const [skillName, setSkillName] = useState<string>('Handgun');
  const [skillVal, setSkillVal] = useState<number>(6);
  const [modVal, setModVal] = useState<number>(0);
  const [targetDV, setTargetDV] = useState<number>(15);
  const [manualDiceRoll, setManualDiceRoll] = useState<string>('');
  const [rollResult, setRollResult] = useState<CheckResult | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  useEffect(() => {
    setRollResult(null);
    if (initialChoice) {
      if (initialChoice.dv) setTargetDV(initialChoice.dv);
      else setTargetDV(15);
      if (initialChoice.skill) setSkillName(initialChoice.skill);
      if (initialChoice.category === 'Netrun') {
        setSelectedStat('INT');
        setSkillName(initialChoice.skill || 'Interface');
      } else if (initialChoice.category === 'Social') {
        setSelectedStat('COOL');
        setSkillName(initialChoice.skill || 'Persuasion');
      } else if (initialChoice.category === 'Stealth') {
        setSelectedStat('DEX');
        setSkillName(initialChoice.skill || 'Stealth');
      } else if (initialChoice.category === 'Brute' || initialChoice.category === 'Tactical') {
        setSelectedStat('REF');
        setSkillName(initialChoice.skill || 'Handgun');
      }
    }
  }, [initialChoice, isOpen]);

  if (!isOpen) return null;

  const statVal = hudState.stats[selectedStat] || 6;

  const handleRollDice = async () => {
    setIsRolling(true);
    try {
      let rand = Math.pow(Math.random(), 1.4); // Skews results slightly lower to increase failure rate
      let roll10 = Math.floor(rand * 10) + 1;
      let d10Rolls = [roll10];
      let rollTotal = roll10;
      let isExploded = false;
      let isImploded = false;

      if (manualDiceRoll && !isNaN(parseInt(manualDiceRoll))) {
        roll10 = Math.min(10, Math.max(1, parseInt(manualDiceRoll)));
        d10Rolls = [roll10];
        rollTotal = roll10;
      } else {
        if (roll10 === 10) {
          isExploded = true;
          let extraRand = Math.pow(Math.random(), 1.4);
          let extra = Math.floor(extraRand * 10) + 1;
          d10Rolls.push(extra);
          rollTotal += extra;
        } else if (roll10 === 1) {
          isImploded = true;
          // When fumbling, we want the penalty to be a normal random or skewed higher so it hurts more!
          let penaltyRand = Math.pow(Math.random(), 0.8); 
          let penalty = Math.floor(penaltyRand * 10) + 1;
          d10Rolls.push(penalty);
          rollTotal -= penalty;
        }
      }

      const grandTotal = rollTotal + Number(statVal) + Number(skillVal) + Number(modVal);
      const success = grandTotal >= Number(targetDV);

      const res: CheckResult = {
        d10Rolls,
        statVal: Number(statVal),
        skillVal: Number(skillVal),
        modVal: Number(modVal),
        total: grandTotal,
        isExploded,
        isImploded,
        dv: Number(targetDV),
        success,
        margin: grandTotal - Number(targetDV)
      };

      setRollResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRolling(false);
    }
  };

  const handleConfirmAndSend = () => {
    let checkText = '';
    if (rollResult) {
      const rollsStr = rollResult.d10Rolls.join('+');
      checkText = `[CHECK RESOLUTION: Stat (${selectedStat} ${statVal}) + Skill (${skillName} ${skillVal}) + Mod (${modVal >= 0 ? '+' + modVal : modVal}) + 1d10 (${rollsStr}) = TOTAL ${rollResult.total} vs DV ${targetDV} -> ${rollResult.success ? 'SUCCESS' : 'FAILURE'}]`;
      if (initialChoice?.promptText) {
        checkText = `${checkText}\n\nPLAYER ACTION: ${initialChoice.promptText}`;
      } else {
        checkText = `${checkText}\n\nPLAYER ACTION: I attempt a ${skillName} check (${selectedStat}) against DV ${targetDV}.`;
      }
    } else {
      checkText = `I prepare a high-stakes ${selectedStat} (${skillName}) check against DV ${targetDV}. Base Stat: ${statVal}.`;
    }

    onExecuteCheck(checkText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-950 border-2 border-red-500/80 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-[0_0_30px_rgba(255,0,85,0.4)] relative font-mono text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-500/40 pb-3">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <span>[HIGH-STAKES ACTION CHECK ENGINE]</span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {initialChoice && (
          <div className="bg-red-950/40 border border-red-500/50 rounded p-3 text-red-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{initialChoice.label}</span>
              <span className="text-yellow-400">TARGET DV {targetDV}</span>
            </div>
            <p className="text-[11px] text-neutral-300 italic">{initialChoice.promptText}</p>
          </div>
        )}

        {/* Stat Selection Grid */}
        <div className="space-y-2">
          <label className="text-cyan-400 font-bold uppercase block text-[11px]">Select Character Stat:</label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {(Object.keys(hudState.stats) as Array<keyof typeof hudState.stats>).map((stat) => {
              const val = hudState.stats[stat];
              const isSelected = selectedStat === stat;
              return (
                <button
                  key={stat}
                  type="button"
                  onClick={() => setSelectedStat(stat)}
                  className={`p-2 rounded border text-center font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <div className="text-[10px] text-neutral-500">{stat}</div>
                  <div className="text-sm">{val}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skill & DV Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-neutral-400 block mb-1">Skill Name:</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 rounded text-neutral-100 font-bold"
            />
          </div>
          <div>
            <label className="text-neutral-400 block mb-1">Skill Bonus (+):</label>
            <input
              type="number"
              value={skillVal}
              onChange={(e) => setSkillVal(parseInt(e.target.value) || 0)}
              className="w-full bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 rounded text-yellow-400 font-bold"
            />
          </div>
          <div>
            <label className="text-neutral-400 block mb-1">Target DV:</label>
            <input
              type="number"
              value={targetDV}
              onChange={(e) => setTargetDV(parseInt(e.target.value) || 15)}
              className="w-full bg-neutral-900 border border-red-500/60 px-2.5 py-1.5 rounded text-red-400 font-bold"
            />
          </div>
        </div>

        {/* Situational Modifier & Manual Roll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-neutral-400 block mb-1">Situational Modifier (+/-):</label>
            <input
              type="number"
              value={modVal}
              onChange={(e) => setModVal(parseInt(e.target.value) || 0)}
              placeholder="e.g. +2 Cover, -2 Hurt"
              className="w-full bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 rounded text-cyan-300 font-bold"
            />
          </div>
          <div>
            <label className="text-neutral-400 block mb-1">Manual 1d10 Override (Optional):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={manualDiceRoll}
              onChange={(e) => setManualDiceRoll(e.target.value)}
              placeholder="Leave blank for random roll"
              className="w-full bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 rounded text-neutral-200"
            />
          </div>
        </div>

        {/* Dice Roll Action Button */}
        <div className="pt-2">
          <button
            onClick={handleRollDice}
            disabled={isRolling}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-black font-extrabold uppercase rounded shadow-[0_0_15px_rgba(255,0,85,0.5)] flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <Dices className="w-5 h-5 animate-spin" />
            <span>{isRolling ? 'Rolling Cyberpunk 1d10...' : 'EXECUTE 1D10 ACTION CHECK ROLL'}</span>
          </button>
        </div>

        {/* Roll Output Display Card */}
        {rollResult && (
          <div className={`p-4 rounded border font-mono space-y-2 text-xs transition-all animate-fade-in ${
            rollResult.success
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-red-950/60 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
          }`}>
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                {rollResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 uppercase">CHECK SUCCESSFUL!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 uppercase">CHECK FAILED</span>
                  </>
                )}
              </span>
              <span className="text-yellow-300">TOTAL: {rollResult.total} vs DV {rollResult.dv}</span>
            </div>

            <div className="text-[11px] text-neutral-300 space-y-1">
              <div>
                <strong>Math Breakdown:</strong> Stat ({selectedStat} {statVal}) + Skill ({skillName} {skillVal}) + Mod ({modVal}) + 1d10 ({rollResult.d10Rolls.join(' + ')}) = <strong className="text-white text-sm">{rollResult.total}</strong>
              </div>
              {rollResult.isExploded && (
                <div className="text-yellow-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  EXPLODING 10! Extra die rolled!
                </div>
              )}
              {rollResult.isImploded && (
                <div className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  CRITICAL FUMBLE! Natural 1 penalty applied.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirm / Close Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold text-xs transition"
          >
            Cancel Action
          </button>
          <div className="flex items-center gap-2">
            {!rollResult ? (
              <button
                onClick={handleRollDice}
                disabled={isRolling}
                className="px-5 py-2.5 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold uppercase shadow-[0_0_15px_rgba(252,238,10,0.4)] flex items-center gap-2 text-xs transition cursor-pointer"
              >
                <Dices className="w-4 h-4" />
                {isRolling ? 'ROLLING D10...' : 'MANDATORY ROLL (d10 + Stat + Skill)'}
              </button>
            ) : (
              <button
                onClick={handleConfirmAndSend}
                className="px-5 py-2.5 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold uppercase shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2 text-xs transition cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                SEND ROLL & OUTCOME TO GM
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
