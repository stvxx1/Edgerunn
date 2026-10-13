import React, { useState } from 'react';
import { Zap, Cpu, Shield, AlertOctagon, Terminal, Play, Lock } from 'lucide-react';
import { HUDState, QuickhackDef } from '../types';
import { QUICKHACKS_LIBRARY } from '../data/ruleset';

interface QuickhackSuiteProps {
  hudState: HUDState;
  setHudState: React.Dispatch<React.SetStateAction<HUDState>>;
  onSendToGM: (prompt: string) => void;
}

export const QuickhackSuite: React.FC<QuickhackSuiteProps> = ({ hudState, setHudState, onSendToGM }) => {
  const [selectedQuickhack, setSelectedQuickhack] = useState<QuickhackDef>(QUICKHACKS_LIBRARY[0]);
  const [targetWill, setTargetWill] = useState(6);
  const [deckMod, setDeckMod] = useState(1);
  const [lastQHResult, setLastQHResult] = useState<any>(null);

  // Netrunner Interface Action Pool calculation
  const getInterfaceActionPool = (rank: number) => {
    if (rank >= 7) return 4;
    if (rank >= 4) return 3;
    return 2;
  };

  const actionPool = getInterfaceActionPool(hudState.roleRank);

  const executeQuickhack = async () => {
    try {
      const res = await fetch('/api/quickhack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickhackId: selectedQuickhack.id,
          interfaceRank: hudState.roleRank,
          deckMod,
          targetWill
        })
      });
      const data = await res.json();
      setLastQHResult(data);
    } catch (err) {
      console.error('Quickhack execution error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-mono text-sm">
      {/* Header */}
      <div className="bg-neutral-950 border border-purple-500/40 p-5 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
        <div>
          <h1 className="text-xl font-bold text-cyan-300 uppercase flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            MEAT-SPACE QUICKHACK & DUAL-MODE NETRUNNING SUITE
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Line-of-sight tactical hacking within 15 meters vs Enemy Cyberware and Neural Links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-neutral-900 border border-purple-500/50 rounded text-xs text-purple-300 font-bold">
            INTERFACE ACTION POOL: <span className="text-yellow-400 font-black">{actionPool} ACTIONS / TURN</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quickhack Library Picker */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-bold text-yellow-400 uppercase border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            1. TACTICAL QUICKHACK LIBRARY
          </h2>

          <div className="space-y-2">
            {QUICKHACKS_LIBRARY.map(qh => (
              <button
                key={qh.id}
                onClick={() => setSelectedQuickhack(qh)}
                className={`w-full text-left p-3 rounded border transition ${
                  selectedQuickhack.id === qh.id
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-xs">
                  <span className="text-yellow-400">{qh.name}</span>
                  <span className="text-[10px] text-neutral-500">{qh.dv}</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">{qh.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Execution & Target Parameters */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-5">
          <h2 className="text-sm font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            2. QUICKHACK TARGET PARAMETERS
          </h2>

          <div className="p-3 bg-neutral-900 border border-cyan-500/30 rounded space-y-2">
            <span className="text-xs font-bold text-yellow-400 block">{selectedQuickhack.name}</span>
            <p className="text-xs text-neutral-300"><span className="text-neutral-500">Target Hardware:</span> {selectedQuickhack.targetType}</p>
            <p className="text-xs text-cyan-300 font-bold"><span className="text-neutral-500">Tactical Effect:</span> {selectedQuickhack.effect}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-1">TARGET WILL STAT (DV = WILL + 10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={targetWill}
                onChange={(e) => setTargetWill(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-yellow-400 font-bold"
              />
              <span className="text-[10px] text-neutral-500">Calculated DV: <strong className="text-cyan-400">{targetWill + 10}</strong></span>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-1">CYBERDECK HARDWARE MODIFIER</label>
              <input
                type="number"
                value={deckMod}
                onChange={(e) => setDeckMod(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-yellow-400 font-bold"
              />
            </div>
          </div>

          <button
            onClick={executeQuickhack}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded transition shadow-[0_0_12px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 uppercase"
          >
            <Play className="w-4 h-4 fill-black" />
            TRANSMIT QUICKHACK PAYLOAD
          </button>

          {lastQHResult && (
            <div className={`p-3 rounded border text-xs space-y-2 ${
              lastQHResult.success ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' : 'bg-red-950/60 border-red-500 text-red-200'
            }`}>
              <div className="flex justify-between font-bold">
                <span>STATUS: {lastQHResult.success ? 'PAYLOAD UPLOADED! ⚡' : 'ICE BLOCKED! 🛡️'}</span>
                <span>Margin: {lastQHResult.margin}</span>
              </div>
              <p className="text-[11px] font-mono">
                1d10({lastQHResult.d10Rolls.join(', ')}) + Interface({hudState.roleRank}) + DeckMod({deckMod}) = <strong className="text-yellow-300">{lastQHResult.checkTotal}</strong> vs Target DV {lastQHResult.targetDV}
              </p>

              <button
                onClick={() => {
                  const prompt = `[Quickhack Execution]: I upload ${selectedQuickhack.name} payload to the target! Check total ${lastQHResult.checkTotal} vs DV ${lastQHResult.targetDV} -> ${
                    lastQHResult.success ? `SUCCESS! Apply effect: ${selectedQuickhack.effect}` : 'FAILED! ICE defended target.'
                  }`;
                  onSendToGM(prompt);
                }}
                className="w-full mt-2 py-1 bg-black/80 hover:bg-black text-cyan-300 border border-cyan-500/50 rounded text-[10px] font-bold"
              >
                Send Quickhack Outcome to AI Game Master
              </button>
            </div>
          )}
        </div>

        {/* Architecture Diving Simulator */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-bold text-purple-400 uppercase border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            3. AIR-GAPPED ARCHITECTURE NODE EXPLORER
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded space-y-2">
              <div className="flex items-center justify-between text-yellow-400 font-bold">
                <span>FLOOR 1: ACCESS POINT</span>
                <span className="text-[10px] text-emerald-400">PASSED</span>
              </div>
              <p className="text-[11px] text-neutral-400">Physical jack-in node connected to local security grid.</p>
            </div>

            <div className="p-3 bg-neutral-900 border border-purple-500/40 rounded space-y-2">
              <div className="flex items-center justify-between text-purple-300 font-bold">
                <span>FLOOR 2: BLACK ICE CONSTRUCT</span>
                <span className="text-[10px] text-yellow-400 font-bold">ACTIVE ICE</span>
              </div>
              <p className="text-[11px] text-neutral-400">Hellhound Black ICE program detected. DV 15 Pathfinder required.</p>
              <button
                onClick={() => onSendToGM("I deploy my Anti-Program ICE-Pick and attempt to bypass Floor 2 Black ICE!")}
                className="w-full py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 rounded text-[10px] font-bold"
              >
                Attack ICE in GM Chat
              </button>
            </div>

            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded space-y-2 opacity-60">
              <div className="flex items-center justify-between text-neutral-400 font-bold">
                <span>FLOOR 3: MASTER CONTROL NODE</span>
                <span className="text-[10px] text-neutral-500">LOCKED</span>
              </div>
              <p className="text-[11px] text-neutral-500">Subsystem server containing facility door locks & camera logs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
