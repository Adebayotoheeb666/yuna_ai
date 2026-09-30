import React from 'react';
import { X, CheckCircle2, Volume2, Flame, Award, ArrowRight } from 'lucide-react';
import { HangulCard, SessionHistory } from '../types/yuna';
import { koreanSpeech } from '../services/speechSynthesis';
import { soundEffects } from '../services/soundEffects';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    topic: string;
    level: string;
    turns: number;
    accuracy: number;
    phrases: Array<{ korean: string; romanization: string; english: string }>;
    notes: string;
  };
  streakDays: number;
  onContinue: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  streakDays,
  onContinue,
}) => {
  if (!isOpen) return null;

  const handlePlayPhrase = (korean: string) => {
    soundEffects.playSyllableBlip();
    koreanSpeech.speakKorean(korean, { rate: 0.85 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center pb-4 border-b border-stone-800">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Session Completed!</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Stage 5 Wrap-up: Key phrases & tutor notes
          </p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2 my-4 text-center">
          <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 block">Topic</span>
            <span className="text-xs font-bold text-stone-200 truncate block mt-0.5">
              {sessionData.topic}
            </span>
          </div>
          <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 block">Pronunciation</span>
            <span className="text-sm font-bold text-emerald-400 block mt-0.5">
              {sessionData.accuracy}%
            </span>
          </div>
          <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 block">Streak</span>
            <span className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              {streakDays} Days
            </span>
          </div>
        </div>

        {/* Key Phrases Recap */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            3–5 Key Spoken Phrases
          </h3>
          <div className="space-y-2">
            {sessionData.phrases.map((phrase, idx) => (
              <div
                key={idx}
                className="bg-stone-950/80 border border-stone-800/80 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white font-['Noto_Sans_KR']">
                      {phrase.korean}
                    </span>
                    <button
                      onClick={() => handlePlayPhrase(phrase.korean)}
                      className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Listen"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs font-mono text-amber-200/80">{phrase.romanization}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{phrase.english}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Notes */}
        {sessionData.notes && (
          <div className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl mb-4 text-xs text-stone-400">
            <span className="font-semibold text-stone-300 block mb-0.5">Yuna's Note:</span>
            <span>{sessionData.notes}</span>
          </div>
        )}

        {/* Continue Action */}
        <button
          onClick={() => {
            onContinue();
            onClose();
          }}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all cursor-pointer text-sm shadow-md flex items-center justify-center gap-2"
        >
          <span>Continue to Progress Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
