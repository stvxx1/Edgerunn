import React, { useState } from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { HUDState, ChatMessage } from '../types';

interface SaveManagerProps {
  hudState: HUDState;
  messages: ChatMessage[];
  onLoad: (hud: HUDState, msgs: ChatMessage[]) => void;
}

export const SaveManager: React.FC<SaveManagerProps> = ({ hudState, messages, onLoad }) => {
  const [saveName, setSaveName] = useState('');
  const [saves, setSaves] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('edgerunner_saves') || '[]');
  });

  const saveGame = () => {
    if (!saveName) return;
    const saveKey = `save_${saveName}`;
    localStorage.setItem(saveKey, JSON.stringify({ hudState, messages }));
    
    const newSaves = Array.from(new Set([...saves, saveName]));
    setSaves(newSaves);
    localStorage.setItem('edgerunner_saves', JSON.stringify(newSaves));
    setSaveName('');
  };

  const loadGame = (name: string) => {
    const data = localStorage.getItem(`save_${name}`);
    if (data) {
      const parsed = JSON.parse(data);
      onLoad(parsed.hudState, parsed.messages);
    }
  };

  const deleteSave = (name: string) => {
    localStorage.removeItem(`save_${name}`);
    const newSaves = saves.filter(s => s !== name);
    setSaves(newSaves);
    localStorage.setItem('edgerunner_saves', JSON.stringify(newSaves));
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-4 text-xs font-mono">
      <h2 className="text-sm font-bold text-cyan-400 uppercase border-b border-neutral-800 pb-2">
        SAVE / LOAD MANAGER
      </h2>
      
      <div className="flex gap-2">
        <input 
          type="text" 
          value={saveName} 
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="New Save Name..."
          className="flex-grow bg-neutral-900 border border-neutral-700 px-3 py-2 rounded text-neutral-100"
        />
        <button onClick={saveGame} className="bg-cyan-600 px-4 py-2 rounded font-bold hover:bg-cyan-500">
          <Save className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {saves.map(name => (
          <div key={name} className="flex items-center justify-between bg-neutral-900 p-2 rounded">
            <span className="text-yellow-400 font-bold">{name}</span>
            <div className="flex gap-2">
              <button onClick={() => loadGame(name)} className="text-cyan-400 hover:text-cyan-300">
                <FolderOpen className="w-4 h-4" />
              </button>
              <button onClick={() => deleteSave(name)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
