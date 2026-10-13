import React, { useState } from 'react';
import { Shield, Heart, Zap, Flame, DollarSign, Plus, Trash2, AlertTriangle, Activity, Edit3, Package, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { HUDState, WoundState } from '../types';

interface CharacterHUDProps {
  hudState: HUDState;
  setHudState: React.Dispatch<React.SetStateAction<HUDState>>;
  onOpenLifepathBuilder: () => void;
}

export const CharacterHUD: React.FC<CharacterHUDProps> = ({ hudState, setHudState, onOpenLifepathBuilder }) => {
  const [newEffect, setNewEffect] = useState('');
  const [newInjury, setNewInjury] = useState('');
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [shake, setShake] = useState(false);
  const [prevHP, setPrevHP] = useState(hudState.hpCurrent);

  // Inventory & Custom Description State
  const [newItemName, setNewItemName] = useState('');
  const [inventoryFeedback, setInventoryFeedback] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescText, setEditDescText] = useState(hudState.customDescription || '');

  // Trigger shake on significant damage
  if (hudState.hpCurrent < prevHP - 10) {
    setShake(true);
    setPrevHP(hudState.hpCurrent);
    setTimeout(() => setShake(false), 500);
  } else if (hudState.hpCurrent !== prevHP) {
    setPrevHP(hudState.hpCurrent);
  }

  // Calculate wound state based on HP
  const updateHP = (delta: number) => {
    setHudState(prev => {
      const newHP = Math.max(0, Math.min(prev.hpMax, prev.hpCurrent + delta));
      let wound: WoundState = 'Light';
      if (newHP === 0) {
        wound = 'Mortal Wound';
      } else if (newHP <= prev.hpMax * 0.5) {
        wound = 'Seriously Wounded';
      }
      return { ...prev, hpCurrent: newHP, woundState: wound };
    });
  };

  // Accelerated armor ablation helper
  const ablateHeadSP = (amount: number = 2) => {
    setHudState(prev => ({
      ...prev,
      spHeadCurrent: Math.max(0, prev.spHeadCurrent - amount)
    }));
  };

  const ablateBodySP = (amount: number = 2) => {
    setHudState(prev => ({
      ...prev,
      spBodyCurrent: Math.max(0, prev.spBodyCurrent - amount)
    }));
  };

  // Humanity update and auto EMP recalculation
  const updateHumanity = (delta: number) => {
    setHudState(prev => {
      const newHum = Math.max(0, Math.min(prev.humanityMax, prev.humanityCurrent + delta));
      const newEmp = Math.floor(newHum / 10);
      return { ...prev, humanityCurrent: newHum, empCurrent: newEmp, stats: { ...prev.stats, EMP: newEmp } };
    });
  };

  const addStatusEffect = () => {
    if (!newEffect.trim()) return;
    setHudState(prev => ({
      ...prev,
      activeStatusEffects: [...prev.activeStatusEffects, newEffect.trim()]
    }));
    setNewEffect('');
  };

  const removeStatusEffect = (index: number) => {
    setHudState(prev => ({
      ...prev,
      activeStatusEffects: prev.activeStatusEffects.filter((_, i) => i !== index)
    }));
  };

  const addCriticalInjury = () => {
    if (!newInjury.trim()) return;
    setHudState(prev => ({
      ...prev,
      criticalInjuries: [...prev.criticalInjuries, newInjury.trim()]
    }));
    setNewInjury('');
  };

  const removeCriticalInjury = (index: number) => {
    setHudState(prev => ({
      ...prev,
      criticalInjuries: prev.criticalInjuries.filter((_, i) => i !== index)
    }));
  };

  // Inventory Handlers
  const addItem = (name: string) => {
    if (!name.trim()) return;
    setHudState(prev => ({
      ...prev,
      inventory: [...(prev.inventory || []), name.trim()]
    }));
    setNewItemName('');
  };

  const removeItem = (index: number) => {
    setHudState(prev => ({
      ...prev,
      inventory: (prev.inventory || []).filter((_, i) => i !== index)
    }));
  };

  const useItem = (item: string, index: number) => {
    const lower = item.toLowerCase();
    let feedbackMsg = `Used ${item}.`;

    if (lower.includes('hypo') || lower.includes('speedheal') || lower.includes('medkit') || lower.includes('stim') || lower.includes('patch')) {
      const healAmount = 5;
      updateHP(healAmount);
      feedbackMsg = `Used ${item}! Injected combat medicine (+${healAmount} HP).`;
    }

    setHudState(prev => ({
      ...prev,
      inventory: (prev.inventory || []).filter((_, i) => i !== index)
    }));

    setInventoryFeedback(feedbackMsg);
    setTimeout(() => setInventoryFeedback(''), 4000);
  };

  const saveCustomDescription = () => {
    setHudState(prev => ({
      ...prev,
      customDescription: editDescText.trim()
    }));
    setIsEditingDescription(false);
  };

  const hpPercentage = Math.round((hudState.hpCurrent / hudState.hpMax) * 100);

  return (
    <motion.div
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto p-4 space-y-6 font-mono text-sm"
    >
      {/* Top Banner & Profile Overview */}
      <div className="bg-neutral-950 border border-cyan-500/40 rounded-lg p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-yellow-400 tracking-wide uppercase">
                {hudState.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 text-xs">
                {hudState.role} (Rank {hudState.roleRank})
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Cyberpunk RED Edgerunners Enhanced Operator
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingDescription(!isEditingDescription)}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40 font-bold text-xs rounded transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {isEditingDescription ? 'CLOSE DESCRIPTION' : 'EDIT DESCRIPTION'}
            </button>
            <button
              onClick={onOpenLifepathBuilder}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded transition shadow-[0_0_12px_rgba(252,238,10,0.4)] flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              BUILDER / LIFEPATH
            </button>
          </div>
        </div>

        {/* Custom Character Description Banner */}
        {isEditingDescription ? (
          <div className="mt-4 p-4 bg-neutral-900 border border-cyan-500/50 rounded space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                OPERATOR DESCRIPTION & SIGNATURE LOOK (SENT TO GM)
              </span>
              <button
                onClick={saveCustomDescription}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                SAVE TO DOSSIER
              </button>
            </div>
            <textarea
              value={editDescText}
              onChange={(e) => setEditDescText(e.target.value)}
              rows={3}
              placeholder="Describe your appearance, chrome implants, clothes, scars, and attitude..."
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-cyan-400 rounded p-2.5 text-xs text-neutral-200 font-mono resize-y"
            />
          </div>
        ) : (
          hudState.customDescription && (
            <div className="mt-4 p-3 bg-neutral-900/70 border-l-2 border-cyan-400 rounded-r text-xs text-neutral-300">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-0.5">
                OPERATOR DOSSIER & LOOK:
              </span>
              <p className="italic">{hudState.customDescription}</p>
            </div>
          )
        )}

        {/* Primary Vitals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {/* Health Pool Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs font-bold flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" />
                HEALTH POOL (HP)
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  hudState.woundState === 'Mortal Wound'
                    ? 'bg-red-950 text-red-400 border border-red-600 animate-pulse'
                    : hudState.woundState === 'Seriously Wounded'
                    ? 'bg-yellow-950 text-yellow-400 border border-yellow-600'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                }`}
              >
                {hudState.woundState}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-neutral-300">{hudState.hpCurrent} / {hudState.hpMax} HP</span>
                <span className="text-neutral-500">{hpPercentage}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden border border-neutral-700">
                <div
                  className={`h-full transition-all ${
                    hpPercentage <= 25
                      ? 'bg-red-600'
                      : hpPercentage <= 50
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, hpPercentage))}%` }}
                />
              </div>
            </div>

            {/* Quick HP Controls */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => updateHP(-5)}
                className="flex-1 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 rounded text-xs font-bold"
              >
                -5 HP
              </button>
              <button
                onClick={() => updateHP(-1)}
                className="flex-1 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 rounded text-xs font-bold"
              >
                -1 HP
              </button>
              <button
                onClick={() => updateHP(1)}
                className="flex-1 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded text-xs font-bold"
              >
                +1 HP
              </button>
              <button
                onClick={() => updateHP(5)}
                className="flex-1 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded text-xs font-bold"
              >
                +5 HP
              </button>
            </div>
          </div>

          {/* Armor SP & Ablation Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                ARMOR SP (ABLATION)
              </span>
              <span className="text-[10px] text-neutral-500">ACCELERATED -2</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/80 border border-neutral-800 p-2 rounded text-center">
                <span className="text-[10px] text-neutral-400 block uppercase">HEAD SP</span>
                <span className="text-xl font-black text-cyan-400">{hudState.spHeadCurrent} / {hudState.spHeadMax}</span>
                <button
                  onClick={() => ablateHeadSP(2)}
                  className="w-full mt-1 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded text-[10px] font-bold"
                >
                  -2 Ablate Head
                </button>
              </div>

              <div className="bg-black/80 border border-neutral-800 p-2 rounded text-center">
                <span className="text-[10px] text-neutral-400 block uppercase">BODY SP</span>
                <span className="text-xl font-black text-cyan-400">{hudState.spBodyCurrent} / {hudState.spBodyMax}</span>
                <button
                  onClick={() => ablateBodySP(2)}
                  className="w-full mt-1 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded text-[10px] font-bold"
                >
                  -2 Ablate Body
                </button>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-neutral-500">
              <button
                onClick={() => setHudState(p => ({ ...p, spHeadCurrent: p.spHeadMax, spBodyCurrent: p.spBodyMax }))}
                className="text-cyan-400 hover:underline"
              >
                Repair All Armor
              </button>
            </div>
          </div>

          {/* Humanity & EMP Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                HUMANITY & EMP
              </span>
              <span className="text-xs font-bold text-purple-300">
                EMP: {hudState.empCurrent}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-neutral-300">{hudState.humanityCurrent} / {hudState.humanityMax} HL</span>
                <span className="text-neutral-500">{Math.round((hudState.humanityCurrent / hudState.humanityMax) * 100)}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden border border-neutral-700">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, (hudState.humanityCurrent / hudState.humanityMax) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => updateHumanity(-5)}
                className="flex-1 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded text-xs font-bold"
              >
                -5 HL
              </button>
              <button
                onClick={() => updateHumanity(5)}
                className="flex-1 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded text-xs font-bold"
              >
                +5 Therapy
              </button>
            </div>
          </div>

          {/* Rep, Heat & Cash Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-yellow-400" />
                STREET CRED & HEAT
              </span>
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {hudState.cash}eb
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/80 border border-neutral-800 p-2 rounded text-center">
                <span className="text-[10px] text-neutral-400 block uppercase">STREET CRED</span>
                <span className="text-lg font-black text-yellow-400">LVL {hudState.streetCred}</span>
                <div className="flex justify-center gap-1 mt-1">
                  <button
                    onClick={() => setHudState(p => ({ ...p, streetCred: Math.max(1, p.streetCred - 1) }))}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setHudState(p => ({ ...p, streetCred: Math.min(5, p.streetCred + 1) }))}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-black/80 border border-neutral-800 p-2 rounded text-center">
                <span className="text-[10px] text-neutral-400 block uppercase">HEAT LEVEL</span>
                <span className={`text-lg font-black ${hudState.heat >= 3 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                  LVL {hudState.heat}
                </span>
                <div className="flex justify-center gap-1 mt-1">
                  <button
                    onClick={() => setHudState(p => ({ ...p, heat: Math.max(1, p.heat - 1) }))}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setHudState(p => ({ ...p, heat: Math.min(5, p.heat + 1) }))}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary STATs Matrix */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h2 className="text-base font-bold text-yellow-400 uppercase flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            PRIMARY CHARACTER STATISTICS (STATs)
          </h2>
          <button
            onClick={() => setIsEditingStats(!isEditingStats)}
            className="text-xs px-3 py-1 bg-neutral-900 border border-neutral-700 hover:border-cyan-400 text-cyan-300 rounded"
          >
            {isEditingStats ? 'Save STATs' : 'Edit STATs'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(Object.keys(hudState.stats) as Array<keyof typeof hudState.stats>).map(statKey => (
            <div key={statKey} className="bg-neutral-900/80 border border-neutral-800 p-3 rounded text-center space-y-1">
              <span className="text-xs font-bold text-neutral-400 block">{statKey}</span>
              {isEditingStats ? (
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={hudState.stats[statKey]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setHudState(p => ({
                      ...p,
                      stats: { ...p.stats, [statKey]: val }
                    }));
                  }}
                  className="w-16 mx-auto bg-black border border-cyan-500 rounded text-center text-yellow-400 font-bold text-lg"
                />
              ) : (
                <span className="text-2xl font-black text-yellow-400">{hudState.stats[statKey]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Effects & Critical Injuries Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Status Effects */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            ACTIVE STATUS EFFECTS
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newEffect}
              onChange={(e) => setNewEffect(e.target.value)}
              placeholder="Add effect (e.g. Speedware Active, Blinded)..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-200"
            />
            <button
              onClick={addStatusEffect}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {hudState.activeStatusEffects.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No active status effects.</p>
            ) : (
              hudState.activeStatusEffects.map((eff, idx) => (
                <div key={idx} className="flex items-center justify-between bg-neutral-900 p-2.5 rounded border border-neutral-800">
                  <span className="text-xs text-cyan-300 font-bold">{eff}</span>
                  <button
                    onClick={() => removeStatusEffect(idx)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Critical Injuries */}
        <div className="bg-neutral-950 border border-red-950/60 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            CRITICAL INJURIES (TRAUMA)
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newInjury}
              onChange={(e) => setNewInjury(e.target.value)}
              placeholder="Add injury (e.g. Broken Ribs -2 checks)..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-200"
            />
            <button
              onClick={addCriticalInjury}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-black font-bold text-xs rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {hudState.criticalInjuries.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No critical injuries logged.</p>
            ) : (
              hudState.criticalInjuries.map((inj, idx) => (
                <div key={idx} className="flex items-center justify-between bg-red-950/40 p-2.5 rounded border border-red-800/60">
                  <span className="text-xs text-red-300 font-bold">{inj}</span>
                  <button
                    onClick={() => removeCriticalInjury(idx)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Management System */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
              <Package className="w-4 h-4 text-yellow-400" />
              INVENTORY & TACTICAL GEAR ({hudState.inventory?.length || 0} ITEMS)
            </h3>
            <span className="text-[11px] text-neutral-500 font-mono">
              ENCUMBRANCE: NORMAL
            </span>
          </div>

          {/* Feedback Toast */}
          {inventoryFeedback && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded text-xs font-bold text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <Activity className="w-4 h-4 text-emerald-400" />
              {inventoryFeedback}
            </div>
          )}

          {/* Add Item Field */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem(newItemName);
              }}
              placeholder="Add item, weapon, stim, or loot..."
              className="flex-1 bg-neutral-900 border border-neutral-700 focus:border-yellow-400 rounded px-3 py-2 text-xs text-neutral-200"
            />
            <button
              onClick={() => addItem(newItemName)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              ADD ITEM
            </button>
          </div>

          {/* Quick-add buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-neutral-500 font-bold">QUICK PROVISION:</span>
            {[
              'Trauma Team Hypo (Heals 5 HP)',
              'Speedheal Inhaler',
              'Assault Rifle Ammo (x30)',
              'Heavy Pistol Ammo (x20)',
              'EMP Grenade (DV 13)',
              'Mono-Katana (4d6 Melee)'
            ].map((preset, i) => (
              <button
                key={i}
                onClick={() => addItem(preset)}
                className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-yellow-300/80 hover:text-yellow-200 border border-neutral-800 rounded px-2 py-0.5 transition"
              >
                + {preset.split('(')[0].trim()}
              </button>
            ))}
          </div>

          {/* Inventory Items List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(hudState.inventory || []).length === 0 ? (
              <div className="p-4 text-center border border-dashed border-neutral-800 rounded">
                <p className="text-xs text-neutral-500 italic">Inventory empty. Add starting gear or scavenge Night City.</p>
              </div>
            ) : (
              (hudState.inventory || []).map((item, idx) => {
                const lower = item.toLowerCase();
                const isMed = lower.includes('hypo') || lower.includes('speedheal') || lower.includes('medkit') || lower.includes('stim') || lower.includes('patch') || lower.includes('heal');
                const isWeapon = lower.includes('rifle') || lower.includes('pistol') || lower.includes('blade') || lower.includes('katana') || lower.includes('shotgun') || lower.includes('smg') || lower.includes('knife') || lower.includes('grenade');
                const isArmor = lower.includes('armor') || lower.includes('vest') || lower.includes('helmet') || lower.includes('kevlar');
                const isCyber = lower.includes('cyberware') || lower.includes('link') || lower.includes('implant') || lower.includes('port');

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-neutral-900 p-2.5 rounded border border-neutral-800 hover:border-neutral-700 transition gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          isMed
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                            : isWeapon
                            ? 'bg-yellow-950/80 text-yellow-400 border-yellow-700/60'
                            : isArmor
                            ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60'
                            : isCyber
                            ? 'bg-purple-950/80 text-purple-400 border-purple-700/60'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {isMed ? 'MED/STIM' : isWeapon ? 'WEAPON' : isArmor ? 'ARMOR' : isCyber ? 'CHROME' : 'GEAR'}
                      </span>
                      <span className="text-xs text-neutral-200 font-bold truncate">
                        {item}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isMed && (
                        <button
                          onClick={() => useItem(item, idx)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] rounded transition flex items-center gap-1 shadow-sm"
                          title="Consume item to heal HP or recover"
                        >
                          <Heart className="w-3 h-3" />
                          USE
                        </button>
                      )}

                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition"
                        title="Drop item from inventory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
