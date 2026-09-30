import React from 'react';
import {
  Mic,
  BarChart3,
  Wifi,
  WifiOff,
  Cpu,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface NavbarProps {
  activeView: 'session' | 'dashboard';
  onChangeView: (view: 'session' | 'dashboard') => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  streakDays: number;
  onOpenLocalModelModal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  localModelMode: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onChangeView,
  isOffline,
  onToggleOffline,
  streakDays,
  onOpenLocalModelModal,
  isMuted,
  onToggleMute,
  localModelMode,
}) => {
  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-['Noto_Sans_KR'] text-sm">
            유나
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-100 text-sm tracking-tight">Yuna AI</span>
              <span className="text-[11px] font-medium text-amber-400/90 font-['Noto_Sans_KR']">
                한국어 튜터
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher (Segmented Control) */}
        <div className="flex items-center p-1 bg-stone-900 border border-stone-800 rounded-lg text-xs">
          <button
            onClick={() => onChangeView('session')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeView === 'session'
                ? 'bg-stone-800 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Call</span>
          </button>
          <button
            onClick={() => onChangeView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-stone-800 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex items-center gap-2">
          {/* Streak indicator (clean unboxed) */}
          <div
            className="flex items-center gap-1 text-xs text-amber-400 font-semibold px-2 py-1"
            title={`${streakDays} Day Practice Streak`}
          >
            <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span>{streakDays}d</span>
          </div>

          {/* Offline Mode Toggle Button */}
          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isOffline
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title={isOffline ? 'Offline mode active (Using local engine)' : 'Online (Gemini Cloud enabled)'}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
          </button>

          {/* Local STT Model Settings */}
          <button
            onClick={onOpenLocalModelModal}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              localModelMode === 'local_endpoint'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title="Local Speech Model Settings"
            aria-label="Local Speech Model Settings"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* Audio Chime Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title={isMuted ? 'Sound cues muted' : 'Sound cues active'}
            aria-label="Toggle Sound Cues"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
