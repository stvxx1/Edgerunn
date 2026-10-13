import React, { useState } from 'react';
import { Users, ShieldAlert, Award, PhoneCall, Plus, Trash2, Edit2, Check, AlertCircle, HeartHandshake, Skull, Lock, Unlock } from 'lucide-react';
import { FactionReputation, HUDState, NPCContact } from '../types';

interface FactionAndNPCLogProps {
  hudState: HUDState;
  onUpdateHUD: (updater: (prev: HUDState) => HUDState) => void;
  onSendToGM?: (text: string) => void;
}

export const FactionAndNPCLog: React.FC<FactionAndNPCLogProps> = ({ hudState, onUpdateHUD, onSendToGM }) => {
  const factions = hudState.factions || [];
  const contacts = hudState.contacts || [];

  const [activeSubTab, setActiveSubTab] = useState<'factions' | 'contacts'>('factions');

  // New Contact Modal State
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<NPCContact>>({
    name: '',
    role: 'Fixer',
    faction: 'Independent',
    trustRating: 50,
    favorBalance: 0,
    lastSeenLocation: 'Watson',
    notes: '',
    status: 'Active'
  });

  const handleAdjustStanding = (factionId: string, delta: number) => {
    onUpdateHUD(prev => {
      const currentFactions = prev.factions || [];
      const updated = currentFactions.map(f => {
        if (f.id === factionId) {
          const newStanding = Math.max(-100, Math.min(100, f.standing + delta));
          let tier: FactionReputation['tier'] = 'Neutral';
          if (newStanding <= -50) tier = 'Hostile';
          else if (newStanding < 0) tier = 'Unfriendly';
          else if (newStanding >= 50) tier = 'Allied';
          else if (newStanding > 10) tier = 'Friendly';

          return {
            ...f,
            standing: newStanding,
            tier,
            bounty: newStanding <= -30 ? Math.abs(newStanding) * 150 : 0
          };
        }
        return f;
      });
      return { ...prev, factions: updated };
    });
  };

  const handleCallFavor = (contact: NPCContact) => {
    const actionText = `[NIGHT CITY COMMS] Calling contact ${contact.name} (${contact.role} - ${contact.faction}) to request emergency support/favor. Trust Rating: ${contact.trustRating}%, Favor Balance: ${contact.favorBalance}.`;
    if (onSendToGM) {
      onSendToGM(actionText);
    }
    // Deduct favor balance
    onUpdateHUD(prev => {
      const updatedContacts = (prev.contacts || []).map(c => {
        if (c.id === contact.id) {
          return { ...c, favorBalance: c.favorBalance - 1 };
        }
        return c;
      });
      return { ...prev, contacts: updatedContacts };
    });
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name) return;

    const created: NPCContact = {
      id: `c_${Date.now()}`,
      name: newContact.name,
      role: newContact.role || 'Fixer',
      faction: newContact.faction || 'Independent',
      trustRating: Number(newContact.trustRating) || 50,
      favorBalance: Number(newContact.favorBalance) || 0,
      lastSeenLocation: newContact.lastSeenLocation || 'Night City',
      notes: newContact.notes || '',
      status: 'Active'
    };

    onUpdateHUD(prev => ({
      ...prev,
      contacts: [...(prev.contacts || []), created]
    }));

    setShowAddContact(false);
    setNewContact({
      name: '',
      role: 'Fixer',
      faction: 'Independent',
      trustRating: 50,
      favorBalance: 0,
      lastSeenLocation: 'Watson',
      notes: '',
      status: 'Active'
    });
  };

  const handleDeleteContact = (id: string) => {
    onUpdateHUD(prev => ({
      ...prev,
      contacts: (prev.contacts || []).filter(c => c.id !== id)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/90 border border-purple-500/30 rounded-lg p-5 shadow-lg shadow-purple-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold font-mono text-purple-300 uppercase tracking-wide">
              Faction Reputation & Contact Network
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Night City Faction Standings, Black Market Clearance & Persistent NPC Contact Log
          </p>
        </div>

        {/* Subtab Toggle */}
        <div className="flex items-center gap-2 bg-black/60 p-1 rounded border border-neutral-800">
          <button
            onClick={() => setActiveSubTab('factions')}
            className={`px-4 py-1.5 rounded font-mono text-xs font-bold transition-all ${
              activeSubTab === 'factions'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Factions ({factions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('contacts')}
            className={`px-4 py-1.5 rounded font-mono text-xs font-bold transition-all ${
              activeSubTab === 'contacts'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Contacts ({contacts.length})
          </button>
        </div>
      </div>

      {/* FACTIONS TAB */}
      {activeSubTab === 'factions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factions.map(faction => {
              const standingPercent = Math.min(100, Math.max(0, (faction.standing + 100) / 2));
              let statusColor = 'text-neutral-400 border-neutral-700 bg-neutral-900/50';
              let progressColor = 'bg-neutral-500';

              if (faction.tier === 'Hostile') {
                statusColor = 'text-red-400 border-red-500/50 bg-red-950/20';
                progressColor = 'bg-red-600';
              } else if (faction.tier === 'Unfriendly') {
                statusColor = 'text-amber-400 border-amber-500/50 bg-amber-950/20';
                progressColor = 'bg-amber-500';
              } else if (faction.tier === 'Friendly') {
                statusColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-950/20';
                progressColor = 'bg-emerald-500';
              } else if (faction.tier === 'Allied') {
                statusColor = 'text-cyan-400 border-cyan-500/50 bg-cyan-950/20';
                progressColor = 'bg-cyan-400';
              }

              return (
                <div key={faction.id} className={`p-4 rounded-lg border ${statusColor} space-y-3 relative overflow-hidden`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base font-mono text-neutral-100">{faction.name}</h3>
                        <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                          faction.tier === 'Hostile' ? 'bg-red-900/60 text-red-300 border-red-500' :
                          faction.tier === 'Allied' ? 'bg-cyan-900/60 text-cyan-300 border-cyan-500' :
                          'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}>
                          {faction.tier}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono mt-1">{faction.description}</p>
                    </div>

                    {faction.bounty > 0 && (
                      <div className="flex items-center gap-1 bg-red-950 border border-red-600 text-red-400 px-2 py-1 rounded text-xs font-mono font-bold animate-pulse">
                        <Skull className="w-3.5 h-3.5" />
                        <span>Bounty: {faction.bounty}eb</span>
                      </div>
                    )}
                  </div>

                  {/* Standing Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-400">Reputation Score:</span>
                      <span className={faction.standing < 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {faction.standing > 0 ? `+${faction.standing}` : faction.standing} / 100
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 relative">
                      <div className={`h-full ${progressColor} transition-all duration-300`} style={{ width: `${standingPercent}%` }} />
                    </div>
                  </div>

                  {/* Black Market Perk / Threat Indicator */}
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      {faction.standing >= 20 ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Elite Fixers & Black Market Unlocked</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="text-neutral-500">Requires +20 Standing for Black Market</span>
                        </>
                      )}
                    </div>

                    {/* Manual GM Adjustment buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustStanding(faction.id, -10)}
                        className="px-2 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/50 hover:bg-red-800 text-[11px] font-mono font-bold"
                        title="Reduce Standing by 10"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleAdjustStanding(faction.id, 10)}
                        className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800 text-[11px] font-mono font-bold"
                        title="Increase Standing by 10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTACTS TAB */}
      {activeSubTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono text-purple-300 font-bold uppercase tracking-wider">
              Night City Living Contacts ({contacts.length})
            </h3>
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)]"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map(contact => (
              <div key={contact.id} className="bg-neutral-900/80 border border-purple-500/30 rounded-lg p-4 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold font-mono text-base text-purple-200">{contact.name}</h4>
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                        {contact.role}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-neutral-400 mt-0.5">
                      Faction: <span className="text-neutral-200">{contact.faction}</span> | Loc: <span className="text-neutral-300">{contact.lastSeenLocation}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/50 transition-all"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Trust Rating & Favor Balance */}
                <div className="grid grid-cols-2 gap-3 bg-black/50 p-2.5 rounded border border-neutral-800 text-xs font-mono">
                  <div>
                    <span className="text-neutral-400">Trust Rating:</span>
                    <div className="text-cyan-400 font-bold text-sm">{contact.trustRating}%</div>
                  </div>
                  <div>
                    <span className="text-neutral-400">Favor Balance:</span>
                    <div className={`font-bold text-sm ${contact.favorBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {contact.favorBalance > 0 ? `+${contact.favorBalance} (Owes You)` : contact.favorBalance === 0 ? 'Balanced' : `${contact.favorBalance} (You Owe)`}
                    </div>
                  </div>
                </div>

                <p className="text-xs font-mono text-neutral-300 bg-neutral-950/60 p-2 rounded border border-neutral-800/80">
                  {contact.notes || 'No active notes.'}
                </p>

                {/* Call Favor Action Button */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleCallFavor(contact)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-700 hover:text-white text-xs font-mono font-bold transition-all shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Call In Favor / Request Backup
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ADD CONTACT MODAL */}
          {showAddContact && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-purple-500/50 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
                <h3 className="text-lg font-bold font-mono text-purple-300 uppercase">Register New Contact</h3>
                
                <form onSubmit={handleAddContactSubmit} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={newContact.name}
                      onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
                      placeholder="e.g. Dex DeShawn"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Role</label>
                      <input
                        type="text"
                        value={newContact.role}
                        onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))}
                        className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
                        placeholder="Fixer / Ripperdoc / Solo"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Faction</label>
                      <input
                        type="text"
                        value={newContact.faction}
                        onChange={e => setNewContact(p => ({ ...p, faction: e.target.value }))}
                        className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
                        placeholder="Afterlife / Independent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Trust Rating (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newContact.trustRating}
                        onChange={e => setNewContact(p => ({ ...p, trustRating: Number(e.target.value) }))}
                        className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Favor Balance</label>
                      <input
                        type="number"
                        value={newContact.favorBalance}
                        onChange={e => setNewContact(p => ({ ...p, favorBalance: Number(e.target.value) }))}
                        className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Last Seen Location</label>
                    <input
                      type="text"
                      value={newContact.lastSeenLocation}
                      onChange={e => setNewContact(p => ({ ...p, lastSeenLocation: e.target.value }))}
                      className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
                      placeholder="Afterlife Club / Japantown"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Notes & Details</label>
                    <textarea
                      rows={2}
                      value={newContact.notes}
                      onChange={e => setNewContact(p => ({ ...p, notes: e.target.value }))}
                      className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
                      placeholder="Known favors, past deals, or debts..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-4 py-2 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-purple-600 text-white font-bold hover:bg-purple-500"
                    >
                      Save Contact
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
