import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Flame, 
  Plus, 
  ExternalLink, 
  Search, 
  VolumeX, 
  LayoutGrid, 
  List, 
  Star, 
  Sparkles, 
  Volume2
} from 'lucide-react';
import { MemeSound, MemeCategory, AudioSettings } from './types/soundboard';
import { DEFAULT_MEMES } from './data/defaultMemes';
import { 
  getStoredCustomMemes, 
  saveCustomMeme, 
  deleteCustomMeme,
  getFavoritesFromStorage,
  saveFavoritesToStorage
} from './services/soundStorage';
import { audioEngine } from './services/audioEngine';
import { SoundPad } from './components/SoundPad';
import { FloatingWindowHUD } from './components/FloatingWindowHUD';
import { MicPassthroughMixer } from './components/MicPassthroughMixer';
import { AddMemeModal } from './components/AddMemeModal';
import { RoutingGuideModal } from './components/RoutingGuideModal';

export default function App() {
  const [customMemes, setCustomMemes] = useState<MemeSound[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MemeCategory | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Modals & Floating Window
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Audio settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(audioEngine.settings);

  // Check if browser supports documentPictureInPicture
  const canNativePiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  // Load custom memes and favorites from persistent storage
  useEffect(() => {
    async function loadData() {
      const stored = await getStoredCustomMemes();
      setCustomMemes(stored);
      setFavorites(getFavoritesFromStorage());
    }
    loadData();

    audioEngine.setOnPlayStateChange((id) => {
      setPlayingId(id);
    });
  }, []);

  // Combine default memes + custom memes
  const allMemes = useMemo(() => {
    return [...DEFAULT_MEMES, ...customMemes];
  }, [customMemes]);

  // Filter memes
  const filteredMemes = useMemo(() => {
    return allMemes.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sinhalaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.hotkey.toLowerCase() === searchQuery.toLowerCase();

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'favorites') return favorites.includes(m.id);
      if (selectedCategory === 'custom') return m.isCustom;
      return m.category === selectedCategory;
    });
  }, [allMemes, searchQuery, selectedCategory, favorites]);

  // Sound triggers
  const handlePlaySound = useCallback((meme: MemeSound) => {
    audioEngine.playSound(meme);
  }, []);

  const handleStopAll = useCallback(() => {
    audioEngine.stopAll();
  }, []);

  // Favorite toggle
  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id];
      saveFavoritesToStorage(updated);
      return updated;
    });
  }, []);

  // Save new custom meme
  const handleSaveCustomMeme = async (newMeme: MemeSound) => {
    await saveCustomMeme(newMeme);
    setCustomMemes((prev) => [...prev.filter((m) => m.id !== newMeme.id), newMeme]);
  };

  // Delete custom meme
  const handleDeleteCustomMeme = async (id: string) => {
    await deleteCustomMeme(id);
    setCustomMemes((prev) => prev.filter((m) => m.id !== id));
  };

  // Global Keyboard Hotkey Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        handleStopAll();
        return;
      }

      const pressedKey = e.key.toUpperCase();
      const matchedMeme = allMemes.find((m) => m.hotkey.toUpperCase() === pressedKey);

      if (matchedMeme) {
        e.preventDefault();
        handlePlaySound(matchedMeme);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allMemes, handlePlaySound, handleStopAll]);

  // Request Native Document Picture-in-Picture window if supported
  const handleRequestNativePiP = async () => {
    if (!canNativePiP) {
      setIsFloatingOpen(true);
      return;
    }

    try {
      // TypeScript definition for documentPictureInPicture
      const pipWindow = await (window as unknown as {
        documentPictureInPicture: {
          requestWindow: (options: { width: number; height: number }) => Promise<Window>;
        };
      }).documentPictureInPicture.requestWindow({
        width: 360,
        height: 520,
      });

      // Copy stylesheet links into PiP window
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        pipWindow.document.head.appendChild(node.cloneNode(true));
      });

      // Render mini soundboard into PiP window
      pipWindow.document.body.className = 'bg-zinc-950 text-zinc-100 p-3 select-none';
      const container = pipWindow.document.createElement('div');
      container.id = 'pip-soundboard';
      pipWindow.document.body.appendChild(container);

      const renderPiP = () => {
        container.innerHTML = `
          <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; padding-bottom: 8px;">
              <span style="font-size: 13px; font-weight: 700; color: #f97316;">FF SOUNDBOARD HUD</span>
              <button id="pip-stop" style="background: #7f1d1d; color: #fecaca; border: 1px solid #991b1b; padding: 3px 8px; font-size: 11px; font-weight: 600; border-radius: 6px; cursor: pointer;">
                STOP (ESC)
              </button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; max-height: 440px; overflow-y: auto;">
              ${allMemes
                .map(
                  (m) => `
                <button data-id="${m.id}" class="pip-btn" style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 6px 8px; text-align: left; cursor: pointer; color: #f4f4f5; display: flex; align-items: center; justify-content: space-between;">
                  <div style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <div style="font-size: 11px; font-weight: 700; color: #fff;">${m.emoji} ${m.sinhalaName}</div>
                    <div style="font-size: 9px; color: #a1a1aa;">${m.name}</div>
                  </div>
                  <span style="font-family: monospace; font-size: 10px; font-weight: 700; color: #f97316; background: #09090b; padding: 1px 4px; border-radius: 4px; margin-left: 4px;">${m.hotkey}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        `;

        pipWindow.document.getElementById('pip-stop')?.addEventListener('click', () => {
          handleStopAll();
        });

        pipWindow.document.querySelectorAll('.pip-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = (btn as HTMLElement).dataset.id;
            const target = allMemes.find((m) => m.id === id);
            if (target) handlePlaySound(target);
          });
        });
      };

      renderPiP();
    } catch {
      // Fallback to in-app overlay HUD
      setIsFloatingOpen(true);
    }
  };

  const categories: { id: MemeCategory | 'favorites'; label: string; sinhala: string }[] = [
    { id: 'all', label: 'All Sounds', sinhala: 'සියල්ල' },
    { id: 'favorites', label: 'Favorites', sinhala: 'ප්‍රියතම' },
    { id: 'trending', label: 'Trending', sinhala: 'ට්‍රෙන්ඩින්' },
    { id: 'toxic', label: 'Toxic Banter', sinhala: 'ටොක්සික්' },
    { id: 'funny', label: 'Funny LOL', sinhala: 'විකාර' },
    { id: 'hype', label: 'Booyah Hype', sinhala: 'හයිප්' },
    { id: 'sad', label: 'Clutch / Sad', sinhala: 'මෝයේ මෝයේ' },
    { id: 'squad', label: 'Squad Panic', sinhala: 'ස්කොඩ්' },
    { id: 'custom', label: 'My Memes', sinhala: 'මගේ මීම්ස්' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Zone 1, 2, 3 Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 shadow-md shadow-orange-500/20">
            <Flame className="w-5 h-5 fill-orange-500 animate-pulse" />
          </div>
          <a href="/" className="text-base sm:text-lg font-bold tracking-tight text-zinc-100 font-['Rajdhani',sans-serif] flex items-center gap-1.5">
            <span>FF MEME SOUNDBOARD</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500 text-zinc-950 font-black">
              PRO
            </span>
          </a>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-zinc-400">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`hover:text-zinc-100 transition-colors ${selectedCategory === 'all' ? 'text-orange-400' : ''}`}
          >
            All Memes ({allMemes.length})
          </button>
          <button
            onClick={() => setSelectedCategory('toxic')}
            className={`hover:text-zinc-100 transition-colors ${selectedCategory === 'toxic' ? 'text-orange-400' : ''}`}
          >
            Toxic Banter
          </button>
          <button
            onClick={() => setSelectedCategory('hype')}
            className={`hover:text-zinc-100 transition-colors ${selectedCategory === 'hype' ? 'text-orange-400' : ''}`}
          >
            Booyah &amp; Hype
          </button>
          <button
            onClick={() => setSelectedCategory('funny')}
            className={`hover:text-zinc-100 transition-colors ${selectedCategory === 'funny' ? 'text-orange-400' : ''}`}
          >
            Funny Classics
          </button>
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="hover:text-orange-300 transition-colors flex items-center gap-1"
          >
            <span>Mic Setup Guide</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Floating Window HUD Toggle Button */}
          <button
            onClick={() => setIsFloatingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="Open Floating Window Overlay over Free Fire"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="font-['Noto_Sans_Sinhala',sans-serif]">Floating Window</span>
          </button>

          {/* Add Meme Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="Add Custom Meme Audio"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Meme</span>
          </button>

          {/* Panic Stop Button */}
          {playingId && (
            <button
              onClick={handleStopAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 animate-pulse active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="Stop All Audio (ESC)"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>STOP</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Esports Gaming Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
          <div className="absolute inset-0 opacity-25 mix-blend-screen pointer-events-none">
            <img
              src="/src/assets/images/ff_soundboard_hero_1790655215334.jpg"
              alt="Free Fire Soundboard Hero"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="font-['Noto_Sans_Sinhala',sans-serif]">Free Fire Mic Meme Soundboard Pro</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">27 Authentic Presets</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-100 font-['Noto_Sans_Sinhala',sans-serif] leading-tight">
                ගේම් එක ගහන ගමන් Mic එකෙන් ටීම් එකටම මීම්ස් දාන්න!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-['Noto_Sans_Sinhala',sans-serif] leading-relaxed">
                Floating Window එක තිරය උඩ තියාගෙන හෝ Keyboard Shortcuts (1-9, Q-J) ඔබලා Free Fire Squad එකටම ඇහෙන්න ලංකාවේ සුපිරිම මීම්ස් සහ සවුන්ඩ් එෆෙක්ට්ස් යවන්න.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <button
                onClick={handleRequestNativePiP}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="font-['Noto_Sans_Sinhala',sans-serif]">Floating Window Popout</span>
              </button>

              <button
                onClick={() => setIsGuideModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm border border-zinc-700 active:scale-95 transition-all cursor-pointer"
              >
                <span className="font-['Noto_Sans_Sinhala',sans-serif]">Free Fire Setup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Mic Passthrough & Audio Booster Mixer Panel */}
        <MicPassthroughMixer
          settings={audioSettings}
          onUpdateSettings={(newSettings) => {
            audioEngine.updateSettings(newSettings);
            setAudioSettings((prev) => ({ ...prev, ...newSettings }));
          }}
          onOpenGuide={() => setIsGuideModalOpen(true)}
        />

        {/* Search, Filter Bar & View Toggles */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="සොයන්න (Search meme, Sinhala text or Hotkey e.g. '1', 'බේසම්', 'Royalty')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/80 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Mode & Quick Stats */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <span className="text-xs text-zinc-400 font-['Noto_Sans_Sinhala',sans-serif]">
                සවුන්ඩ්ස් <strong className="text-orange-400 font-mono">{filteredMemes.length}</strong> ක් හමුවිය
              </span>

              <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-zinc-800 text-orange-400 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  title="Compact List View"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'compact' ? 'bg-zinc-800 text-orange-400 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-orange-500 text-zinc-950 font-bold shadow-md shadow-orange-500/20'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80'
                  }`}
                >
                  {cat.id === 'favorites' && <Star className="w-3 h-3 fill-current" />}
                  <span className="font-['Noto_Sans_Sinhala',sans-serif]">{cat.sinhala}</span>
                  <span className="text-[11px] opacity-75 hidden sm:inline">({cat.label})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Soundboard Grid / Matrix */}
        {filteredMemes.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5'
            }
          >
            {filteredMemes.map((meme) => (
              <SoundPad
                key={meme.id}
                meme={meme}
                isPlaying={playingId === meme.id}
                isFavorite={favorites.includes(meme.id)}
                onPlay={handlePlaySound}
                onStop={handleStopAll}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteCustomMeme}
                compact={viewMode === 'compact'}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 space-y-3">
            <Volume2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-300 font-['Noto_Sans_Sinhala',sans-serif]">
              කිසිදු මීම් එකක් හමු නොවීය (No Memes Found)
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto font-['Noto_Sans_Sinhala',sans-serif]">
              වෙනත් නමක් හෝ අකුරක් යොදා සොයන්න, නැතහොත් "Add Meme" මඟින් ඔබේම අලුත් මීම් එකක් එකතු කරගන්න!
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-zinc-950 font-bold text-xs rounded-lg hover:bg-orange-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Meme</span>
            </button>
          </div>
        )}

        {/* Hotkeys Quick Reference Bar */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400 font-['Noto_Sans_Sinhala',sans-serif]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              <strong>Keyboard Hotkeys Active:</strong> ඔබ ගේම් එකේ ඉන්නකොට ඕනෑම වෙලාවක කීබෝඩ් එකේ අංක හෝ අකුරු ඔබලා ක්ෂණිකව සවුන්ඩ් එක දාන්න පුළුවන්.
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300 shrink-0 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">ESC / SPACE</span>
            <span className="text-zinc-500">= Stop All Audio</span>
          </div>
        </div>
      </main>

      {/* Floating HUD Widget Overlay (Always available in app) */}
      <FloatingWindowHUD
        isOpen={isFloatingOpen}
        onClose={() => setIsFloatingOpen(false)}
        memes={allMemes}
        playingId={playingId}
        onPlay={handlePlaySound}
        onStopAll={handleStopAll}
        onRequestNativePiP={handleRequestNativePiP}
        canNativePiP={canNativePiP}
      />

      {/* Add Meme Modal */}
      <AddMemeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveMeme={handleSaveCustomMeme}
        existingHotkeys={allMemes.map((m) => m.hotkey)}
      />

      {/* Free Fire Routing Setup Guide Modal */}
      <RoutingGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950 py-4 px-6 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-['Noto_Sans_Sinhala',sans-serif]">
          FF Meme Soundboard Pro — Built for Free Fire Gamers &amp; Squad Banter
        </p>
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <span>27 Free Fire Meme Presets</span>
          <span aria-hidden="true">·</span>
          <span>IndexedDB Persistence</span>
          <span aria-hidden="true">·</span>
          <span>Web Audio Passthrough</span>
        </div>
      </footer>
    </div>
  );
}
