import React from 'react';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';
import { HangulCard } from '../types/yuna';
import { koreanSpeech } from '../services/speechSynthesis';
import { soundEffects } from '../services/soundEffects';

interface HangulCardViewProps {
  card: HangulCard;
  speechLevel?: string;
  speechLevelExplanation?: string;
  showRomanization: boolean;
  onToggleRomanization?: () => void;
  grammarNote?: string;
  correctionRecast?: string;
}

export const HangulCardView: React.FC<HangulCardViewProps> = ({
  card,
  speechLevel,
  speechLevelExplanation,
  showRomanization,
  onToggleRomanization,
  grammarNote,
  correctionRecast,
}) => {
  const handlePlayFull = () => {
    soundEffects.playSyllableBlip();
    koreanSpeech.speakKorean(card.hangul, { rate: 0.85 });
  };

  const handleSyllableClick = (syllable: string) => {
    soundEffects.playSyllableBlip();
    koreanSpeech.speakIsolatedSyllable(syllable, 0.7);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm transition-all duration-200">
      {/* Speech Level & Romanization Toggle Header */}
      <div className="flex items-center justify-between text-xs text-stone-400 mb-3 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-amber-400">{speechLevel || '존댓말 (Polite 요-form)'}</span>
          {speechLevelExplanation && (
            <>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="text-stone-400 truncate max-w-xs">{speechLevelExplanation}</span>
            </>
          )}
        </div>

        {onToggleRomanization && (
          <button
            onClick={onToggleRomanization}
            className="text-stone-400 hover:text-stone-200 transition-colors text-xs font-medium cursor-pointer"
            title="Toggle Romanization training wheels"
          >
            {showRomanization ? 'Hide Romanization' : 'Show Romanization'}
          </button>
        )}
      </div>

      {/* Main Spoken Hangul Focus */}
      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Noto_Sans_KR',sans-serif]">
            {card.hangul}
          </h2>
          <button
            onClick={handlePlayFull}
            className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-800/80 rounded-full transition-colors cursor-pointer"
            title="Listen to phrase (Standard Korean)"
            aria-label="Listen to phrase"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {showRomanization && (
          <p className="text-sm font-mono text-amber-200/80 tracking-wide mt-1.5">
            {card.romanization}
          </p>
        )}

        <p className="text-base text-stone-300 font-medium mt-1">
          {card.englishGloss}
        </p>
      </div>

      {/* Syllable Breakdown with Sound Isolation */}
      {card.syllableBreakdown && card.syllableBreakdown.length > 0 && (
        <div className="mt-4 pt-3 border-t border-stone-800/60">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
            <span className="uppercase tracking-wider font-semibold text-[11px] text-stone-400">
              Syllables (Tap to isolate sound)
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {card.syllableBreakdown.map((part, idx) => (
              <button
                key={idx}
                onClick={() => handleSyllableClick(part.syllable)}
                className="group flex flex-col items-center px-3 py-1.5 bg-stone-800/80 hover:bg-amber-950/40 hover:border-amber-500/40 border border-stone-700/60 rounded-xl transition-all cursor-pointer text-center"
                title={part.tip || `Tap to hear ${part.syllable}`}
              >
                <span className="text-lg font-bold text-stone-100 group-hover:text-amber-300 font-['Noto_Sans_KR']">
                  {part.syllable}
                </span>
                {showRomanization && (
                  <span className="text-[11px] font-mono text-stone-400 group-hover:text-amber-200">
                    {part.romanization}
                  </span>
                )}
                {part.tip && (
                  <span className="text-[10px] text-stone-400 max-w-[80px] truncate mt-0.5">
                    {part.tip}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gentle Recast Note */}
      {correctionRecast && (
        <div className="mt-3.5 p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Natural Recast: </span>
            <span>{correctionRecast}</span>
          </div>
        </div>
      )}

      {/* Grammar / Particle Highlight */}
      {grammarNote && (
        <div className="mt-2.5 p-2.5 bg-stone-800/40 border border-stone-700/40 rounded-xl flex items-start gap-2 text-xs text-stone-300">
          <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-stone-200">Grammar Focus: </span>
            <span className="text-stone-300">{grammarNote}</span>
          </div>
        </div>
      )}
    </div>
  );
};
