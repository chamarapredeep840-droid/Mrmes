export type MemeCategory = 
  | 'all'
  | 'trending'
  | 'toxic'
  | 'funny'
  | 'hype'
  | 'sad'
  | 'squad'
  | 'custom';

export interface MemeSound {
  id: string;
  name: string;
  sinhalaName: string;
  category: MemeCategory;
  hotkey: string;
  emoji: string;
  duration?: number;
  audioBlobUrl?: string; // For user uploaded or recorded audio
  audioDataUri?: string; // Stored in IndexedDB
  synthRecipe?: SynthRecipe; // Web Audio synthesized sound definition
  speechText?: string;
  speechLang?: string;
  speechPitch?: number;
  speechRate?: number;
  color?: string;
  isFavorite?: boolean;
  playCount?: number;
  isCustom?: boolean;
}

export type SynthRecipe = 
  | { type: 'melody'; song: 'royalty' | 'fairytale' | 'moye_moye' }
  | { type: 'siren_run' }
  | { type: 'airhorn' }
  | { type: 'booyah_headshot' }
  | { type: 'emotional_damage' }
  | { type: 'wheeze_laugh' }
  | { type: 'radio_speaker'; voiceText: string }
  | { type: 'voice_fx'; voiceText: string; pitch: number; rate: number; fx?: 'radio' | 'megaphone' | 'deep' | 'chipmunk' | 'echo' };

export interface AudioSettings {
  masterVolume: number; // 0 to 1
  loudBooster: boolean; // 2.5x gain boost for game mic
  voiceFilter: 'none' | 'radio' | 'megaphone' | 'bassboost';
  micEnabled: boolean;
  micVolume: number;
  micNoiseGate: boolean;
  duckMicOnSound: boolean; // lowers gamer's mic volume while sound plays so sound is 100% clear
}

export interface FloatingWindowSettings {
  isOpen: boolean;
  isPiP: boolean;
  opacity: number;
  scale: number;
  position: { x: number; y: number };
  isMinimized: boolean;
}
