import { create } from 'zustand';
import { ChatMessage, HUDState } from '../types';
import { INITIAL_HUD_STATE } from '../data/ruleset';

interface GameState {
  messages: ChatMessage[];
  hudState: HUDState;
  heat: number; // 0-100 scale
  signalStrength: number; // 0-100 scale
  addMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setHudState: (hudState: HUDState) => void;
  setHeat: (heat: number) => void;
  setSignalStrength: (signal: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  messages: [],
  hudState: INITIAL_HUD_STATE,
  heat: 20, // Start with a little heat
  signalStrength: 85,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  setHudState: (hudState) => set({ hudState }),
  setHeat: (heat) => set({ heat }),
  setSignalStrength: (signalStrength) => set({ signalStrength }),
}));
