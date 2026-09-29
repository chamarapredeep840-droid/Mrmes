import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Monitor, 
  Headphones, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

interface RoutingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoutingGuideModal: React.FC<RoutingGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mobile' | 'pc' | 'discord'>('mobile');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-['Noto_Sans_Sinhala',sans-serif]">
                Free Fire එකට මීම්ස් යවන හැටි (Mic Routing Guide)
              </h2>
              <p className="text-xs text-zinc-400">
                How to play memes directly into Free Fire team voice chat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/40 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'mobile'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile (Android / iPhone)</span>
          </button>

          <button
            onClick={() => setActiveTab('pc')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'pc'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>PC Emulator (BlueStacks / LDPlayer)</span>
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'discord'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Discord / Squad Call</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-300 font-['Noto_Sans_Sinhala',sans-serif] leading-relaxed">
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>ක්‍රමය 1 (Floating Window / Pop-up View):</strong> ගේම් එක ගහන අතරතුරම මේ Soundboard එක Floating Window එකක් විදිහට තිරය උඩ තියාගෙන ක්ලික් කරලා සද්දේ යවන්න පුළුවන්!
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">Floating Window එක On කරගන්න</h4>
                    <p className="text-zinc-400 text-xs">
                      Soundboard එකේ ඉහළ ඇති <strong>"Floating HUD Overlay"</strong> බටනය ඔබන්න. නැතහොත් Android දුරකථනයේ Chrome මෙනුවෙන් <strong>Pop-up view</strong> හෝ <strong>Floating Window</strong> තෝරන්න (Samsung, Xiaomi, Vivo, Oppo දුරකථන වල Game Turbo / Sidebar මඟින්ද මෙය කළ හැක).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">Loud Blast Booster (+250%) සක්‍රිය කරන්න</h4>
                    <p className="text-zinc-400 text-xs">
                      ගේම් එකේ වෙඩි සද්ද වලට වඩා මීම් එක ටීම් එකට පැහැදිලිව ඇහෙන්න, ඉහත ඇති <strong>"Loud Blast Booster"</strong> එක On කර තබන්න.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">Free Fire Mic එක On කර Play කරන්න</h4>
                    <p className="text-zinc-400 text-xs">
                      Free Fire හි Team Mic එක On කර ඇති විට, ඔබ Floating Window එකෙන් ඕනෑම මීම් එකක් ඔබපු සැනින් එම හඬ කෙලින්ම මයික්‍රෆෝනය හරහා මුළු Squad එකටම ඇසේ!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-200">
                <p className="text-xs">
                  <strong>PC ක්‍රමය (100% Studio Digital Sound):</strong> VB-Audio Cable මඟින් මයික් එක සහ මීම් සවුන්ඩ් එක BlueStacks හෝ LDPlayer හි Free Fire වෙත 100% පැහැදිලි ඩිජිටල් ශබ්දයකින් යවන්න.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">VB-Audio Virtual Cable (නොමිලේ) ස්ථාපනය කරන්න</h4>
                    <p className="text-zinc-400 text-xs">
                      නොමිලේ ලබාගත හැකි <em>VB-Cable Virtual Audio Device</em> බාගත කර Windows වල install කරගන්න.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">Soundboard එකේ Live Mic Mixer On කරන්න</h4>
                    <p className="text-zinc-400 text-xs">
                      ඉහළ ඇති <strong>"Live Mic + Meme Passthrough"</strong> On කරන්න. එවිට ඔබ කතා කරන හඬ සහ ඔබ ඔබන මීම් එක එකට මිශ්‍ර වී Output වේ.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">BlueStacks / LDPlayer Settings හදන්න</h4>
                    <p className="text-zinc-400 text-xs">
                      Emulator එකේ <strong>Settings &gt; Audio &gt; Microphone</strong> එකට <strong>"CABLE Output (VB-Audio Virtual Cable)"</strong> තෝරන්න.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">Hotkeys (කීබෝඩ් බටන්) මඟින් ගේම් එක ඇතුලෙන්ම ප්ලේ කරන්න</h4>
                    <p className="text-zinc-400 text-xs">
                      ගේම් එක ගහන අතරතුර තිරය මාරු නොකර <strong>[1] සිට [9] දක්වා</strong> හෝ <strong>[Q], [W], [E]</strong> ආදී කීස් ඔබා සැනින් මීම්ස් වාදනය කරන්න!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discord' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-200">
                <p className="text-xs">
                  ඔබ Free Fire ගහද්දි Squad එක Discord හෝ WhatsApp කෝල් එකකින් සම්බන්ධ වෙනවා නම්, පහත පියවරෙන් සවුන්ඩ්බෝඩ් එක කෙලින්ම කෝල් එකට යැවිය හැක.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">Discord User Settings &gt; Voice &amp; Video</h4>
                    <p className="text-zinc-400 text-xs">
                      Input Device එකට CABLE Output තෝරන්න. অথবা "Stereo Mix" තෝරා Soundboard සක්‍රිය කරන්න.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-zinc-100 mb-1">Noise Suppression අක්‍රිය කරන්න (Optional)</h4>
                    <p className="text-zinc-400 text-xs">
                      Discord හි Krisp Noise Suppression මඟින් සමහර මීම්ස් වල පසුබිම් හඬ කපාහැරීම වැළැක්වීමට එය "Standard" ලෙස තබන්න.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Free Fire Gaming Soundboard Pro
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            තේරුණා (Got It)
          </button>
        </div>
      </div>
    </div>
  );
};
