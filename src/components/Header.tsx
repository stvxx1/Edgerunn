import React from 'react';
import { Terminal, Shield, Crosshair, Zap, MapPin, Cpu, Save, RotateCcw, Users } from 'lucide-react';
import { HUDState } from '../types';

interface HeaderProps {
  activeTab: 'chat' | 'hud' | 'factions' | 'combat' | 'quickhack' | 'gigs' | 'saves';
  setActiveTab: (tab: 'chat' | 'hud' | 'factions' | 'combat' | 'quickhack' | 'gigs' | 'saves') => void;
  hudState: HUDState;
  onResetGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, hudState, onResetGame }) => {
  return (
    <header className="border-b border-cyan-500/30 bg-black/90 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-cyan-950/40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="w-10 h-10 rounded bg-cyan-500/10 border border-cyan-400 flex items-center justify-center text-cyan-400 font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-yellow-400 uppercase font-mono">
                EDGERUNNERS ENHANCED
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-red-600/30 text-red-400 border border-red-500/50">
                CP-RED v2045
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              Night City GM Engine & Tactical Suite
            </p>
          </div>
        </div>

        {/* HUD Snapshot Pills */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
          <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
            <span className="text-neutral-500 mr-1">RUNNER:</span>
            <span className="text-cyan-400 font-bold">{hudState.name}</span> ({hudState.role})
          </div>
          <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700">
            <span className="text-neutral-500 mr-1">HP:</span>
            <span className={hudState.hpCurrent <= hudState.hpMax * 0.5 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {hudState.hpCurrent}/{hudState.hpMax}
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700">
            <span className="text-neutral-500 mr-1">SP:</span>
            <span className="text-cyan-300">H:{hudState.spHeadCurrent}</span> | <span className="text-cyan-300">B:{hudState.spBodyCurrent}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700">
            <span className="text-neutral-500 mr-1">HEAT:</span>
            <span className={hudState.heat >= 3 ? 'text-red-400 font-bold animate-pulse' : 'text-yellow-400'}>
              Lvl {hudState.heat}
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-yellow-400">
            <span>{hudState.cash}eb</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 font-mono text-xs w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button 
            onClick={onResetGame}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-950/50 border border-red-600/60 text-red-300 hover:bg-red-700 hover:text-white transition-all font-mono text-[11px] font-bold tracking-tight shadow-[0_0_8px_rgba(220,38,38,0.4)] whitespace-nowrap uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Initiate New Run
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap border ${
              activeTab === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)] font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            GM Engine
          </button>

          <button
            onClick={() => setActiveTab('hud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap border ${
              activeTab === 'hud'
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400 shadow-[0_0_10px_rgba(252,238,10,0.3)] font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            HUD & Lifepath
          </button>

          <button
            onClick={() => setActiveTab('factions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap border ${
              activeTab === 'factions'
                ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)] font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Factions & Contacts
          </button>

          <button
            onClick={() => setActiveTab('combat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap border ${
              activeTab === 'combat'
                ? 'bg-red-500/20 text-red-300 border-red-500 shadow-[0_0_10px_rgba(255,0,85,0.3)] font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            Combat Engine
          </button>

          <button
            onClick={() => setActiveTab('quickhack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap border ${
              activeTab === 'quickhack'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)] font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Quickhacks
          </button>

          <button
            onClick={() => setActiveTab('gigs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap border ${
              activeTab === 'gigs'
                ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)] font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Mission Board
          </button>

          <button
            onClick={() => setActiveTab('saves')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap border ${
              activeTab === 'saves'
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400 shadow-[0_0_10px_rgba(252,238,10,0.3)] font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Save Manager
          </button>
        </nav>
      </div>
    </header>
  );
};
