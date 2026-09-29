import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Minus, 
  Move, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Search, 
  ExternalLink,
  Flame
} from 'lucide-react';
import { MemeSound } from '../types/soundboard';

interface FloatingWindowHUDProps {
  isOpen: boolean;
  onClose: () => void;
  memes: MemeSound[];
  playingId: string | null;
  onPlay: (meme: MemeSound) => void;
  onStopAll: () => void;
  onRequestNativePiP?: () => void;
  canNativePiP?: boolean;
}

export const FloatingWindowHUD: React.FC<FloatingWindowHUDProps> = ({
  isOpen,
  onClose,
  memes,
  playingId,
  onPlay,
  onStopAll,
  onRequestNativePiP,
  canNativePiP = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [opacity, setOpacity] = useState(0.92);
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState({ x: 24, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 80,
  });

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 320, dragRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const filteredMemes = memes.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sinhalaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.hotkey.toLowerCase() === searchQuery.toLowerCase()
  );

  // Minimized Floating Bubble
  if (isMinimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-50 select-none animate-in fade-in"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 p-2.5 bg-zinc-950/95 border-2 border-orange-500 rounded-full shadow-2xl shadow-orange-500/30 text-orange-400 hover:scale-105 active:scale-95 transition-all group backdrop-blur-md"
          title="Click to expand Free Fire Soundboard HUD"
        >
          <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-100 pr-1 font-mono">FF MEME</span>
          {playingId && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: opacity,
      }}
      className="fixed z-50 w-80 max-h-[82vh] flex flex-col bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden select-none transition-opacity"
    >
      {/* HUD Header with Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3 py-2.5 bg-zinc-900/90 border-b border-zinc-800 cursor-move"
      >
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-bold tracking-wider text-orange-400 font-mono">
            FREE FIRE OVERLAY
          </span>
        </div>

        <div className="flex items-center gap-1">
          {canNativePiP && onRequestNativePiP && (
            <button
              onClick={onRequestNativePiP}
              title="Popout to Native Always-on-Top Window"
              className="p-1 rounded text-zinc-400 hover:text-orange-300 hover:bg-zinc-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize to Bubble"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            title="Close Overlay"
            className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Controls: Opacity slider & Stop All Panic button */}
      <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <Sliders className="w-3 h-3 text-zinc-400" />
          <input
            type="range"
            min="0.4"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            title={`Overlay Transparency: ${Math.round(opacity * 100)}%`}
            className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <span className="text-[10px] text-zinc-400 font-mono">{Math.round(opacity * 100)}%</span>
        </div>

        <button
          onClick={onStopAll}
          className="flex items-center gap-1 px-2 py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-200 text-[11px] font-semibold rounded-md transition-colors active:scale-95"
          title="Panic Silence (Stops all audio instantly - Key: ESC or Space)"
        >
          <VolumeX className="w-3 h-3 text-red-400" />
          <span>STOP (ESC)</span>
        </button>
      </div>

      {/* Mini Search */}
      <div className="p-2 border-b border-zinc-800/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search meme or hotkey..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 text-xs text-zinc-200 pl-8 pr-3 py-1.5 rounded-md border border-zinc-800 focus:outline-none focus:border-orange-500/80 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Compact Memes Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[50vh] scrollbar-thin">
        {filteredMemes.map((meme) => {
          const isPlaying = playingId === meme.id;
          return (
            <button
              key={meme.id}
              onClick={() => (isPlaying ? onStopAll() : onPlay(meme))}
              className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all active:scale-[0.98] ${
                isPlaying
                  ? 'bg-orange-500/25 border-orange-500 text-orange-200'
                  : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800/70 text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <span className="text-sm select-none">{meme.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight font-['Noto_Sans_Sinhala',sans-serif]">
                    {meme.sinhalaName}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{meme.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isPlaying ? (
                  <Volume2 className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-950 text-orange-400 rounded border border-zinc-700/60">
                    {meme.hotkey}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {filteredMemes.length === 0 && (
          <p className="text-center text-xs text-zinc-500 py-4">No matching memes found</p>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
        <span>Press key in game to trigger</span>
        <span className="font-mono text-orange-400">{filteredMemes.length} Sounds</span>
      </div>
    </div>
  );
};
