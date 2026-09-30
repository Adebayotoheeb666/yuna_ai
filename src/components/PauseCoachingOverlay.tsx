import React from 'react';
import {
  Sparkles,
  Volume2,
  X,
  Mic,
  Lightbulb,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { HangulCard } from '../types/yuna';
import { koreanSpeech } from '../services/speechSynthesis';
import { soundEffects } from '../services/soundEffects';

interface PauseCoachingOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onStartSpeaking: () => void;
  targetCard?: HangulCard;
  targetPrompt?: string;
  learnerLevel?: string;
}

export const PauseCoachingOverlay: React.FC<PauseCoachingOverlayProps> = ({
  isVisible,
  onClose,
  onStartSpeaking,
  targetCard,
  targetPrompt,
  learnerLevel,
}) => {
  if (!isVisible) return null;

  const phrase = targetCard?.hangul || targetPrompt || '안녕하세요';
  const romanization = targetCard?.romanization || 'annyeonghaseyo';
  const gloss = targetCard?.englishGloss || 'Hello / Good day';

  const handleListenSlow = () => {
    soundEffects.playSyllableBlip();
    koreanSpeech.speakKorean(phrase, { rate: 0.65 });
  };

  const handlePlaySyllable = (syl: string) => {
    soundEffects.playSyllableBlip();
    koreanSpeech.speakIsolatedSyllable(syl, 0.65);
  };

  // Determine specific reading or phonetic tips based on the target phrase
  const getSpecificTip = () => {
    if (phrase.includes('ㅓ') || phrase.includes('커') || phrase.includes('점') || phrase.includes('어')) {
      return {
        title: 'Vowel Clarifier: ㅓ (eo)',
        reading: 'Drop your jaw down and keep your tongue low and flat. Avoid rounding your lips into an "oh" sound.',
        jamo: 'Consonant + ㅓ (Vertical vowel positioned on the right)',
      };
    }
    if (phrase.includes('ㅗ') || phrase.includes('코') || phrase.includes('고') || phrase.includes('오')) {
      return {
        title: 'Vowel Clarifier: ㅗ (o)',
        reading: 'Round your lips into a tight circle like blowing out a candle.',
        jamo: 'Consonant + ㅗ (Horizontal vowel positioned underneath)',
      };
    }
    if (phrase.includes('ㅡ') || phrase.includes('스') || phrase.includes('크') || phrase.includes('트')) {
      return {
        title: 'Vowel Clarifier: ㅡ (eu)',
        reading: 'Pull the corners of your mouth back in a wide horizontal smile and keep your teeth close.',
        jamo: 'Consonant + ㅡ (Horizontal vowel positioned underneath)',
      };
    }
    if (phrase.includes('는') || phrase.includes('은')) {
      return {
        title: 'Topic Particle: 은/는',
        reading: 'Attach 는 directly after vowels (저는) and 은 after consonants (학생은). No pause between the word and particle.',
        jamo: '저 + 는 = [jeo-neun]',
      };
    }
    return {
      title: 'Hangul Syllable Block Guide',
      reading: 'Every Hangul block combines an initial consonant + vowel + optional bottom consonant (받침). Read from top-to-bottom, left-to-right.',
      jamo: '초성 (Initial) + 중성 (Vowel) + 종성 (Batchim)',
    };
  };

  const tip = getSpecificTip();

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-50 max-w-xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
      role="region"
      aria-label="Real-time Hangul & Pronunciation Coaching"
    >
      <div className="bg-stone-900/95 border-2 border-amber-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300">
                Need a hint? (Paused &gt; 5s)
              </span>
              <span aria-hidden="true" className="text-stone-600 mx-1.5">·</span>
              <span className="text-[11px] text-stone-400">Hangul & Pronunciation Tip</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 transition-colors rounded-lg hover:bg-stone-800 cursor-pointer"
            aria-label="Dismiss tip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Phrase Scaffolding */}
        <div className="mt-3 flex items-center justify-between gap-3 bg-stone-950/70 p-3 rounded-xl border border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-['Noto_Sans_KR'] text-white">
                {phrase}
              </span>
              <span className="text-xs font-mono text-amber-200/90">
                {romanization}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{gloss}</p>
          </div>

          <button
            onClick={handleListenSlow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 border border-stone-700"
            title="Listen to phrase at 0.65x speed"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Hear Slow</span>
          </button>
        </div>

        {/* Syllable Buttons (if available) */}
        {targetCard?.syllableBreakdown && targetCard.syllableBreakdown.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[11px] text-stone-500 uppercase font-semibold shrink-0">
              Tap Syllables:
            </span>
            {targetCard.syllableBreakdown.map((part, idx) => (
              <button
                key={idx}
                onClick={() => handlePlaySyllable(part.syllable)}
                className="px-2 py-1 bg-stone-800 hover:bg-amber-950/60 hover:border-amber-500/40 border border-stone-700/80 rounded-md text-xs font-bold text-stone-200 font-['Noto_Sans_KR'] transition-colors cursor-pointer shrink-0"
                title={`Hear ${part.syllable} (${part.romanization})`}
              >
                {part.syllable}
              </button>
            ))}
          </div>
        )}

        {/* Pronunciation & Hangul Reading Rule */}
        <div className="mt-3 p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs">
          <div className="font-semibold text-amber-300 mb-0.5">{tip.title}</div>
          <p className="text-stone-300 leading-relaxed">{tip.reading}</p>
          <div className="mt-1 text-[11px] text-stone-400 font-mono">
            {tip.jamo}
          </div>
        </div>

        {/* Action Button: Ready to Speak */}
        <div className="mt-3 flex items-center justify-between pt-1">
          <span className="text-[11px] text-stone-400">
            You can also ask in English: "How do I say..."
          </span>

          <button
            onClick={() => {
              onClose();
              onStartSpeaking();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md hover:scale-102"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Speak with Yuna Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
