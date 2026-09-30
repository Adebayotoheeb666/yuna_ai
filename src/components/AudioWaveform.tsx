import React, { useMemo } from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface AudioWaveformProps {
  isActive: boolean;
  audioLevel?: number; // 0 to 1
  frequencyData?: Uint8Array | null;
  mode: 'listening' | 'speaking' | 'idle';
  barCount?: number;
  showLabels?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  audioLevel = 0,
  frequencyData = null,
  mode,
  barCount = 28,
  showLabels = true,
}) => {
  // Extract frequency amplitudes for each bar if frequencyData is available,
  // or dynamically simulate realistic voice acoustic curves based on audioLevel.
  const bars = useMemo(() => {
    const arr = [];
    const step = frequencyData ? Math.floor(frequencyData.length / barCount) : 1;

    for (let i = 0; i < barCount; i++) {
      let rawVal = 0;
      if (frequencyData && frequencyData.length > 0) {
        // Average a small window of frequencies for this bar
        let subSum = 0;
        const subCount = Math.max(1, Math.min(step, frequencyData.length - i * step));
        for (let j = 0; j < subCount; j++) {
          subSum += frequencyData[i * step + j] || 0;
        }
        rawVal = (subSum / subCount) / 255;
      }

      // Voice harmonic shaping: human speech peaks in low-mid range (bars 4-18)
      const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
      const voiceWeight = 1 - centerDist * 0.45;

      // Base height
      let finalAmp = 0.08;
      if (isActive && mode === 'listening') {
        const inputSignal = Math.max(rawVal, audioLevel * voiceWeight);
        finalAmp = 0.12 + Math.min(0.88, inputSignal * 1.25);
      } else if (isActive && mode === 'speaking') {
        const wave = Math.sin((i + Date.now() / 180) * 0.55);
        finalAmp = 0.18 + Math.abs(wave) * 0.55;
      }

      arr.push(finalAmp);
    }
    return arr;
  }, [barCount, frequencyData, audioLevel, isActive, mode]);

  // Decibel level approximation for visual feedback
  const dbApprox = useMemo(() => {
    if (!isActive || mode !== 'listening') return '-∞ dB';
    const db = Math.round(20 * Math.log10(Math.max(0.01, audioLevel)));
    return `${Math.max(-48, Math.min(0, db))} dB`;
  }, [audioLevel, isActive, mode]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Real-time Status Badge */}
      {showLabels && (
        <div className="flex items-center justify-between w-full max-w-sm px-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            {mode === 'listening' ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-semibold tracking-wide">
                  Listening to your voice
                </span>
              </>
            ) : mode === 'speaking' ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-rose-400 font-semibold tracking-wide">
                  Yuna speaking
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-stone-600"></span>
                <span className="text-stone-400">Microphone ready</span>
              </>
            )}
          </div>

          <div className="text-[11px] font-mono text-stone-400">
            {mode === 'listening' ? (
              <span className="text-emerald-400 font-medium">{dbApprox}</span>
            ) : (
              <span>Standard Korean</span>
            )}
          </div>
        </div>
      )}

      {/* Waveform Visualizer Display Container */}
      <div
        className={`w-full max-w-sm h-16 px-3 py-2 rounded-2xl border transition-all duration-300 flex items-center justify-center gap-1 overflow-hidden ${
          mode === 'listening'
            ? 'bg-stone-900/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
            : mode === 'speaking'
            ? 'bg-stone-900/90 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20'
            : 'bg-stone-900/40 border-stone-800'
        }`}
        aria-label="Real-time Microphone Waveform Visualizer"
      >
        {bars.map((amp, idx) => {
          // Height between 4px and 48px
          const barHeight = Math.max(4, Math.round(amp * 48));

          // Color palette mapped to frequency and mode
          let bgClass = 'bg-stone-700/60';
          if (mode === 'listening') {
            if (audioLevel > 0.4) {
              bgClass = 'bg-gradient-to-t from-emerald-500 to-amber-400';
            } else if (audioLevel > 0.15) {
              bgClass = 'bg-emerald-400';
            } else {
              bgClass = 'bg-emerald-500/70';
            }
          } else if (mode === 'speaking') {
            bgClass = 'bg-gradient-to-t from-rose-500 to-amber-300';
          }

          return (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-75 ${bgClass}`}
              style={{
                height: `${barHeight}px`,
                opacity: isActive ? 0.4 + amp * 0.6 : 0.25,
              }}
            />
          );
        })}
      </div>

      {/* Sensitivity feedback meter */}
      {mode === 'listening' && (
        <div className="w-full max-w-sm px-3 mt-1.5 flex items-center justify-between text-[10px] text-stone-500 font-mono">
          <span>Mic Sensitivity</span>
          <div className="w-24 bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.round(audioLevel * 100))}%` }}
            />
          </div>
          <span>{Math.round(audioLevel * 100)}%</span>
        </div>
      )}
    </div>
  );
};
