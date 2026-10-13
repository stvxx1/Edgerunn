import React, { useState } from 'react';
import { User, Dices, ShoppingBag, Shield, CheckCircle, Sparkles, Cpu } from 'lucide-react';
import { HUDState, CharacterStats, LifepathDetails } from '../types';
import { CYBERWARE_SHOP, GEAR_SHOP, LIFEPATH_TABLES, PREMADE_TEMPLATES } from '../data/ruleset';

interface CharacterBuilderProps {
  hudState: HUDState;
  setHudState: React.Dispatch<React.SetStateAction<HUDState>>;
  onComplete: () => void;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ hudState, setHudState, onComplete }) => {
  const [mode, setMode] = useState<'template' | 'custom'>('template');

  // Custom Character Creation State
  const [charName, setCharName] = useState('V');
  const [charRole, setCharRole] = useState('Solo');
  const [charRank, setCharRank] = useState(4);
  const [stats, setStats] = useState<CharacterStats>({
    INT: 6, REF: 7, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 6, MOVE: 6, BODY: 7, EMP: 6
  });

  const [lifepath, setLifepath] = useState<LifepathDetails>({
    culturalOrigin: LIFEPATH_TABLES.culturalOrigins[0].origin,
    primaryLanguage: LIFEPATH_TABLES.culturalOrigins[0].lang,
    visualStyle: LIFEPATH_TABLES.culturalOrigins[0].style,
    familyBackground: LIFEPATH_TABLES.familyBackgrounds[0],
    primaryMotivator: LIFEPATH_TABLES.motivators[0],
    personality: LIFEPATH_TABLES.personalities[0],
    valuedPerson: 'Former squad commander',
    valuedPossession: 'Engraved Heavy Pistol',
    lifeGoals: 'Become an Afterlife Legend',
    tragicPast: LIFEPATH_TABLES.tragicPasts[0]
  });

  const [selectedCyberware, setSelectedCyberware] = useState<string[]>(['subdermal_armor']);
  const [selectedGear, setSelectedGear] = useState<string[]>(['ronin_ar', 'heavy_pistol', 'kevlar_armor']);
  const [customDescription, setCustomDescription] = useState(
    'Combat-hardened solo with polished chrome cybereyes, high-collar ballistic trench coat, tactical holster harness, and neural reflex boosters humming under the neckline.'
  );

  const totalStatPoints = (Object.values(stats) as number[]).reduce((a: number, b: number) => a + b, 0);

  // Load Premade Template
  const loadTemplate = (template: typeof PREMADE_TEMPLATES[0]) => {
    const maxHP = 10 + (5 * Math.round((template.stats.BODY + template.stats.WILL) / 2));
    const maxHum = template.stats.EMP * 10;

    const initialInventory = [
      ...template.weapons,
      ...template.cyberware.map(c => `Cyberware: ${c}`),
      'Trauma Team Hypo (Heals 5 HP)',
      'Speedheal Inhaler',
      'Agent Pocket Comms'
    ];

    setHudState({
      name: template.name,
      role: template.role,
      roleRank: template.roleRank,
      hpCurrent: maxHP,
      hpMax: maxHP,
      woundState: 'Light',
      spHeadCurrent: template.headSP,
      spHeadMax: template.headSP,
      spBodyCurrent: template.bodySP,
      spBodyMax: template.bodySP,
      humanityCurrent: maxHum,
      humanityMax: maxHum,
      empCurrent: template.stats.EMP,
      streetCred: template.streetCred,
      heat: template.heat,
      cash: template.cash,
      activeStatusEffects: [],
      criticalInjuries: [],
      stats: template.stats,
      inventory: initialInventory,
      customDescription: template.lifepathSummary
    });

    onComplete();
  };

  // Roll Random Lifepath Entry
  const rollLifepath = () => {
    const origIndex = Math.floor(Math.random() * LIFEPATH_TABLES.culturalOrigins.length);
    const famIndex = Math.floor(Math.random() * LIFEPATH_TABLES.familyBackgrounds.length);
    const motIndex = Math.floor(Math.random() * LIFEPATH_TABLES.motivators.length);
    const persIndex = Math.floor(Math.random() * LIFEPATH_TABLES.personalities.length);
    const tragIndex = Math.floor(Math.random() * LIFEPATH_TABLES.tragicPasts.length);

    setLifepath({
      culturalOrigin: LIFEPATH_TABLES.culturalOrigins[origIndex].origin,
      primaryLanguage: LIFEPATH_TABLES.culturalOrigins[origIndex].lang,
      visualStyle: LIFEPATH_TABLES.culturalOrigins[origIndex].style,
      familyBackground: LIFEPATH_TABLES.familyBackgrounds[famIndex],
      primaryMotivator: LIFEPATH_TABLES.motivators[motIndex],
      personality: LIFEPATH_TABLES.personalities[persIndex],
      valuedPerson: 'Old street fixers and trusted partners',
      valuedPossession: 'Custom cyberdeck datachip',
      lifeGoals: 'Take down an Arasaka executive',
      tragicPast: LIFEPATH_TABLES.tragicPasts[tragIndex]
    });
  };

  // Save Custom Character
  const saveCustomCharacter = () => {
    const maxHP = 10 + (5 * Math.round((stats.BODY + stats.WILL) / 2));
    const maxHum = stats.EMP * 10;

    const gearNames = selectedGear.map(id => {
      const g = GEAR_SHOP.find(item => item.id === id);
      return g ? g.name : id;
    });
    const cyberNames = selectedCyberware.map(id => {
      const c = CYBERWARE_SHOP.find(item => item.id === id);
      return c ? `Cyberware: ${c.name}` : id;
    });

    const initialInventory = [
      ...gearNames,
      ...cyberNames,
      'Trauma Team Hypo (Heals 5 HP)',
      'Speedheal Inhaler',
      'Agent Pocket Comms'
    ];

    setHudState({
      name: charName || 'Edgerunner',
      role: charRole,
      roleRank: charRank,
      hpCurrent: maxHP,
      hpMax: maxHP,
      woundState: 'Light',
      spHeadCurrent: selectedGear.includes('heavy_armor') ? 13 : 11,
      spHeadMax: selectedGear.includes('heavy_armor') ? 13 : 11,
      spBodyCurrent: selectedCyberware.includes('subdermal_armor') ? 11 : 7,
      spBodyMax: selectedCyberware.includes('subdermal_armor') ? 11 : 7,
      humanityCurrent: maxHum,
      humanityMax: maxHum,
      empCurrent: stats.EMP,
      streetCred: 1,
      heat: 1,
      cash: 2500,
      activeStatusEffects: [],
      criticalInjuries: [],
      stats,
      inventory: initialInventory,
      customDescription: customDescription.trim() || `Street-hardened ${charRole} carving a path through the neon underbelly of Night City.`
    });

    onComplete();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-mono text-sm">
      {/* Header Mode Switcher */}
      <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-yellow-400 uppercase flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            CHARACTER CREATION & LIFEPATH SUITE
          </h1>
          <p className="text-xs text-neutral-400">
            Select a pre-made Edgerunner template or roll a 10-table Cyberpunk RED Lifepath background.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('template')}
            className={`px-4 py-2 text-xs font-bold rounded transition border ${
              mode === 'template'
                ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            OPTION A: PRE-MADE TEMPLATES
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-4 py-2 text-xs font-bold rounded transition border ${
              mode === 'custom'
                ? 'bg-yellow-500 text-black border-yellow-400 font-extrabold shadow-[0_0_10px_rgba(252,238,10,0.4)]'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            OPTION B: CUSTOM LIFEPATH
          </button>
        </div>
      </div>

      {mode === 'template' ? (
        /* OPTION A: PRE-MADE TEMPLATES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREMADE_TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              className="bg-neutral-950 border border-neutral-800 hover:border-cyan-400 rounded-lg p-5 flex flex-col justify-between transition group shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-lg font-black text-yellow-400 group-hover:text-cyan-300">
                    {tmpl.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold bg-neutral-900 text-cyan-400 border border-neutral-700">
                    {tmpl.role} (Rank {tmpl.roleRank})
                  </span>
                </div>

                <p className="text-xs text-neutral-300 italic">{tmpl.tagline}</p>

                {/* STATs Grid */}
                <div className="grid grid-cols-5 gap-1.5 py-2">
                  {Object.entries(tmpl.stats).map(([st, val]) => (
                    <div key={st} className="bg-neutral-900 p-1.5 rounded text-center border border-neutral-800">
                      <span className="text-[10px] text-neutral-500 block">{st}</span>
                      <span className="text-xs font-bold text-yellow-400">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs space-y-1 text-neutral-400">
                  <p><span className="text-neutral-500">Cyberware:</span> {tmpl.cyberware.join(', ')}</p>
                  <p><span className="text-neutral-500">Weapons:</span> {tmpl.weapons.join(', ')}</p>
                  <p><span className="text-neutral-500">Starting Cash:</span> {tmpl.cash}eb</p>
                </div>
              </div>

              <button
                onClick={() => loadTemplate(tmpl)}
                className="w-full mt-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded flex items-center justify-center gap-2 transition shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              >
                <CheckCircle className="w-4 h-4" />
                SELECT {tmpl.name.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* OPTION B: STEP-BY-STEP CUSTOM LIFEPATH GENERATOR */
        <div className="space-y-6">
          {/* Identity & STATs Allocator */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 space-y-6">
            <h2 className="text-base font-bold text-yellow-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Cpu className="w-5 h-5 text-cyan-400" />
              1. OPERATOR IDENTITY & STAT ALLOCATOR (62 POINTS TOTAL)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-neutral-400 font-bold block mb-1">OPERATOR NAME</label>
                <input
                  type="text"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-neutral-100 font-bold"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-bold block mb-1">ROLE (CLASS)</label>
                <select
                  value={charRole}
                  onChange={(e) => setCharRole(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-neutral-100 font-bold"
                >
                  {['Solo', 'Netrunner', 'Tech', 'Medtech', 'Fixer', 'Nomad', 'Rockerboy', 'Exec', 'Media', 'Lawman'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-bold block mb-1">ROLE RANK</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={charRank}
                  onChange={(e) => setCharRank(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded px-3 py-2 text-neutral-100 font-bold"
                />
              </div>
            </div>

            {/* STAT Points Allocator Grid */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-300">STAT ALLOCATION (1 to 8 per STAT)</span>
                <span className={totalStatPoints > 62 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  POINTS USED: {totalStatPoints} / 62
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(Object.keys(stats) as Array<keyof CharacterStats>).map(stKey => (
                  <div key={stKey} className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center space-y-1">
                    <span className="text-xs font-bold text-neutral-400 block">{stKey}</span>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setStats(p => ({ ...p, [stKey]: Math.max(1, p[stKey] - 1) }))}
                        className="w-6 h-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-bold"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-yellow-400">{stats[stKey]}</span>
                      <button
                        onClick={() => setStats(p => ({ ...p, [stKey]: Math.min(8, p[stKey] + 1) }))}
                        className="w-6 h-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 10-Table Cyberpunk Lifepath Generator */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                2. CYBERPUNK RED LIFEPATH BACKGROUND GENERATOR
              </h2>
              <button
                onClick={rollLifepath}
                className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 rounded font-bold text-xs flex items-center gap-1.5"
              >
                <Dices className="w-4 h-4" />
                ROLL ALL 1D10 TABLES
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold block">CULTURAL ORIGIN & STYLE</label>
                <select
                  value={lifepath.culturalOrigin}
                  onChange={(e) => {
                    const sel = LIFEPATH_TABLES.culturalOrigins.find(o => o.origin === e.target.value);
                    if (sel) {
                      setLifepath(p => ({ ...p, culturalOrigin: sel.origin, primaryLanguage: sel.lang, visualStyle: sel.style }));
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-100 font-bold"
                >
                  {LIFEPATH_TABLES.culturalOrigins.map(o => (
                    <option key={o.origin} value={o.origin}>{o.origin} ({o.lang})</option>
                  ))}
                </select>
                <p className="text-[11px] text-cyan-400 italic mt-1">{lifepath.visualStyle}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold block">FAMILY BACKGROUND</label>
                <select
                  value={lifepath.familyBackground}
                  onChange={(e) => setLifepath(p => ({ ...p, familyBackground: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-100 font-bold"
                >
                  {LIFEPATH_TABLES.familyBackgrounds.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold block">PRIMARY MOTIVATOR</label>
                <select
                  value={lifepath.primaryMotivator}
                  onChange={(e) => setLifepath(p => ({ ...p, primaryMotivator: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-100 font-bold"
                >
                  {LIFEPATH_TABLES.motivators.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold block">PERSONALITY</label>
                <select
                  value={lifepath.personality}
                  onChange={(e) => setLifepath(p => ({ ...p, personality: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-100 font-bold"
                >
                  {LIFEPATH_TABLES.personalities.map(per => (
                    <option key={per} value={per}>{per}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-neutral-400 font-bold block">TRAGIC PAST EVENT</label>
                <select
                  value={lifepath.tragicPast}
                  onChange={(e) => setLifepath(p => ({ ...p, tragicPast: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-100 font-bold"
                >
                  {LIFEPATH_TABLES.tragicPasts.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Custom Description & Appearance Box */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 space-y-4 shadow-xl">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-yellow-400 uppercase flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                3. CUSTOM CHARACTER DESCRIPTION & SIGNATURE LOOK
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Describe your operative's physical appearance, cyberware aesthetic, street fashion, scars, demeanor, or signature gear. The Game Master actively weaves this description directly into the story, dialogues, and world reactions!
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={4}
                placeholder="e.g. Tall solo with glowing amber Kiroshi cybereyes, high-collar ballistic duster over chrome armor, tattooed cyberarm with Maelstrom gang tags, smokes vintage real-tobacco cigarettes..."
                className="w-full bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded p-3 text-xs text-neutral-100 placeholder-neutral-500 font-mono resize-y"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-neutral-500 font-bold">QUICK INSPIRATIONS:</span>
                {[
                  'Polished chrome cyberarm, neon-lit combat mohawk, heavy leather jacket with punk rivets',
                  'Ex-Corpo counter-intel agent in an immaculate charcoal ballistic suit with mirror-shades',
                  'Hardened combat medic with bloodstained red trauma patches, sub-dermal armor, utility webbing',
                  'Ghost netrunner with glowing neural cables, pale skin, cyberdeck strapped to high-tech harness'
                ].map((insp, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCustomDescription(insp)}
                    className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-neutral-800 hover:border-cyan-500/50 rounded px-2.5 py-1 transition"
                  >
                    + {insp.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cyberware & Gear Shop */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 space-y-6">
            <h2 className="text-base font-bold text-yellow-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-3">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              4. STARTING CYBERWARE & GEAR SELECTION
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cyberware List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase block">CYBERWARE CHROME</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {CYBERWARE_SHOP.map(item => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition ${
                        selectedCyberware.includes(item.id)
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCyberware.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCyberware(p => [...p, item.id]);
                          else setSelectedCyberware(p => p.filter(i => i !== item.id));
                        }}
                        className="mt-0.5 accent-cyan-400"
                      />
                      <div>
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span>{item.name}</span>
                          <span className="text-yellow-400">{item.cost}eb</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gear List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-yellow-400 uppercase block">WEAPONS & GEAR</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {GEAR_SHOP.map(item => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition ${
                        selectedGear.includes(item.id)
                          ? 'bg-yellow-950/60 border-yellow-400 text-yellow-200'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGear.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedGear(p => [...p, item.id]);
                          else setSelectedGear(p => p.filter(i => i !== item.id));
                        }}
                        className="mt-0.5 accent-yellow-400"
                      />
                      <div>
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span>{item.name}</span>
                          <span className="text-yellow-400">{item.cost}eb</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={saveCustomCharacter}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm rounded shadow-[0_0_15px_rgba(252,238,10,0.4)] flex items-center justify-center gap-2 transition"
            >
              <Shield className="w-5 h-5" />
              FINALIZE CUSTOM OPERATOR & DEPLOY TO NIGHT CITY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
