import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Zap, 
  Radio, 
  HelpCircle, 
  Sliders
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { AudioSettings } from '../types/soundboard';

interface MicPassthroughMixerProps {
  settings: AudioSettings;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  onOpenGuide: () => void;
}

export const MicPassthroughMixer: React.FC<MicPassthroughMixerProps> = ({
  settings,
  onUpdateSettings,
  onOpenGuide,
}) => {
  const [isMicOn, setIsMicOn] = useState(settings.micEnabled);
  const [micLevel, setMicLevel] = useState(0);
  const [isMicError, setIsMicError] = useState<string | null>(null);

  const toggleMic = async () => {
    try {
      setIsMicError(null);
      const nextState = !isMicOn;
      const success = await audioEngine.toggleMicrophone(nextState);
      setIsMicOn(success);
      onUpdateSettings({ micEnabled: success });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone permission denied';
      setIsMicError(msg);
      setIsMicOn(false);
      onUpdateSettings({ micEnabled: false });
    }
  };

  // Poll mic level when mic is on
  useEffect(() => {
    let animId: number;
    const updateMeter = () => {
      if (isMicOn) {
        setMicLevel(audioEngine.getMicLevel());
      } else {
        setMicLevel(0);
      }
      animId = requestAnimationFrame(updateMeter);
    };
    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, [isMicOn]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        {/* Left: Mic status and Live Toggle */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={toggleMic}
            className={`relative p-3 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
              isMicOn
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/40'
                : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
            title={isMicOn ? 'Click to Disable Live Mic Passthrough' : 'Click to Enable Live Mic Passthrough'}
          >
            {isMicOn ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-1.5 font-['Noto_Sans_Sinhala',sans-serif]">
                <span>Live Mic + Meme Passthrough</span>
                <span className="text-xs font-normal text-zinc-400 font-sans hidden sm:inline">(Free Fire Team Audio)</span>
              </h3>
              {isMicOn && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-['Noto_Sans_Sinhala',sans-serif]">
              {isMicOn
                ? 'ඔබේ මයික්‍රෆෝනය සක්‍රියයි — මීම්ස් ඔබ කතා කරන හඬ සමඟ එකට මික්ස් වේ'
                : 'ක්‍රියාත්මක කර මයික් එක සහ මීම්ස් එකට මිශ්‍ර කර Free Fire ටීම් එකට ඇසෙන්න සලස්වන්න'}
            </p>
          </div>
        </div>

        {/* Right: How to route button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-semibold transition-colors active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-['Noto_Sans_Sinhala',sans-serif]">Free Fire එකට යවන හැටි (Guide)</span>
          </button>
        </div>
      </div>

      {isMicError && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
          ⚠️ {isMicError}. Please allow microphone permission in your browser URL bar.
        </div>
      )}

      {/* Control Grid: Volume, Booster, Filter, and Mic Level Meter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 pt-1">
        {/* Mic Level Visualizer */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Mic className="w-3 h-3 text-zinc-400" /> Mic Input Level
            </span>
            <span className="font-mono text-[11px] text-zinc-300">{micLevel}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden flex">
            <div
              style={{ width: `${micLevel}%` }}
              className={`h-full transition-all duration-75 rounded-full ${
                micLevel > 80 ? 'bg-red-500' : micLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">
            {isMicOn ? 'Speaking detected' : 'Turn Mic ON to test'}
          </span>
        </div>

        {/* 250% Loud Booster */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-orange-300">
              <Zap className="w-3.5 h-3.5 text-orange-400" /> Loud Blast Booster
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              settings.loudBooster ? 'bg-orange-500/20 text-orange-300' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {settings.loudBooster ? '+250% BOOST' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-zinc-400">Team hears over gunshots</span>
            <button
              onClick={() => onUpdateSettings({ loudBooster: !settings.loudBooster })}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.loudBooster ? 'bg-orange-500 justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>

        {/* Master Volume */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Volume2 className="w-3 h-3 text-zinc-400" /> Master Volume
            </span>
            <span className="font-mono text-[11px] text-zinc-300">
              {Math.round(settings.masterVolume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Overall soundboard gain</span>
        </div>

        {/* Voice Comms FX Filter */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Radio className="w-3 h-3 text-zinc-400" /> Voice FX Filter
            </span>
            <Sliders className="w-3 h-3 text-zinc-500" />
          </div>
          <select
            value={settings.voiceFilter}
            onChange={(e) => onUpdateSettings({ voiceFilter: e.target.value as AudioSettings['voiceFilter'] })}
            className="w-full bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500"
          >
            <option value="none">Clean HD Audio</option>
            <option value="radio">Radio Comms (Walkie-Talkie)</option>
            <option value="megaphone">Megaphone Distortion</option>
            <option value="bassboost">Sub Bass Boost</option>
          </select>
          <span className="text-[10px] text-zinc-500 mt-1">Free Fire in-game radio style</span>
        </div>
      </div>
    </div>
  );
};
