import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, RefreshCw, Dices, ShieldAlert, Sparkles, UserCheck, Shuffle, Swords, Skull, Flame, Zap, Crosshair, Package, Phone, Radio, AlertTriangle, ImageIcon } from 'lucide-react';
import { ChatMessage, ChoiceChip, EnemyUnit, HUDState } from '../types';
import { parseHUDBlock } from '../utils/hudParser';
import { generateDynamicChoices } from '../utils/choiceGenerator';
import { SCENE_STARTERS, generateRandomStarterScenario } from '../data/ruleset';
import { ActionCheckModal } from './ActionCheckModal';
import { GeneratedImageGallery } from './GeneratedImageGallery';
import { SceneVisualiser } from './SceneVisualiser';
import { SceneImagesController } from '../utils/useSceneImages';
import { buildGMSystemInstruction, updateStoredPlotSummary } from '../utils/promptBuilder';
import { motion, AnimatePresence } from 'motion/react';

interface GMChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  hudState: HUDState;
  setHudState: React.Dispatch<React.SetStateAction<HUDState>>;
  onOpenDiceRoller?: () => void;
  onOpenDamagePipeline?: () => void;
  onOpenQuickhackSuite?: () => void;
  sceneImages: SceneImagesController;
}

export const GMChat: React.FC<GMChatProps> = ({
  messages,
  setMessages,
  hudState,
  setHudState,
  onOpenDiceRoller,
  onOpenDamagePipeline,
  onOpenQuickhackSuite,
  sceneImages
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastHUDUpdateAlert, setLastHUDUpdateAlert] = useState<string | null>(null);
  const [isActionCheckOpen, setIsActionCheckOpen] = useState(false);
  const [selectedCheckChoice, setSelectedCheckChoice] = useState<ChoiceChip | null>(null);
  const [visualiseTarget, setVisualiseTarget] = useState<ChatMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [streamingText, setStreamingText] = useState('');
  
  // Mobile drawer states
  const [showMobileLeft, setShowMobileLeft] = useState(false);
  const [showMobileRight, setShowMobileRight] = useState(false);
  
  // Diegetic UI State
  const [signalStrength, setSignalStrength] = useState(95);
  const [corruptedData, setCorruptedData] = useState<string | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streamingText]);

  // Diegetic Signal Fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalStrength(prev => {
        const drop = Math.random() > 0.8 ? Math.floor(Math.random() * 20) : 0;
        const recover = Math.floor(Math.random() * 10);
        let newSig = prev - drop + recover;
        if (newSig > 100) newSig = 100;
        if (newSig < 20) newSig = 20;
        return newSig;
      });
      
      if (Math.random() > 0.95) {
        const fragments = ["0xDEADBEEF...", "CORRUPTED SECTOR...", "NO CARRIER", "OVERRIDE DETECTED"];
        setCorruptedData(fragments[Math.floor(Math.random() * fragments.length)]);
        setTimeout(() => setCorruptedData(null), 2000);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isCallingApiRef = useRef(false);

  const streamGMResponse = async (historyToUse: ChatMessage[], promptText: string) => {
    if (isCallingApiRef.current) return;
    isCallingApiRef.current = true;
    setLoading(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message: promptText,
          history: historyToUse.map(m => ({ sender: m.sender, text: m.text })),
          currentHUD: hudState,
          systemInstruction: buildGMSystemInstruction(hudState)
        })
      });

      if (!res.ok) {
        throw new Error(`GM engine failed to respond (Status: ${res.status}).`);
      }

      if (!res.body) throw new Error('No readable stream from server.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullResponse = '';
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          
          for (const line of parts) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  fullResponse += parsed.text;
                  setStreamingText(fullResponse);
                } else if (parsed.info) {
                  console.info('GM Engine Notification:', parsed.info);
                  // Optionally add a temporary UI notification here if a toast library exists
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE chunk', e);
              }
            }
          }
        }
      }
      
      setStreamingText('');
      let finalGmData = fullResponse;
      
      // Update GM system prompt to reflect new pacing rules (appended to prompt)
      // This ensures the GM knows not to rush or use "what do you do"
      // Update GM system prompt to reflect new pacing rules (appended to prompt)
      // This ensures the GM knows not to rush or use "what do you do"
      
      const { cleanText: hudCleanText, updatedHUD } = parseHUDBlock(fullResponse, hudState);
      
      // Force extraction of the JSON block, even if wrapped in conversational filler
      const jsonMatch = hudCleanText.match(/\{[\s\S]*\}/);
      let extraction = hudCleanText;
      if (jsonMatch) {
          extraction = jsonMatch[0];
      }
      
      let parsedResponse: any;
      try {
          parsedResponse = JSON.parse(extraction);
      } catch (e) {
          console.error("Failed to parse JSON response:", e, "Data:", extraction);
          throw new Error("GM engine returned invalid JSON data structure.");
      }
      
      const finalCleanText = parsedResponse.narrative || "Data stream error.";
      
      let parsedChoices: ChoiceChip[] = [];
      if (parsedResponse.tacticalChoices && Array.isArray(parsedResponse.tacticalChoices)) {
          parsedChoices = parsedResponse.tacticalChoices.map((c: any) => ({
              id: c.id,
              label: c.label,
              category: c.category,
              promptText: c.promptText,
              isHighStakes: c.isHighStakes,
              dv: Number(c.dv) || 15,
              skill: c.skill || 'Handgun'
          }));
      } else {
        // If no choices, suggest standard pacing actions
        parsedChoices = [
            { id: 'c_observe', label: '[Observe]', category: 'Tactical', promptText: 'I carefully observe the surroundings for more details.', isHighStakes: false },
            { id: 'c_rest', label: '[Wait/Pace]', category: 'Tactical', promptText: 'I take a moment to wait and see how the scene naturally unfolds.', isHighStakes: false }
        ];
      }
      
      if (JSON.stringify(updatedHUD) !== JSON.stringify(hudState)) {
        setHudState(updatedHUD);
        setLastHUDUpdateAlert(`HUD Synced: HP ${updatedHUD.hpCurrent}/${updatedHUD.hpMax} | Head SP ${updatedHUD.spHeadCurrent} | Body SP ${updatedHUD.spBodyCurrent}`);
        setTimeout(() => setLastHUDUpdateAlert(null), 4000);
      }

      const gmMsg: ChatMessage = {
        id: `gm_${Date.now()}`,
        sender: 'gm',
        text: finalCleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hudUpdate: updatedHUD,
        choices: parsedChoices
      };

      setMessages(prev => {
        const next = [...prev, gmMsg];
        updateStoredPlotSummary(next.map(m => m.text));
        return next;
      });
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        sender: 'system',
        text: `[SYSTEM ERROR]: Unable to connect to Night City GM Subnet: ${err.message || 'Network Timeout'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setStreamingText('');
      isCallingApiRef.current = false;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading || isCallingApiRef.current) return;

    if (!textToSend) setInput('');

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    await streamGMResponse(newHistory, query);
  };

  // Watch for external unresponded user prompts (e.g. from Mission Board gigs)
  useEffect(() => {
    if (messages.length > 0 && !loading && !isCallingApiRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'user') {
        streamGMResponse(messages, lastMsg.text);
      }
    }
  }, [messages.length]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const lower = input.toLowerCase();
    const isAction = lower.includes('shoot') || lower.includes('fire') || lower.includes('hack') || lower.includes('sneak') || lower.includes('breach') || lower.includes('stab') || lower.includes('kill') || lower.includes('attack') || lower.includes('bribe') || lower.includes('persuade') || lower.includes('aim') || lower.includes('slice') || lower.includes('dodge');

    if (isAction && !input.includes('[CHECK RESOLUTION:')) {
      let detectedSkill = 'Handgun';
      let detectedCategory: ChoiceChip['category'] = 'Brute';
      let detectedDv = 15;
      
      if (lower.includes('hack') || lower.includes('breach') || lower.includes('deck') || lower.includes('interface')) {
        detectedSkill = 'Interface';
        detectedCategory = 'Netrun';
      } else if (lower.includes('sneak') || lower.includes('shadow') || lower.includes('dodge')) {
        detectedSkill = 'Stealth';
        detectedCategory = 'Stealth';
      } else if (lower.includes('persuade') || lower.includes('bribe') || lower.includes('bluff') || lower.includes('talk')) {
        detectedSkill = 'Persuasion';
        detectedCategory = 'Social';
      } else if (lower.includes('rifle') || lower.includes('assault')) {
        detectedSkill = 'Shoulder Arms';
      }

      setSelectedCheckChoice({
        id: `custom_${Date.now()}`,
        label: '[Action Check]',
        category: detectedCategory,
        promptText: input,
        dv: detectedDv,
        skill: detectedSkill,
        isHighStakes: true
      });
      setIsActionCheckOpen(true);
      setInput('');
      return;
    }

    handleSendMessage();
  };

  const renderFormattedText = (text: any) => {
    if (typeof text !== 'string') {
      text = text?.prompt || JSON.stringify(text) || '';
    }
    const cleanedText = text.replace(/\[HIDDEN:[\s\S]*?\]/gi, '').replace(/\[TACTICAL NETLINK NOTICE\][\s\S]*?\n/gi, '');
    const parts = cleanedText.split(/(\[[^\]]+\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        if (part.toLowerCase().includes('check:') || part.toLowerCase().includes('damage:') || part.toLowerCase().includes('quickhack:')) {
          return (
            <button 
              key={idx} 
              onClick={() => {
                setSelectedCheckChoice({
                  id: `manual_${Date.now()}`,
                  label: part,
                  category: 'Tactical',
                  promptText: 'I roll the check.'
                });
                setIsActionCheckOpen(true);
              }}
              className="inline-block my-1 px-2.5 py-1 rounded bg-black border border-yellow-500/60 hover:bg-yellow-950/50 text-yellow-300 font-mono text-xs shadow-[0_0_8px_rgba(252,238,10,0.2)] block cursor-pointer transition text-left"
            >
              <Dices className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
              {part}
            </button>
          );
        }
        if (part.toLowerCase().includes('name:') && part.toLowerCase().includes('hp:')) {
          return (
            <div key={idx} className="my-3 p-3 rounded bg-neutral-950 border border-cyan-500/50 font-mono text-xs text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-2 font-bold text-yellow-400">
                <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" />MANDATORY GM HUD STATE BLOCK</span>
                <span className="text-[10px] text-cyan-400">UPDATED BY GM</span>
              </div>
              <pre className="whitespace-pre-wrap">{part}</pre>
            </div>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const heatLevel = hudState.heat || 0;
  const isHighHeat = heatLevel > 70;

  return (
    <div className={`flex h-full w-full max-w-7xl mx-auto p-0 lg:p-4 gap-3 relative ${isHighHeat ? 'shadow-[inset_0_0_50px_rgba(255,0,0,0.1)]' : ''}`}>
      
      {/* Left Sidebar: Contacts & World Info */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950/95 backdrop-blur-md border-r border-neutral-800 p-4 flex flex-col gap-3 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-64 lg:p-0 lg:bg-transparent lg:border-none lg:z-auto ${showMobileLeft ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between lg:hidden mb-2">
          <span className="text-cyan-400 font-bold font-mono text-sm tracking-widest">NEURO-LINK</span>
          <button onClick={() => setShowMobileLeft(false)} className="text-neutral-500 hover:text-white p-2">✕</button>
        </div>
        
        <div className="bg-zinc-950 border border-neutral-800 rounded-lg p-3 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
             <span className="font-mono text-xs text-cyan-400 font-bold flex items-center gap-2"><Radio className="w-4 h-4"/> NEURO-LINK</span>
             <span className={`font-mono text-[10px] font-bold ${signalStrength < 50 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
               SIG: {signalStrength}%
             </span>
          </div>

          <div className="flex flex-col gap-2 mb-3">
              <span className="font-mono text-[10px] text-zinc-500">DESCRIPTIVE DENSITY</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <button
                      key={level}
                      onClick={() => setHudState(prev => ({ ...prev, descriptiveDensity: level }))}
                      className={`flex-1 py-1 rounded font-mono text-[10px] ${hudState.descriptiveDensity === level ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                      {level}
                  </button>
                ))}
              </div>
          </div>
          
          {corruptedData && (
            <div className="bg-red-950/50 border border-red-500/50 text-red-400 font-mono text-[10px] p-2 mb-2 animate-pulse rounded">
              <AlertTriangle className="w-3 h-3 inline mr-1" /> {corruptedData}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[10px] text-neutral-500">
              <span>HEAT LEVEL</span>
              <span className={isHighHeat ? 'text-red-500 font-bold animate-pulse' : 'text-yellow-500'}>{heatLevel}/100</span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${isHighHeat ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${heatLevel}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-neutral-800 rounded-lg p-3 flex-1 overflow-y-auto shadow-xl">
          <span className="font-mono text-xs text-purple-400 font-bold flex items-center gap-2 mb-3 border-b border-neutral-800 pb-2"><Phone className="w-4 h-4"/> ROLODEX</span>
          <div className="space-y-2">
            {hudState.contacts && hudState.contacts.length > 0 ? (
              hudState.contacts.map((contact, i) => (
                <button key={i} onClick={() => handleSendMessage(`I call ${contact.name} on my agent.`)} className="w-full text-left bg-neutral-900 hover:bg-purple-900/30 border border-neutral-800 hover:border-purple-500/50 p-2 rounded transition group">
                  <div className="font-mono text-[11px] font-bold text-neutral-300 group-hover:text-purple-300">{contact.name}</div>
                  <div className="font-mono text-[9px] text-neutral-500">{contact.role} | {contact.faction}</div>
                </button>
              ))
            ) : (
              <div className="text-[10px] font-mono text-neutral-600">No active contacts...</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Terminal Window */}
      <div className="flex-1 bg-zinc-950 lg:border border-neutral-800 lg:rounded-lg overflow-hidden flex flex-col shadow-2xl relative w-full max-w-full">
        <div className="bg-neutral-900 border-b border-neutral-800 px-3 lg:px-4 py-2 flex items-center justify-between font-mono text-xs text-neutral-400">
          <div className="flex items-center gap-2 lg:gap-3">
            <button onClick={() => setShowMobileLeft(true)} className="lg:hidden text-cyan-400 p-1.5 bg-neutral-800/50 hover:bg-neutral-800 rounded"><Radio className="w-4 h-4" /></button>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping hidden sm:block"></span>
            <span className="text-yellow-400 font-bold tracking-wider">NC_GM_LINK</span>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
             <button onClick={() => setMessages([])} className="text-neutral-500 hover:text-red-400 p-1"><RefreshCw className="w-4 h-4" /></button>
             <button onClick={() => setShowMobileRight(true)} className="lg:hidden text-yellow-400 p-1.5 bg-neutral-800/50 hover:bg-neutral-800 rounded"><Package className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm pb-32 relative">
          {messages.map(msg => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 font-mono text-[10px] text-neutral-500">
                <span>{msg.sender === 'user' ? hudState.name : 'GM'}</span>
              </div>
              <div className={`max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-100' : 'bg-neutral-900 border border-neutral-800 text-neutral-300 shadow-md'
                }`}>
                <div className="whitespace-pre-wrap">{renderFormattedText(msg.text)}</div>
              </div>
              {msg.sender === 'gm' && (
                <button
                  onClick={() => setVisualiseTarget(msg)}
                  className="mt-1 flex items-center gap-1 font-mono text-[10px] text-neutral-600 transition hover:text-fuchsia-400"
                >
                  <ImageIcon className="h-3 w-3" /> VISUALISE
                </button>
              )}
              <GeneratedImageGallery
                images={sceneImages.images.filter(img => img.messageId === msg.id)}
                jobs={sceneImages.jobs.filter(job => job.messageId === msg.id)}
                onCancelJob={sceneImages.cancel}
                onDismissJob={sceneImages.dismissJob}
                onRemoveImage={sceneImages.removeImage}
              />
              {msg.choices && msg.choices.length > 0 && (
                <div className="flex flex-col w-full gap-2 mt-4 max-w-2xl border-t border-neutral-800 pt-3">
                  <span className="font-mono text-xs text-neutral-500 mb-1">MANDATORY NARRATIVE ACTIONS (CLICK TO ROLL CHECK):</span>
                  {msg.choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => {
                        setSelectedCheckChoice({
                          ...choice,
                          dv: choice.dv || 15,
                          skill: choice.skill || (choice.category === 'Netrun' ? 'Interface' : choice.category === 'Social' ? 'Persuasion' : choice.category === 'Stealth' ? 'Stealth' : 'Handgun'),
                          isHighStakes: true
                        });
                        setIsActionCheckOpen(true);
                      }}
                      className="text-left px-4 py-3 rounded font-mono text-xs border transition flex items-center justify-between group bg-neutral-900 border-neutral-800 hover:border-yellow-500 text-neutral-300 hover:text-yellow-300 shadow-md cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-bold tracking-wider flex items-center gap-1.5 text-yellow-400">
                          <Dices className="w-3.5 h-3.5 text-yellow-400" />
                          {choice.label}
                        </span>
                        <span className="opacity-80 font-sans text-sm">{choice.promptText}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded text-[10px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800 shrink-0 ml-2">
                        {choice.skill || 'Roll'} vs DV {choice.dv || 15}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          
          {streamingText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1 font-mono text-[10px] text-yellow-500 animate-pulse">
                <span>GM_STREAMING...</span>
              </div>
              <div className="max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed bg-neutral-900 border border-yellow-500/30 text-neutral-300 shadow-md">
                <div className="whitespace-pre-wrap">{renderFormattedText(streamingText)}</div>
                <span className="inline-block w-2 h-4 bg-yellow-400 animate-pulse ml-1 align-middle"></span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>
        {visualiseTarget && (
          <SceneVisualiser
            messageId={visualiseTarget.id}
            sceneText={typeof visualiseTarget.text === 'string' ? visualiseTarget.text : String(visualiseTarget.text ?? '')}
            hudState={hudState}
            onClose={() => setVisualiseTarget(null)}
            onGenerate={sceneImages.generate}
          />
        )}

        {/* Sticky Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-md border-t border-neutral-800 p-3">
          <div className="flex items-center gap-2 mb-2 overflow-x-auto font-mono text-[10px] pb-1">
             <button onClick={() => handleSendMessage('I look around and assess the situation.')} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-cyan-400 border border-cyan-900 rounded whitespace-nowrap">👀 Look Around</button>
             <button onClick={() => handleSendMessage('I check my gear and ammo.')} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-yellow-400 border border-yellow-900 rounded whitespace-nowrap">🎒 Check Gear</button>
             <button onClick={() => handleSendMessage('I wait and see what happens next.')} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-700 rounded whitespace-nowrap">⏳ Wait</button>
             <div className="w-px h-4 bg-neutral-800 mx-1"></div>
             {onOpenDiceRoller && (
                <button onClick={onOpenDiceRoller} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-red-400 border border-red-900 rounded whitespace-nowrap flex items-center gap-1"><Dices className="w-3 h-3"/> Roll</button>
             )}
             {onOpenDamagePipeline && (
                <button onClick={onOpenDamagePipeline} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-orange-400 border border-orange-900 rounded whitespace-nowrap flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Damage</button>
             )}
             {onOpenQuickhackSuite && (
                <button onClick={onOpenQuickhackSuite} className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-purple-400 border border-purple-900 rounded whitespace-nowrap flex items-center gap-1"><Zap className="w-3 h-3"/> Hack</button>
             )}
          </div>
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Execute command or action..."
              disabled={loading}
              className="flex-1 bg-neutral-900/50 border border-cyan-900/50 focus:border-cyan-400 rounded px-4 py-3 font-mono text-sm text-cyan-100 placeholder-cyan-900/50 outline-none transition"
            />
            <button
              type="button"
              onClick={() => {
                if (!input.trim()) return;
                setSelectedCheckChoice({
                  id: `custom_${Date.now()}`,
                  label: '[Action Check]',
                  category: 'Tactical',
                  promptText: input,
                  dv: 15,
                  skill: 'Handgun',
                  isHighStakes: true
                });
                setIsActionCheckOpen(true);
              }}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 disabled:opacity-50 text-yellow-400 font-mono font-bold text-xs rounded flex items-center gap-1.5 transition cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5 text-yellow-400" />
              CHECK & ROLL
            </button>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-cyan-600/20 hover:bg-cyan-500/30 border border-cyan-500/50 disabled:opacity-50 text-cyan-400 font-mono font-bold text-sm rounded flex items-center gap-2 transition"
            >
              EXECUTE
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Inventory Grid */}
      <div className={`fixed inset-y-0 right-0 z-50 w-72 bg-zinc-950/95 backdrop-blur-md border-l border-neutral-800 p-4 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-64 lg:bg-zinc-950 lg:border-neutral-800 lg:rounded-lg lg:p-3 lg:shadow-xl lg:z-auto ${showMobileRight ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        <div className="flex items-center justify-between lg:hidden mb-2">
          <span className="text-yellow-400 font-bold font-mono text-sm tracking-widest">INVENTORY</span>
          <button onClick={() => setShowMobileRight(false)} className="text-neutral-500 hover:text-white p-2">✕</button>
        </div>
        
        <span className="hidden lg:flex font-mono text-xs text-yellow-400 font-bold items-center gap-2 mb-3 border-b border-neutral-800 pb-2"><Package className="w-4 h-4"/> INVENTORY GRID</span>
        <div className="grid grid-cols-2 gap-2">
          {hudState.inventory && hudState.inventory.length > 0 ? (
            hudState.inventory.map((item, i) => (
              <button 
                key={i}
                onClick={() => handleSendMessage(`I use or equip my ${item}.`)}
                className="aspect-square bg-neutral-900 border border-neutral-800 hover:border-yellow-500/50 rounded flex items-center justify-center p-2 text-center text-[10px] font-mono text-neutral-400 hover:text-yellow-400 transition"
              >
                {item}
              </button>
            ))
          ) : (
            <div className="col-span-2 text-center text-[10px] font-mono text-neutral-600 py-4">Inventory Empty</div>
          )}
        </div>
      </div>
      
      {/* Mobile Backdrops */}
      {(showMobileLeft || showMobileRight) && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => { setShowMobileLeft(false); setShowMobileRight(false); }}
        />
      )}
      
      {/* High-Stakes Action Check Modal */}
      <ActionCheckModal
        isOpen={isActionCheckOpen}
        onClose={() => {
          setIsActionCheckOpen(false);
          setSelectedCheckChoice(null);
        }}
        hudState={hudState}
        initialChoice={selectedCheckChoice}
        onExecuteCheck={(checkPrompt) => handleSendMessage(checkPrompt)}
      />
      
    </div>
  );
};
