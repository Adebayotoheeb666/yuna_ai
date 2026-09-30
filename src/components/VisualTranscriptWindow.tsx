import React, { useRef, useEffect, useState } from 'react';
import { Volume2, ChevronDown, ChevronUp, MessageSquare, History } from 'lucide-react';
import { ChatMessage } from '../types/yuna';
import { soundEffects } from '../services/soundEffects';

interface VisualTranscriptWindowProps {
  messages: ChatMessage[];
  onReplayTurn: (koreanText: string) => void;
  showRomanization?: boolean;
  maxTurns?: number;
}

export const VisualTranscriptWindow: React.FC<VisualTranscriptWindowProps> = ({
  messages,
  onReplayTurn,
  showRomanization = true,
  maxTurns = 3,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Take the last 3 turns
  const displayTurns = messages.slice(-maxTurns);

  // Auto-scroll to bottom when new turns arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto my-2 border border-stone-800 bg-stone-900/90 rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-stone-950/70 border-b border-stone-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
            <History className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-stone-200">Conversation Transcript</span>
            <span aria-hidden="true" className="text-stone-600 mx-1.5">·</span>
            <span className="text-[11px] text-stone-400">Last {Math.min(messages.length, maxTurns)} turns</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-500 hidden sm:inline">
            Scroll up to review missed words
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse transcript' : 'Expand transcript'}
            aria-label={isExpanded ? 'Collapse transcript' : 'Expand transcript'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Scrollable Transcript List */}
      {isExpanded && (
        <div
          ref={scrollContainerRef}
          className="max-h-48 overflow-y-auto p-3 space-y-2.5 divide-y divide-stone-800/50 text-xs"
          role="region"
          aria-label="Recent conversation history"
        >
          {displayTurns.map((msg, idx) => {
            const isTutor = msg.role === 'tutor';
            const tutorData = msg.tutorData;

            return (
              <div
                key={msg.id || idx}
                className={`pt-2.5 first:pt-0 flex flex-col gap-1 transition-colors`}
              >
                {/* Speaker Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold ${
                        isTutor ? 'text-amber-400' : 'text-sky-400'
                      }`}
                    >
                      {isTutor ? '유나 (Yuna)' : 'You (나)'}
                    </span>

                    {isTutor && tutorData?.speechLevel && (
                      <>
                        <span aria-hidden="true" className="text-stone-600">·</span>
                        <span className="text-[10px] text-stone-400">
                          {tutorData.speechLevel}
                        </span>
                      </>
                    )}

                    {!isTutor && msg.pronunciationScore !== undefined && (
                      <>
                        <span aria-hidden="true" className="text-stone-600">·</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            msg.pronunciationScore >= 85
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {msg.pronunciationScore}% pronunciation
                        </span>
                      </>
                    )}
                  </div>

                  {/* Audio Replay for Tutor Korean */}
                  {isTutor && tutorData?.spokenKorean && (
                    <button
                      onClick={() => {
                        soundEffects.playSyllableBlip();
                        onReplayTurn(tutorData.spokenKorean);
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition-colors text-[10px] cursor-pointer"
                      title="Replay this sentence"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay</span>
                    </button>
                  )}
                </div>

                {/* Korean Spoken Content */}
                {isTutor && tutorData ? (
                  <div className="pl-1">
                    <p className="text-sm font-bold text-stone-100 font-['Noto_Sans_KR'] leading-snug">
                      "{tutorData.spokenKorean}"
                    </p>

                    {showRomanization && tutorData.hangulCard?.romanization && (
                      <p className="text-[11px] font-mono text-amber-200/80 mt-0.5">
                        {tutorData.hangulCard.romanization}
                      </p>
                    )}

                    {tutorData.spokenEnglishTranslation && (
                      <p className="text-xs text-stone-400 mt-0.5 italic">
                        {tutorData.spokenEnglishTranslation}
                      </p>
                    )}

                    {tutorData.directAnswerToUser && (
                      <p className="text-[11px] text-amber-300/90 mt-0.5">
                        💡 {tutorData.directAnswerToUser}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="pl-1">
                    <p className="text-sm font-medium text-stone-200 font-['Noto_Sans_KR'] leading-snug">
                      "{msg.learnerText}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
