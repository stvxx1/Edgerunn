import React, { useState } from 'react';
import { Crosshair, Minus, Plus } from 'lucide-react';
import { HUDState } from '../types';
import { SKILL_LIST, SkillDef, getSkills } from '../data/skills';

interface SkillSheetProps {
  hudState: HUDState;
  setHudState: React.Dispatch<React.SetStateAction<HUDState>>;
}

const CATEGORIES: SkillDef['category'][] = ['Ranged', 'Fighting', 'Awareness', 'Body', 'Social', 'Technique', 'Education', 'Control', 'Performance', 'Role'];

export const SkillSheet: React.FC<SkillSheetProps> = ({ hudState, setHudState }) => {
  const [showAll, setShowAll] = useState(false);
  const skills = getSkills(hudState);

  const setRank = (name: string, delta: number) => {
    setHudState(prev => {
      const current = getSkills(prev);
      const rank = Math.max(0, Math.min(10, (current[name] || 0) + delta));
      return { ...prev, skills: { ...current, [name]: rank } };
    });
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h2 className="text-base font-bold text-yellow-400 uppercase flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-cyan-400" />
          SKILLS (BASE = STAT + RANK)
        </h2>
        <button
          onClick={() => setShowAll(v => !v)}
          className="text-xs px-3 py-1 bg-neutral-900 border border-neutral-700 hover:border-cyan-400 text-cyan-300 rounded"
        >
          {showAll ? 'Trained only' : 'Show all skills'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map(category => {
          const rows = SKILL_LIST.filter(s => s.category === category && (showAll || (skills[s.name] || 0) > 0));
          if (rows.length === 0) return null;
          return (
            <div key={category} className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{category}</span>
              {rows.map(s => {
                const rank = skills[s.name] || 0;
                const base = rank + (hudState.stats[s.stat] || 0);
                return (
                  <div key={s.name} className="flex items-center gap-2 bg-neutral-900/70 border border-neutral-800 rounded px-2 py-1 text-xs">
                    <span className={`flex-1 truncate ${rank > 0 ? 'text-neutral-200' : 'text-neutral-600'}`}>{s.name}</span>
                    <span className="text-[10px] text-neutral-500">{s.stat}</span>
                    <button aria-label={`Lower ${s.name}`} onClick={() => setRank(s.name, -1)} className="p-0.5 text-neutral-500 hover:text-red-400"><Minus className="w-3 h-3" /></button>
                    <span className="w-4 text-center font-bold text-yellow-400">{rank}</span>
                    <button aria-label={`Raise ${s.name}`} onClick={() => setRank(s.name, 1)} className="p-0.5 text-neutral-500 hover:text-cyan-400"><Plus className="w-3 h-3" /></button>
                    <span className="w-7 text-right font-bold text-cyan-300" title="Base = STAT + rank">{base}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
