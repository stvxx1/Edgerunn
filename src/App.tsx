import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GMChat } from './components/GMChat';
import { CharacterHUD } from './components/CharacterHUD';
import { CharacterBuilder } from './components/CharacterBuilder';
import { CombatEngine } from './components/CombatEngine';
import { QuickhackSuite } from './components/QuickhackSuite';
import { GigGenerator } from './components/GigGenerator';
import { SaveManager } from './components/SaveManager';
import { FactionAndNPCLog } from './components/FactionAndNPCLog';
import { ChatMessage, HUDState } from './types';
import { PREMADE_TEMPLATES, DEFAULT_FACTIONS, DEFAULT_CONTACTS, generateRandomStarterScenario } from './data/ruleset';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { useSceneImages } from './utils/useSceneImages';
import { resetCampaignMemory } from './utils/promptBuilder';
import { buildDefaultSkills } from './data/skills';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'hud' | 'combat' | 'quickhack' | 'gigs' | 'saves'>('chat');
  const [isBuildingLifepath, setIsBuildingLifepath] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Initial Character State (Default Valkyrie template)
  const defaultTemplate = PREMADE_TEMPLATES[0];
  const maxHP = 10 + (5 * Math.round((defaultTemplate.stats.BODY + defaultTemplate.stats.WILL) / 2));
  const maxHum = defaultTemplate.stats.EMP * 10;

  const [hudState, setHudState] = useState<HUDState>(() => {
    const saved = localStorage.getItem('edgerunner_hud');
    const defaultState = {
      name: defaultTemplate.name,
      role: defaultTemplate.role,
      roleRank: defaultTemplate.roleRank,
      hpCurrent: maxHP,
      hpMax: maxHP,
      woundState: 'Light',
      spHeadCurrent: defaultTemplate.headSP,
      spHeadMax: defaultTemplate.headSP,
      spBodyCurrent: defaultTemplate.bodySP,
      spBodyMax: defaultTemplate.bodySP,
      humanityCurrent: maxHum,
      humanityMax: maxHum,
      empCurrent: defaultTemplate.stats.EMP,
      streetCred: defaultTemplate.streetCred,
      heat: defaultTemplate.heat,
      cash: defaultTemplate.cash,
      activeStatusEffects: [],
      criticalInjuries: [],
      stats: defaultTemplate.stats,
      inventory: [
        'Militech Ronin Assault Rifle',
        'Arasaka Heavy Pistol',
        'Trauma Team Hypo (Heals 5 HP)',
        'Speedheal Inhaler',
        'Agent Pocket Comms',
        'Kevlar Armor Vest (SP 11)'
      ],
      customDescription: defaultTemplate.lifepathSummary,
      skills: buildDefaultSkills(defaultTemplate.role),
      factions: DEFAULT_FACTIONS,
      contacts: DEFAULT_CONTACTS,
      activeChoices: [],
      activeEnemies: []
    };

    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...defaultState, 
        ...parsed, 
        inventory: (parsed.inventory && parsed.inventory.length > 0) ? parsed.inventory : defaultState.inventory,
        customDescription: parsed.customDescription || defaultState.customDescription,
        factions: parsed.factions || DEFAULT_FACTIONS,
        contacts: parsed.contacts || DEFAULT_CONTACTS,
        activeChoices: parsed.activeChoices || [],
        activeEnemies: parsed.activeEnemies || []
      };
    }
    return defaultState;
  });

  // Lives here so scene images and in-flight Horde jobs survive tab switches.
  const sceneImages = useSceneImages();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('edgerunner_messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((msg: any) => ({
        ...msg,
        text: typeof msg.text === 'string' ? msg.text : (msg.text?.prompt || JSON.stringify(msg.text) || '')
      }));
    }
    return [{
      id: 'gm_start',
      sender: 'gm',
      text: generateRandomStarterScenario().prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
  });

  // Auto-save effects
  useEffect(() => {
    localStorage.setItem('edgerunner_hud', JSON.stringify(hudState));
  }, [hudState]);

  useEffect(() => {
    localStorage.setItem('edgerunner_messages', JSON.stringify(messages));
  }, [messages]);

  // Send quick action or gig directly to GM Chat
  const handleSendPromptToGM = (promptText: string) => {
    setActiveTab('chat');
    // Add user message and let GMChat trigger
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
  };

  const handleLoad = (hud: HUDState, msgs: ChatMessage[]) => {
    setHudState(hud);
    setMessages(msgs.map(msg => ({
      ...msg,
      text: typeof msg.text === 'string' ? msg.text : ((msg.text as any)?.prompt || JSON.stringify(msg.text) || '')
    })));
    setIsBuildingLifepath(false);
    setActiveTab('chat');
  };

  const executeNewRun = () => {
    console.log("Initiating new run and switching to character builder...");
    
    // Clear storage for active run
    localStorage.removeItem('edgerunner_hud');
    localStorage.removeItem('edgerunner_messages');
    resetCampaignMemory();
    
    // Reset active messages
    setMessages([{
      id: 'gm_start',
      sender: 'gm',
      text: generateRandomStarterScenario().prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    // Reset character HUD state
    const template = PREMADE_TEMPLATES[0];
    const hp = 10 + (5 * Math.round((template.stats.BODY + template.stats.WILL) / 2));
    const hum = template.stats.EMP * 10;

    setHudState({
      name: template.name,
      role: template.role,
      roleRank: template.roleRank,
      hpCurrent: hp,
      hpMax: hp,
      woundState: 'Light',
      spHeadCurrent: template.headSP,
      spHeadMax: template.headSP,
      spBodyCurrent: template.bodySP,
      spBodyMax: template.bodySP,
      humanityCurrent: hum,
      humanityMax: hum,
      empCurrent: template.stats.EMP,
      streetCred: template.streetCred,
      heat: template.heat,
      cash: template.cash,
      activeStatusEffects: [],
      criticalInjuries: [],
      stats: template.stats,
      inventory: [],
      factions: DEFAULT_FACTIONS,
      contacts: DEFAULT_CONTACTS,
      activeChoices: [],
      activeEnemies: [],
      skills: buildDefaultSkills(template.role),
      descriptiveDensity: 2
    });

    // Open character builder directly
    setIsBuildingLifepath(true);
    setActiveTab('hud');
    setShowResetConfirm(false);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-neutral-100 font-sans selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hudState={hudState}
        onResetGame={() => setShowResetConfirm(true)}
      />

      {/* Cyberpunk Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border-2 border-red-600/80 rounded-lg p-6 max-w-md w-full shadow-[0_0_30px_rgba(220,38,38,0.4)] relative font-mono text-sm space-y-4 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-400 font-bold text-lg border-b border-red-900/50 pb-3 uppercase">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
              <span>[ SYSTEM PURGE & NEW RUN ]</span>
            </div>

            <p className="text-neutral-300 text-xs leading-relaxed">
              Initiating a new run will wipe your active character, active GM chat log, and tactical status.
            </p>

            <div className="p-3 bg-red-950/30 border border-red-800/40 rounded text-[11px] text-red-300">
              <span className="font-bold text-red-400">NOTE:</span> Saved characters in the <span className="text-yellow-400">Save Manager</span> will NOT be affected. You will be taken straight into the <span className="text-cyan-400">Character Builder</span>.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-bold uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeNewRun}
                className="flex items-center gap-2 px-5 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(220,38,38,0.6)]"
              >
                <RotateCcw className="w-4 h-4" />
                Start New Run
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main App Workspace */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <GMChat
            messages={messages}
            setMessages={setMessages}
            hudState={hudState}
            setHudState={setHudState}
            onOpenDiceRoller={() => setActiveTab('combat')}
            onOpenDamagePipeline={() => setActiveTab('combat')}
            onOpenQuickhackSuite={() => setActiveTab('quickhack')}
            sceneImages={sceneImages}
          />
        )}

        {activeTab === 'hud' && (
          isBuildingLifepath ? (
            <CharacterBuilder
              hudState={hudState}
              setHudState={setHudState}
              onComplete={() => {
                setIsBuildingLifepath(false);
                setActiveTab('chat');
              }}
            />
          ) : (
            <CharacterHUD
              hudState={hudState}
              setHudState={setHudState}
              onOpenLifepathBuilder={() => setIsBuildingLifepath(true)}
            />
          )
        )}

        {activeTab === 'factions' && (
          <FactionAndNPCLog
            hudState={hudState}
            onUpdateHUD={(updater) => setHudState(updater)}
            onSendToGM={(text) => handleSendPromptToGM(text)}
          />
        )}

        {activeTab === 'combat' && (
          <CombatEngine hudState={hudState} setHudState={setHudState} />
        )}

        {activeTab === 'quickhack' && (
          <QuickhackSuite
            hudState={hudState}
            setHudState={setHudState}
            onSendToGM={handleSendPromptToGM}
          />
        )}

        {activeTab === 'gigs' && (
          <GigGenerator
            hudState={hudState}
            onSelectGig={handleSendPromptToGM}
          />
        )}

        {activeTab === 'saves' && (
          <SaveManager hudState={hudState} messages={messages} onLoad={handleLoad} />
        )}
      </main>
    </div>
  );
}
