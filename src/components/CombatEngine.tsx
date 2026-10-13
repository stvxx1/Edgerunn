import React, { useState } from 'react';
import { Crosshair, Shield, ShieldAlert, Dices, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { CheckResult, DamageResult, HUDState } from '../types';
import { WEAPON_RANGE_DV_GRID, WEAPON_DATABASE } from '../data/ruleset';

interface CombatEngineProps {
  hudState: HUDState;
  setHudState: React.Dispatch<React.SetStateAction<HUDState>>;
}

export const CombatEngine: React.FC<CombatEngineProps> = ({ hudState, setHudState }) => {
  // Dice Roller State
  const [statVal, setStatVal] = useState(hudState.stats.REF);
  const [skillVal, setSkillVal] = useState(5);
  const [modVal, setModVal] = useState(0);
  const [targetDV, setTargetDV] = useState(15);
  const [lastCheck, setLastCheck] = useState<CheckResult | null>(null);

  // Bullet Dodging State
  const [attackerRoll, setAttackerRoll] = useState(18);
  const [hasCover, setHasCover] = useState(false);
  const [evasionResult, setEvasionResult] = useState<string | null>(null);

  // Damage Pipeline State
  const [numDice, setNumDice] = useState(3);
  const [location, setLocation] = useState<'Head' | 'Body'>('Body');
  const [lastDamage, setLastDamage] = useState<DamageResult | null>(null);

  // Roll 1d10 Action Check
  const rollActionCheck = async () => {
    try {
      const res = await fetch('/api/dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statVal, skillVal, modVal, dv: targetDV })
      });
      const data: CheckResult = await res.json();
      setLastCheck(data);
    } catch (err) {
      console.error('Dice check error:', err);
    }
  };

  // Calculate Bullet Dodging
  const calculateBulletDodge = () => {
    const ref = hudState.stats.REF;
    const dex = hudState.stats.DEX;
    const evasionSkill = 5; // Standard evasion skill level

    let d10 = Math.floor(Math.random() * 10) + 1;
    let total = d10 + dex + evasionSkill;
    let notes = '';

    if (ref >= 8) {
      notes = 'REF 8+: Full unrestricted Evasion roll.';
    } else if (hasCover) {
      notes = 'Cover-based dodge (< MOVE/2 meters): Full Evasion roll without penalty.';
    } else if (ref >= 6) {
      total -= 2;
      notes = 'REF 6-7 (No Cover): Evasion roll with -2 penalty.';
    } else {
      setEvasionResult('REF < 6 and No Cover: Cannot dodge ranged fire! Attacker compares against static Weapon Range DV.');
      return;
    }

    const success = total >= attackerRoll;
    setEvasionResult(
      `Dodge Check: 1d10(${d10}) + DEX(${dex}) + Evasion(${evasionSkill}) = ${total} vs Attacker Roll ${attackerRoll} -> ${
        success ? 'SUCCESSFULLY DODGED! 💥' : 'HIT TAKEN! 🩸'
      }\nRule Note: ${notes}`
    );
  };

  // Execute High-Lethality Damage Pipeline
  const executeDamagePipeline = async () => {
    try {
      const res = await fetch('/api/damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numDice,
          location,
          armorSP: location === 'Head' ? hudState.spHeadCurrent : hudState.spBodyCurrent
        })
      });
      const data: DamageResult = await res.json();
      setLastDamage(data);

      // Auto update character HUD if player is target
      if (data.hpDamageTaken > 0 || data.isAblated) {
        setHudState(prev => {
          const newHP = Math.max(0, prev.hpCurrent - data.hpDamageTaken);
          let wound = prev.woundState;
          if (newHP === 0) wound = 'Mortal Wound';
          else if (newHP <= prev.hpMax * 0.5) wound = 'Seriously Wounded';

          let newHeadSP = prev.spHeadCurrent;
          let newBodySP = prev.spBodyCurrent;

          if (location === 'Head') newHeadSP = data.newSP;
          else newBodySP = data.newSP;

          const injuries = [...prev.criticalInjuries];
          if (data.criticalInjury) {
            injuries.push(`${data.criticalInjury.name} (${data.criticalInjury.effect})`);
          }

          return {
            ...prev,
            hpCurrent: newHP,
            woundState: wound,
            spHeadCurrent: newHeadSP,
            spBodyCurrent: newBodySP,
            criticalInjuries: injuries
          };
        });
      }
    } catch (err) {
      console.error('Damage pipeline error:', err);
    }
  };

  const WeaponDatabase: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = WEAPON_DATABASE.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-2">
          <Search className="w-4 h-4 text-yellow-400" />
          WEAPON DATABASE
        </h2>
        <input
          type="text"
          placeholder="Search weapons..."
          className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 font-mono">
                <th className="py-1">NAME</th>
                <th className="py-1">DMG</th>
                <th className="py-1">ROF</th>
                <th className="py-1">COST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-neutral-300">
              {filtered.map((w, i) => (
                <tr key={i} className="hover:bg-neutral-900/50">
                  <td className="py-1.5 font-bold text-yellow-400">{w.name}</td>
                  <td className="py-1.5">{w.damage}</td>
                  <td className="py-1.5">{w.rof}</td>
                  <td className="py-1.5">{w.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-mono text-sm">
      {/* Top Section Header */}
      <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-red-400 uppercase flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-red-500 animate-pulse" />
            HIGH-LETHALITY COMBAT & DAMAGE ENGINE
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Enforces rebalanced bullet dodging, weapon range DVs, accelerated armor ablation (-2 SP), and 1d10 exploding dice.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Exploding 1d10 Action Roller & Bullet Dodging */}
        <div className="space-y-6">
          {/* Exploding Action Check Engine */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Dices className="w-4 h-4 text-yellow-400" />
              1. ACTION CHECK ROLLER (1D10 EXPLODING / IMPLODING)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block">STAT VALUE</label>
                <input
                  type="number"
                  value={statVal}
                  onChange={(e) => setStatVal(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-yellow-400 font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block">SKILL LEVEL</label>
                <input
                  type="number"
                  value={skillVal}
                  onChange={(e) => setSkillVal(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-yellow-400 font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block">SITUATIONAL MOD</label>
                <input
                  type="number"
                  value={modVal}
                  onChange={(e) => setModVal(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-yellow-400 font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block">TARGET DV</label>
                <input
                  type="number"
                  value={targetDV}
                  onChange={(e) => setTargetDV(parseInt(e.target.value, 10) || 9)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-cyan-400 font-bold text-center"
                />
              </div>
            </div>

            <button
              onClick={rollActionCheck}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded transition shadow-[0_0_10px_rgba(252,238,10,0.3)] flex items-center justify-center gap-2"
            >
              <Dices className="w-4 h-4" />
              ROLL 1D10 ACTION CHECK
            </button>

            {lastCheck && (
              <div className="p-3 bg-neutral-900 border border-yellow-500/40 rounded text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-neutral-300">CHECK RESULT:</span>
                  <span className={lastCheck.success ? 'text-emerald-400' : 'text-red-400'}>
                    {lastCheck.success ? `SUCCESS (+${lastCheck.margin})` : `FAILURE (${lastCheck.margin})`}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Rolls: [{lastCheck.d10Rolls.join(', ')}] {lastCheck.isExploded && '💥 EXPLODED!'} {lastCheck.isImploded && '💀 IMPLODED!'} + STAT({lastCheck.statVal}) + Skill({lastCheck.skillVal}) + Mod({lastCheck.modVal}) = <span className="text-yellow-300 font-bold">{lastCheck.total}</span> vs DV {lastCheck.dv}
                </p>
              </div>
            )}
          </div>

          {/* Rebalanced Bullet Dodging Calculator */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-cyan-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              2. REBALANCED BULLET DODGING CALCULATOR
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">ATTACKER ROLL TOTAL</label>
                <input
                  type="number"
                  value={attackerRoll}
                  onChange={(e) => setAttackerRoll(parseInt(e.target.value, 10) || 10)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-red-400 font-bold"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 p-2 rounded w-full">
                  <input
                    type="checkbox"
                    checked={hasCover}
                    onChange={(e) => setHasCover(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span className="text-[11px] text-neutral-300 font-bold">Within MOVE/2m of Cover</span>
                </label>
              </div>
            </div>

            <button
              onClick={calculateBulletDodge}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs rounded transition shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            >
              CALCULATE BULLET EVASION ROLL
            </button>

            {evasionResult && (
              <div className="p-3 bg-neutral-900 border border-cyan-500/40 rounded text-xs space-y-1 font-mono">
                <pre className="whitespace-pre-wrap text-cyan-200">{evasionResult}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: High-Lethality Damage Pipeline & Weapon Range DV Grid */}
        <div className="space-y-6">
          {/* Weapon Database Module */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4 shadow-xl">
            <WeaponDatabase />
          </div>

          {/* High Lethality Damage & Armor Ablation Pipeline */}
          <div className="bg-neutral-950 border border-red-950/80 rounded-lg p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              3. HIGH-LETHALITY DAMAGE & ABLATION PIPELINE
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">DAMAGE DICE (E.G. 3D6, 5D6)</label>
                <select
                  value={numDice}
                  onChange={(e) => setNumDice(parseInt(e.target.value, 10))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-yellow-400 font-bold"
                >
                  <option value={2}>2d6 (Light Pistol/SMG)</option>
                  <option value={3}>3d6 (Heavy Pistol)</option>
                  <option value={4}>4d6 (Very Heavy Pistol)</option>
                  <option value={5}>5d6 (Assault Rifle/Shotgun)</option>
                  <option value={8}>8d6 (RPG / Explosive)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">TARGET LOCATION</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as 'Head' | 'Body')}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-cyan-400 font-bold"
                >
                  <option value="Body">Body (Current SP {hudState.spBodyCurrent})</option>
                  <option value="Head">Head (Current SP {hudState.spHeadCurrent})</option>
                </select>
              </div>
            </div>

            <button
              onClick={executeDamagePipeline}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-black font-extrabold text-xs rounded transition shadow-[0_0_12px_rgba(255,0,85,0.4)] flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              EXECUTE DAMAGE & ACCELERATED ABLATION PIPELINE
            </button>

            {lastDamage && (
              <div className="p-3 bg-neutral-900 border border-red-500/50 rounded text-xs space-y-2">
                <div className="flex justify-between font-bold text-red-300">
                  <span>RAW DAMAGE: {lastDamage.rawDamage} [{lastDamage.damageDice.join(', ')}]</span>
                  <span>HP TAKEN: {lastDamage.hpDamageTaken} HP</span>
                </div>
                <div className="text-[11px] text-neutral-300 space-y-0.5">
                  <p>• SP Blocked: {lastDamage.damageBlocked} | New {lastDamage.location} SP: <span className="text-cyan-400 font-bold">{lastDamage.newSP}</span> (Ablated: {lastDamage.isAblated ? '-2 SP' : 'No'})</p>
                  {lastDamage.isCrushingHit && (
                    <p className="text-yellow-400 font-bold">💥 CRUSHING HIT! Two 6s rolled. Armor ablated & +5 critical bonus damage applied.</p>
                  )}
                  {lastDamage.criticalInjury && (
                    <div className="mt-1 p-2 bg-red-950 border border-red-700 rounded text-red-200">
                      <p className="font-bold">CRITICAL INJURY: {lastDamage.criticalInjury.name}</p>
                      <p className="text-[10px]">Effect: {lastDamage.criticalInjury.effect} | Treatment: {lastDamage.criticalInjury.treatment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ranged Weapon Range DV Grid Reference */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-bold text-neutral-300 uppercase border-b border-neutral-800 pb-2">
              4. WEAPON RANGE DV GRID REFERENCE
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 font-mono">
                    <th className="py-1">WEAPON</th>
                    <th className="py-1">0-6m</th>
                    <th className="py-1">7-12m</th>
                    <th className="py-1">13-25m</th>
                    <th className="py-1">26-50m</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-neutral-300">
                  {WEAPON_RANGE_DV_GRID.map((w, i) => (
                    <tr key={i} className="hover:bg-neutral-900/50">
                      <td className="py-1.5 font-bold text-yellow-400">{w.weapon}</td>
                      <td className="py-1.5">{w.rangeDV[0].split(' ')[1]}</td>
                      <td className="py-1.5">{w.rangeDV[1].split(' ')[1]}</td>
                      <td className="py-1.5">{w.rangeDV[2].split(' ')[1]}</td>
                      <td className="py-1.5">{w.rangeDV[3].split(' ')[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
