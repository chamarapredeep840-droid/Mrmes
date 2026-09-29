import React from 'react';
import { Play, Square, Star, Trash2 } from 'lucide-react';
import { MemeSound } from '../types/soundboard';

interface SoundPadProps {
  meme: MemeSound;
  isPlaying: boolean;
  isFavorite: boolean;
  onPlay: (meme: MemeSound) => void;
  onStop: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export const SoundPad: React.FC<SoundPadProps> = ({
  meme,
  isPlaying,
  isFavorite,
  onPlay,
  onStop,
  onToggleFavorite,
  onDelete,
  compact = false,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onStop();
    } else {
      onPlay(meme);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        title={`${meme.name} (${meme.sinhalaName}) [Key: ${meme.hotkey}]`}
        className={`relative flex items-center justify-between p-2 rounded-lg border text-left transition-all select-none active:scale-95 ${
          isPlaying
            ? 'bg-orange-500/20 border-orange-500 text-orange-200 shadow-md shadow-orange-500/20'
            : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800/80 text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <span className="text-base select-none shrink-0">{meme.emoji}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate leading-tight">{meme.sinhalaName}</p>
            <p className="text-[10px] text-zinc-400 truncate">{meme.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5 px-1">
              <span className="w-1 bg-orange-400 rounded-full animate-bounce h-3" />
              <span className="w-1 bg-orange-400 rounded-full animate-bounce h-2 delay-75" />
              <span className="w-1 bg-orange-400 rounded-full animate-bounce h-3.5 delay-150" />
            </div>
          ) : (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 text-orange-400 rounded border border-zinc-700/60">
              {meme.hotkey}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-150 active:scale-[0.98] ${
        isPlaying
          ? 'bg-gradient-to-br from-orange-500/25 to-amber-600/15 border-orange-500 shadow-lg shadow-orange-500/25 ring-1 ring-orange-500/50'
          : 'bg-zinc-900/90 hover:bg-zinc-850 hover:border-zinc-700 border-zinc-800/90 shadow-sm'
      }`}
    >
      {/* Top row: Hotkey badge & favorite / delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-zinc-950/80 text-orange-400 rounded-md border border-zinc-700/80 shadow-xs">
            {meme.hotkey}
          </span>
          {meme.isCustom && (
            <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
              CUSTOM
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleFavorite(meme.id)}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 rounded-md hover:bg-zinc-800 transition-colors ${
              isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {meme.isCustom && onDelete && (
            <button
              onClick={() => onDelete(meme.id)}
              title="Delete meme"
              className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Center content */}
      <div className="my-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-2xl select-none">{meme.emoji}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-zinc-100 font-['Noto_Sans_Sinhala',sans-serif] leading-tight line-clamp-2">
              {meme.sinhalaName}
            </h3>
          </div>
        </div>
        <p className="text-xs text-zinc-400 font-medium truncate tracking-wide">
          {meme.name}
        </p>
      </div>

      {/* Bottom status and soundwave */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5 px-0.5">
              <span className="w-1 bg-orange-400 rounded-full animate-bounce h-3" />
              <span className="w-1 bg-orange-400 rounded-full animate-bounce h-2 delay-75" />
              <span className="w-1 bg-orange-400 rounded-full animate-bounce h-3.5 delay-150" />
              <span className="w-1 bg-orange-400 rounded-full animate-bounce h-2.5 delay-200" />
            </div>
          ) : (
            <span className="text-zinc-500 capitalize">{meme.category}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              isPlaying
                ? 'bg-orange-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-700'
            }`}
          >
            {isPlaying ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
