import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Mic, 
  Play, 
  Square, 
  Sparkles, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { MemeSound, MemeCategory } from '../types/soundboard';
import { fileToDataUri } from '../services/soundStorage';

interface AddMemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeme: (meme: MemeSound) => Promise<void>;
  existingHotkeys: string[];
}

export const AddMemeModal: React.FC<AddMemeModalProps> = ({
  isOpen,
  onClose,
  onSaveMeme,
  existingHotkeys,
}) => {
  const [tab, setTab] = useState<'upload' | 'record'>('upload');
  const [name, setName] = useState('');
  const [sinhalaName, setSinhalaName] = useState('');
  const [category, setCategory] = useState<MemeCategory>('custom');
  const [emoji, setEmoji] = useState('🔥');
  const [hotkey, setHotkey] = useState('');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Suggested emojis
  const quickEmojis = ['🔥', '😂', '💀', '😱', '👑', '💣', '🤡', '⚡', '🗿', '📢', '🩸', '🎯'];

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|webm)$/i)) {
      setErrorMsg('කරුණාකර audio file එකක් (MP3, WAV, M4A, OGG) තෝරන්න.');
      return;
    }

    try {
      const dataUri = await fileToDataUri(file);
      setAudioDataUri(dataUri);
      setAudioFileName(file.name);
      if (!name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setName(cleanName);
        if (!sinhalaName) setSinhalaName(cleanName);
      }
    } catch {
      setErrorMsg('File එක කියවීමේදී දෝෂයක් සිදුවිය.');
    }
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const dataUri = await fileToDataUri(blob);
        setAudioDataUri(dataUri);
        setAudioFileName(`Recorded_Voice_${new Date().toLocaleTimeString()}.webm`);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMsg('Microphone එක access කිරීමට අවසර ලබා දෙන්න.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePreview = () => {
    if (!audioDataUri) return;
    if (isPlayingPreview && previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setIsPlayingPreview(false);
    } else {
      const audio = new Audio(audioDataUri);
      audio.onended = () => setIsPlayingPreview(false);
      audio.play();
      setPreviewAudio(audio);
      setIsPlayingPreview(true);
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('කරුණාකර නම ඇතුලත් කරන්න (Name is required)');
      return;
    }
    if (!audioDataUri) {
      setErrorMsg('කරුණාකර Audio file එකක් upload කරන්න හෝ Record කරන්න');
      return;
    }

    // Determine hotkey
    let finalHotkey = hotkey.trim().toUpperCase();
    if (!finalHotkey) {
      // Pick first free letter
      const alphabet = 'KLZXCVBNM';
      for (const char of alphabet) {
        if (!existingHotkeys.includes(char)) {
          finalHotkey = char;
          break;
        }
      }
      if (!finalHotkey) finalHotkey = 'K';
    }

    const newMeme: MemeSound = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      sinhalaName: sinhalaName.trim() || name.trim(),
      category: category,
      emoji: emoji || '🎵',
      hotkey: finalHotkey,
      audioDataUri: audioDataUri,
      isCustom: true,
      color: 'from-orange-500/20 to-amber-600/10',
      playCount: 0,
    };

    setIsSaving(true);
    try {
      await onSaveMeme(newMeme);
      if (previewAudio) previewAudio.pause();
      onClose();
    } catch {
      setErrorMsg('Meme එක save කිරීමේදී දෝෂයක් සිදුවිය.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 font-['Noto_Sans_Sinhala',sans-serif]">
                අලුත් මීම් එකක් එකතු කරන්න (Add Meme)
              </h2>
              <p className="text-xs text-zinc-400">Add custom audio or record voice line for Free Fire</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Upload vs Record */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/40 p-1.5 gap-1.5">
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'upload'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Audio File (MP3/WAV)</span>
          </button>

          <button
            onClick={() => setTab('record')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'record'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Record Mic Voice</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Audio Source Input */}
          {tab === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Audio File තෝරන්න (MP3, WAV, M4A, OGG)
              </label>
              <div className="relative border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-xl p-5 text-center transition-colors bg-zinc-900/30">
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-300 font-medium">
                  {audioFileName ? audioFileName : 'Click to select audio file or drag & drop'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Supports any music or voice clip</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                මයික්‍රෆෝනයෙන් හඬ පටිගත කරන්න (Record Live Voice)
              </label>
              <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40 flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/30 active:scale-95 transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Recording</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-red-500 text-red-400 font-bold text-xs rounded-xl animate-pulse active:scale-95 transition-all"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop Recording ({recordingSeconds}s)</span>
                    </button>
                  )}
                </div>
                {audioFileName && (
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ✓ Voice recorded ({audioFileName})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Audio Preview if loaded */}
          {audioDataUri && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePreview}
                  className="p-2 rounded-lg bg-orange-500 text-zinc-950 font-bold hover:bg-orange-400 transition-colors"
                >
                  {isPlayingPreview ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                </button>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Audio Preview</p>
                  <p className="text-[10px] text-zinc-400">Click to listen before saving</p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          )}

          {/* Name & Sinhala Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                නම (English / Display Name) *
              </label>
              <input
                type="text"
                placeholder="e.g. Squad Wipe Scream"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                සිංහල ලේබලය (Sinhala Name)
              </label>
              <input
                type="text"
                placeholder="e.g. මගේ අලුත් මීම් එක"
                value={sinhalaName}
                onChange={(e) => setSinhalaName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-['Noto_Sans_Sinhala',sans-serif] focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Emoji & Hotkey & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Emoji Icon</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={2}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-12 text-center text-lg bg-zinc-900 border border-zinc-800 rounded-lg py-1 focus:outline-none focus:border-orange-500"
                />
                <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
                  {quickEmojis.slice(0, 5).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className="p-1 hover:bg-zinc-800 rounded text-base cursor-pointer"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Hotkey (කීබෝඩ් බටනය)
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="e.g. K"
                value={hotkey}
                onChange={(e) => setHotkey(e.target.value.toUpperCase())}
                className="w-full uppercase font-mono text-center font-bold bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-orange-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MemeCategory)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
              >
                <option value="custom">Custom (මගේ)</option>
                <option value="trending">Trending</option>
                <option value="toxic">Toxic / Banter</option>
                <option value="funny">Funny</option>
                <option value="hype">Hype / Booyah</option>
                <option value="squad">Squad Callout</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-lg shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Meme එක Save කරන්න'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
