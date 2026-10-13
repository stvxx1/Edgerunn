import React, { useState } from 'react';
import { 
  MapPin, 
  DollarSign, 
  ShieldAlert, 
  Send, 
  Flame, 
  RefreshCw, 
  Crosshair, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Briefcase, 
  Target, 
  Skull, 
  Zap, 
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react';
import { HUDState, MissionGig, MissionType } from '../types';
import { INITIAL_MISSION_BOARD_GIGS, generateDynamicGig, buildMissionBriefingPrompt } from '../data/missionGigs';

interface MissionBoardProps {
  hudState: HUDState;
  onSelectGig: (prompt: string) => void;
}

export const MissionBoard: React.FC<MissionBoardProps> = ({ hudState, onSelectGig }) => {
  const [gigs, setGigs] = useState<MissionGig[]>(INITIAL_MISSION_BOARD_GIGS);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');
  const [activeBriefingGig, setActiveBriefingGig] = useState<MissionGig | null>(null);

  const HEAT_LEVELS = [
    { level: 1, title: 'Local Street Punks', desc: 'Minor gang grudges in Watson or Pacifica. Basic police patrol awareness.', response: 'Low priority NCPD patrol response (DV 13 perception).' },
    { level: 2, title: 'Precinct Police Watchlist', desc: 'Your crew faces local precinct BOLO alerts. Scanners flag your vehicle.', response: 'Patrol cruisers dispatched on sight. Fixers charge +20% fees.' },
    { level: 3, title: 'Max-Tac Alert Status', desc: 'Loud violent ops triggered heavy law response. Heavy tactical SWAT team on standby.', response: 'Max-Tac tactical response team ambushes crew during downtime.' },
    { level: 4, title: 'Corporate Black-Ops Strike', desc: 'Executed corporate suits or leaked classified data. Megacorp death squads deployed.', response: 'Stealth corp assassins and armed AVs hunt crew continuously.' },
    { level: 5, title: 'Full Megacorp Hunter-Killers', desc: 'Highest danger threat level in Night City. Full spectrum AI and AV gunships.', response: 'Full corporate hunter-killer teams with cyberpsychos deployed.' }
  ];

  const handleAddNewContract = () => {
    const newGig = generateDynamicGig(hudState);
    setGigs(prev => [newGig, ...prev]);
    setActiveBriefingGig(newGig);
  };

  const handleInitiateBriefing = (gig: MissionGig) => {
    const prompt = buildMissionBriefingPrompt(gig, hudState);
    onSelectGig(prompt);
  };

  const filteredGigs = gigs.filter(gig => {
    if (selectedTypeFilter !== 'ALL' && gig.missionType !== selectedTypeFilter) return false;
    if (selectedDistrictFilter !== 'ALL' && gig.district !== selectedDistrictFilter) return false;
    return true;
  });

  const getMissionTypeColor = (type: MissionType) => {
    switch (type) {
      case 'Assassination':
        return 'bg-red-950/80 text-red-400 border-red-700/60';
      case 'Data Theft':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'Escort':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
      case 'Sabotage':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/60';
      case 'Heist':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-700/60';
      case 'Cyberpsycho Hunt':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'Extraction':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      default:
        return 'bg-neutral-900 text-neutral-300 border-neutral-700';
    }
  };

  const uniqueDistricts: string[] = Array.from(new Set(gigs.map(g => g.district)));
  const missionTypes: MissionType[] = ['Assassination', 'Data Theft', 'Escort', 'Sabotage', 'Heist', 'Cyberpsycho Hunt', 'Extraction'];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-mono text-sm">
      {/* Header Banner */}
      <div className="bg-neutral-950 border border-yellow-500/40 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-yellow-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-yellow-400" />
              NIGHT CITY FIXER MISSION BOARD
            </h1>
            <span className="px-2 py-0.5 rounded font-bold text-xs bg-yellow-950 text-yellow-300 border border-yellow-500/50">
              EDGERUNNER NETWORK
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Available mercenary contracts brokered by Rogue, Padre, Regina, Dino, and El Capitan. Payouts scale with your Street Cred (Level {hudState.streetCred} = {hudState.streetCred}x Multiplier).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNewContract}
            className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded transition flex items-center gap-2 shadow-[0_0_12px_rgba(252,238,10,0.4)]"
          >
            <RefreshCw className="w-4 h-4" />
            PULL NEW FIXER CONTRACT
          </button>
        </div>
      </div>

      {/* Filter and Status Bar */}
      <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500 font-bold flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            TYPE:
          </span>
          <button
            onClick={() => setSelectedTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
              selectedTypeFilter === 'ALL'
                ? 'bg-yellow-500 text-black border-yellow-400'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            ALL TYPES ({gigs.length})
          </button>
          {missionTypes.map(type => {
            const count = gigs.filter(g => g.missionType === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
                  selectedTypeFilter === type
                    ? 'bg-yellow-500 text-black border-yellow-400'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                {type.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            DISTRICT:
          </span>
          <select
            value={selectedDistrictFilter}
            onChange={(e) => setSelectedDistrictFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded px-3 py-1 font-bold"
          >
            <option value="ALL">ALL DISTRICTS</option>
            {uniqueDistricts.map(dist => (
              <option key={dist} value={dist}>{dist.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Mission Board + Heat Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Mission Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-2">
            <span className="font-bold text-neutral-300">
              SHOWING {filteredGigs.length} AVAILABLE GIGS
            </span>
            <span>
              PLAYER STREET CRED: <strong className="text-yellow-400 font-black">TIER {hudState.streetCred}</strong>
            </span>
          </div>

          <div className="space-y-4">
            {filteredGigs.map(gig => {
              const finalPayout = gig.basePayout * Math.max(1, hudState.streetCred);
              const isEligible = hudState.streetCred >= gig.requiredStreetCred;

              return (
                <div
                  key={gig.id}
                  className={`bg-neutral-950 border rounded-lg p-5 space-y-4 transition shadow-xl relative overflow-hidden ${
                    isEligible 
                      ? 'border-neutral-800 hover:border-yellow-500/60' 
                      : 'border-neutral-900 opacity-70'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getMissionTypeColor(gig.missionType)}`}>
                          {gig.missionType}
                        </span>
                        <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3" />
                          {gig.district}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                          DV {gig.difficultyDV}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-neutral-100 uppercase tracking-wide">
                        {gig.title}
                      </h3>
                    </div>

                    {/* Payout & Street Cred Requirement Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-yellow-400 font-mono flex items-center sm:justify-end gap-1">
                        <DollarSign className="w-4 h-4 text-yellow-400" />
                        {finalPayout.toLocaleString()}eb
                      </div>
                      <div className="text-[10px] text-neutral-400 font-bold">
                        {isEligible ? (
                          <span className="text-emerald-400 flex items-center sm:justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            ELIGIBLE (Req Cred {gig.requiredStreetCred})
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center sm:justify-end gap-1">
                            <Lock className="w-3 h-3" />
                            LOCKED (Requires Street Cred {gig.requiredStreetCred})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fixer & Target Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-900/60 p-3 rounded border border-neutral-800/80">
                    <div>
                      <span className="text-neutral-500 font-bold block text-[10px] uppercase">FIXER & DROP POINT</span>
                      <span className="text-yellow-300 font-bold">{gig.fixerName}</span>
                      <span className="text-neutral-400 block text-[11px]">{gig.fixerLocation}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-bold block text-[10px] uppercase">TARGET / OBJECTIVE</span>
                      <span className="text-red-300 font-bold">{gig.clientOrTarget}</span>
                      <span className="text-neutral-400 block text-[11px]">Key Skill: {gig.keySkill}</span>
                    </div>
                  </div>

                  {/* Briefing Summary */}
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {gig.briefingSummary}
                  </p>

                  {/* Hazards & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-800/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-neutral-500 font-bold mr-1">HAZARDS:</span>
                      {gig.hazards.map((h, i) => (
                        <span key={i} className="text-[10px] bg-red-950/40 text-red-300 border border-red-900/50 rounded px-2 py-0.5">
                          {h}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveBriefingGig(gig)}
                        className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-neutral-700 hover:border-cyan-500 rounded text-xs font-bold transition"
                      >
                        VIEW DOSSIER
                      </button>

                      <button
                        onClick={() => handleInitiateBriefing(gig)}
                        disabled={!isEligible}
                        className={`px-4 py-2 rounded text-xs font-black uppercase flex items-center gap-2 transition shadow-md ${
                          isEligible
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_12px_rgba(252,238,10,0.3)] cursor-pointer'
                            : 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isEligible ? 'ACCEPT & INITIATE BRIEFING' : `REQ CRED LVL ${gig.requiredStreetCred}`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Heat Matrix & Campaign Consequences */}
        <div className="space-y-6">
          {/* Active Heat Panel */}
          <div className="bg-neutral-950 border border-red-900/50 rounded-lg p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-red-900/40 pb-2">
              <h2 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                NIGHT CITY HEAT MATRIX
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded font-bold bg-red-950 text-red-400 border border-red-600 animate-pulse">
                LEVEL {hudState.heat}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Every megacorp contract and violent assassination ratchets up law enforcement and corporate retaliatory strikes.
            </p>

            <div className="space-y-3">
              {HEAT_LEVELS.map(h => (
                <div
                  key={h.level}
                  className={`p-3 rounded border transition ${
                    hudState.heat === h.level
                      ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_15px_rgba(255,0,85,0.4)]'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="flex justify-between items-center font-bold text-xs">
                    <span className={hudState.heat === h.level ? 'text-red-300' : 'text-neutral-300'}>
                      HEAT LEVEL {h.level}: {h.title}
                    </span>
                    {hudState.heat === h.level && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-black font-extrabold animate-pulse">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">{h.desc}</p>
                  <p className="text-[11px] text-yellow-400 font-bold mt-1">• Response: {h.response}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Runner Tips */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              CONTRACT PROTOCOLS
            </h3>
            <ul className="text-xs text-neutral-400 space-y-2 list-disc list-inside">
              <li>High-difficulty gigs (DV 17+) require solid Stat + Skill bonuses or Netrunner ICE breaching.</li>
              <li>Completing gigs increases your <strong className="text-yellow-400">Street Cred</strong>, unlocking elite corporate contracts.</li>
              <li>Every significant choice in the briefing will demand a skill check (d10 + Stat + Skill).</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Briefing Dossier Modal */}
      {activeBriefingGig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono text-xs">
          <div className="bg-neutral-950 border-2 border-yellow-500/80 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-[0_0_30px_rgba(252,238,10,0.3)] relative">
            
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="space-y-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getMissionTypeColor(activeBriefingGig.missionType)}`}>
                  {activeBriefingGig.missionType}
                </span>
                <h2 className="text-base font-black text-yellow-400 uppercase">
                  {activeBriefingGig.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveBriefingGig(null)}
                className="text-neutral-500 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-900 p-3 rounded border border-neutral-800">
                <div>
                  <span className="text-[10px] text-neutral-500 block font-bold">DISTRICT</span>
                  <span className="text-cyan-300 font-bold">{activeBriefingGig.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block font-bold">DIFFICULTY</span>
                  <span className="text-red-400 font-bold">DV {activeBriefingGig.difficultyDV}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block font-bold">EST. PAYOUT</span>
                  <span className="text-yellow-400 font-bold">
                    {(activeBriefingGig.basePayout * Math.max(1, hudState.streetCred)).toLocaleString()}eb
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block font-bold">REQ. CRED</span>
                  <span className="text-purple-300 font-bold">Level {activeBriefingGig.requiredStreetCred}</span>
                </div>
              </div>

              <div className="bg-neutral-900/60 p-4 rounded border border-neutral-800 space-y-2">
                <span className="text-xs text-neutral-400 font-bold block uppercase">
                  FIXER DISPATCH LOG — {activeBriefingGig.fixerName} ({activeBriefingGig.fixerLocation})
                </span>
                <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                  "{activeBriefingGig.briefingSummary}"
                </p>
                <p className="text-[11px] text-yellow-300/80 italic pt-1">
                  • Lore: {activeBriefingGig.loreHook}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-neutral-400 font-bold block uppercase">
                  IDENTIFIED COMBAT HAZARDS & SECURITY PROTOCOLS:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeBriefingGig.hazards.map((h, idx) => (
                    <span key={idx} className="bg-red-950/60 text-red-300 border border-red-800 rounded px-2.5 py-1 text-xs">
                      ⚠ {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setActiveBriefingGig(null)}
                className="px-4 py-2 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold"
              >
                Close Dossier
              </button>
              <button
                onClick={() => {
                  handleInitiateBriefing(activeBriefingGig);
                  setActiveBriefingGig(null);
                }}
                disabled={hudState.streetCred < activeBriefingGig.requiredStreetCred}
                className={`px-5 py-2.5 rounded font-black text-xs uppercase flex items-center gap-2 transition ${
                  hudState.streetCred >= activeBriefingGig.requiredStreetCred
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_12px_rgba(252,238,10,0.4)]'
                    : 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                Initiate Briefing in GM Engine
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
