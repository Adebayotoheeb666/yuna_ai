import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Send,
  MessageSquare,
  Sliders,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ChatMessage,
  LearnerProfile,
  LocalModelConfig,
  PracticeLesson,
  SessionStage,
  TutorResponse,
} from '../types/yuna';
import { HangulCardView } from './HangulCardView';
import { AudioWaveform } from './AudioWaveform';
import { PauseCoachingOverlay } from './PauseCoachingOverlay';
import { VisualTranscriptWindow } from './VisualTranscriptWindow';
import { koreanSpeech } from '../services/speechSynthesis';
import { speechRecognition } from '../services/speechRecognition';
import { soundEffects } from '../services/soundEffects';
import { getOfflineTutorResponse, analyzeKoreanPronunciation } from '../services/offlineTutorEngine';
import { addLearnedVocab, recordSpokenTurn, unlockMilestone } from '../services/storage';

interface VoiceSessionViewProps {
  profile: LearnerProfile;
  localModelConfig: LocalModelConfig;
  isOffline: boolean;
  activeLesson: PracticeLesson;
  onSessionComplete?: (sessionData: any) => void;
  onOpenLessonPicker: () => void;
  onOpenLocalModelModal: () => void;
  onUpdateProfile: (p: LearnerProfile) => void;
}

export const VoiceSessionView: React.FC<VoiceSessionViewProps> = ({
  profile,
  localModelConfig,
  isOffline,
  activeLesson,
  onSessionComplete,
  onOpenLessonPicker,
  onOpenLocalModelModal,
  onUpdateProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTutorData, setCurrentTutorData] = useState<TutorResponse | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [currentStage, setCurrentStage] = useState<SessionStage>(activeLesson.stage || 'warmup');
  const [turnCount, setTurnCount] = useState(0);
  const [isLoadingNextTurn, setIsLoadingNextTurn] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('Connecting with Yuna...');
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(true);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const [inputLanguage, setInputLanguage] = useState<'ko-KR' | 'en-US'>('ko-KR');

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnsRef = useRef(turnCount);
  turnsRef.current = turnCount;

  const resetPauseTimer = () => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  const startPauseTimer = () => {
    resetPauseTimer();
    pauseTimerRef.current = setTimeout(() => {
      setShowPauseOverlay(true);
    }, 5000); // 5-second silence trigger
  };

  // Initialize session with Yuna's first spoken turn
  useEffect(() => {
    startInitialTurn();
    return () => {
      resetPauseTimer();
      koreanSpeech.stop();
      speechRecognition.stopListening();
    };
  }, [activeLesson.id]);

  const startInitialTurn = async () => {
    setIsLoadingNextTurn(true);
    setStatusMessage('Yuna is preparing the lesson...');

    if (isOffline) {
      const offlineResp = getOfflineTutorResponse(activeLesson.id, '', currentStage, 0);
      deliverTutorTurn(offlineResp);
      setIsLoadingNextTurn(false);
      return;
    }

    try {
      const res = await fetch('/api/yuna/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          userProfile: profile,
          sessionStage: activeLesson.stage || 'warmup',
          topic: activeLesson.title,
          userSpokenInput: '',
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned ' + res.status);
      }

      const tutorData: TutorResponse = await res.json();
      deliverTutorTurn(tutorData);
    } catch (err) {
      console.warn('Online chat failed, activating offline lesson engine:', err);
      const offlineResp = getOfflineTutorResponse(activeLesson.id, '', currentStage, 0);
      deliverTutorTurn(offlineResp);
    } finally {
      setIsLoadingNextTurn(false);
    }
  };

  const deliverTutorTurn = (tutorData: TutorResponse) => {
    setCurrentTutorData(tutorData);
    setCurrentStage(tutorData.sessionStage || currentStage);

    // Track vocabulary
    if (tutorData.newVocabulary && tutorData.newVocabulary.length > 0) {
      addLearnedVocab(tutorData.newVocabulary);
    }

    // Check milestone trigger
    if (tutorData.milestoneUnlocked) {
      const unlocked = unlockMilestone(tutorData.milestoneUnlocked);
      if (unlocked) {
        soundEffects.playSuccessChime();
      }
    }

    // Append to messages
    const tutorMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'tutor',
      timestamp: Date.now(),
      tutorData,
      isOffline,
    };
    setMessages((prev) => [...prev, tutorMsg]);

    // Speak Korean via TTS
    soundEffects.playTutorTurnStart();
    setIsTutorSpeaking(true);
    setStatusMessage('Yuna is speaking...');

    koreanSpeech.speakKorean(
      tutorData.spokenKorean,
      {
        rate: profile.audioSpeed,
        onStart: () => {
          resetPauseTimer();
          setShowPauseOverlay(false);
          setIsTutorSpeaking(true);
        },
        onEnd: () => {
          setIsTutorSpeaking(false);
          setStatusMessage(
            inputLanguage === 'en-US'
              ? 'Ask your question in English or speak Korean...'
              : 'Your turn to speak in Korean!'
          );
          startPauseTimer();
        },
        onError: () => {
          setIsTutorSpeaking(false);
          startPauseTimer();
        },
      },
      isOffline
    );
  };

  const handleStartListening = async () => {
    resetPauseTimer();
    setShowPauseOverlay(false);

    if (isTutorSpeaking) {
      koreanSpeech.stop();
      setIsTutorSpeaking(false);
    }

    soundEffects.playListeningStart();
    setIsListening(true);
    setInterimTranscript('');
    setStatusMessage(
      inputLanguage === 'en-US'
        ? 'Listening to your English question...'
        : 'Listening to your spoken Korean...'
    );

    try {
      await speechRecognition.startListening(
        localModelConfig,
        {
          onResult: (transcript, isFinal) => {
            setInterimTranscript(transcript);
            if (isFinal && transcript.trim()) {
              handleLearnerSpokenSubmission(transcript.trim());
            }
          },
          onError: (err) => {
            console.warn('Speech error:', err);
            setIsListening(false);
            setStatusMessage('Microphone idle. Tap to try again or type.');
            startPauseTimer();
          },
          onAudioLevel: (level) => {
            setAudioLevel(level);
          },
          onFrequencyData: (data) => {
            setFrequencyData(data);
          },
          onEnd: () => {
            setIsListening(false);
            setAudioLevel(0);
            setFrequencyData(null);
          },
        },
        inputLanguage
      );
    } catch (err: any) {
      setIsListening(false);
      setAudioLevel(0);
      setFrequencyData(null);
      setStatusMessage('Could not access microphone.');
      startPauseTimer();
    }
  };

  const handleStopListening = () => {
    soundEffects.playListeningStop();
    speechRecognition.stopListening();
    setIsListening(false);
    setAudioLevel(0);
    setFrequencyData(null);

    if (interimTranscript.trim()) {
      handleLearnerSpokenSubmission(interimTranscript.trim());
    } else {
      setStatusMessage('No speech detected. Speak clearly into the mic!');
      startPauseTimer();
    }
  };

  const handleLearnerSpokenSubmission = async (spokenText: string) => {
    resetPauseTimer();
    setShowPauseOverlay(false);
    setIsListening(false);
    setAudioLevel(0);
    setFrequencyData(null);
    speechRecognition.stopListening();

    // Analyze pronunciation against target if card is present
    let score = 88;
    if (currentTutorData?.hangulCard?.hangul) {
      const analysis = analyzeKoreanPronunciation(
        currentTutorData.hangulCard.hangul,
        spokenText
      );
      score = analysis.score;
      setPronunciationScore(score);
      if (score >= 85) {
        soundEffects.playSuccessChime();
      } else {
        soundEffects.playRecastChime();
      }
    }

    // Record turn to dashboard statistics
    recordSpokenTurn(15, score);

    // Save learner message
    const learnerMsg: ChatMessage = {
      id: `learner_${Date.now()}`,
      role: 'learner',
      timestamp: Date.now(),
      learnerText: spokenText,
      pronunciationScore: score,
    };
    setMessages((prev) => [...prev, learnerMsg]);

    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);
    setIsLoadingNextTurn(true);
    setStatusMessage('Yuna is listening and reflecting...');

    // Progress through session stages if turns reach threshold
    let nextStage = currentStage;
    if (newTurnCount >= 6) {
      nextStage = 'wrap_up';
    } else if (newTurnCount >= 4) {
      nextStage = 'free_conversation';
    } else if (newTurnCount >= 2) {
      nextStage = 'guided_practice';
    }

    if (isOffline) {
      setTimeout(() => {
        const offlineResp = getOfflineTutorResponse(
          activeLesson.id,
          spokenText,
          nextStage,
          newTurnCount
        );
        deliverTutorTurn(offlineResp);
        setIsLoadingNextTurn(false);
      }, 400);
      return;
    }

    try {
      const historyPayload = messages.concat(learnerMsg).slice(-6).map((m) => ({
        role: m.role,
        content: m.role === 'tutor' ? m.tutorData?.spokenKorean || '' : m.learnerText || '',
      }));

      const res = await fetch('/api/yuna/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          userProfile: profile,
          sessionStage: nextStage,
          topic: activeLesson.title,
          userSpokenInput: spokenText,
        }),
      });

      if (!res.ok) throw new Error('API request failed');
      const tutorData: TutorResponse = await res.json();
      deliverTutorTurn(tutorData);
    } catch (err) {
      console.warn('API chat error, falling back to offline tutor:', err);
      const offlineResp = getOfflineTutorResponse(
        activeLesson.id,
        spokenText,
        nextStage,
        newTurnCount
      );
      deliverTutorTurn(offlineResp);
    } finally {
      setIsLoadingNextTurn(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTextInput('');
    handleLearnerSpokenSubmission(text);
  };

  const handleReplayTutorAudio = () => {
    if (currentTutorData?.spokenKorean) {
      koreanSpeech.speakKorean(
        currentTutorData.spokenKorean,
        {
          rate: profile.audioSpeed,
          onStart: () => setIsTutorSpeaking(true),
          onEnd: () => setIsTutorSpeaking(false),
        },
        isOffline
      );
    }
  };

  const stageNames: { [key in SessionStage]: string } = {
    warmup: '1. Warm-up',
    new_material: '2. New Material',
    guided_practice: '3. Guided Drill',
    free_conversation: '4. Free Roleplay',
    wrap_up: '5. Wrap-up',
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-3">
      {/* Session Progress Stepper */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-3 mb-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(['warmup', 'new_material', 'guided_practice', 'free_conversation', 'wrap_up'] as SessionStage[]).map(
            (stage, idx) => {
              const isCurrent = currentStage === stage;
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    isCurrent
                      ? 'bg-amber-950/60 text-amber-300 font-semibold border border-amber-800/50'
                      : 'text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <span>{stageNames[stage]}</span>
                  {idx < 4 && <span aria-hidden="true" className="text-stone-600 ml-1">→</span>}
                </div>
              );
            }
          )}
        </div>

        <button
          onClick={onOpenLessonPicker}
          className="text-stone-400 hover:text-stone-200 transition-colors text-xs font-medium cursor-pointer shrink-0"
        >
          Change Topic
        </button>
      </div>

      {/* Main Voice Presence: Yuna Avatar & Live Speech Waveform */}
      <div className="flex flex-col items-center justify-center my-auto py-2 text-center">
        {/* Yuna Portrait Indicator */}
        <div className="relative mb-3">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
              isTutorSpeaking
                ? 'ring-4 ring-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.35)] scale-105'
                : isListening
                ? 'ring-4 ring-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                : 'ring-2 ring-stone-700/60'
            }`}
          >
            {/* Friendly Stylized Yuna Avatar representation */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-stone-800 to-stone-900 flex flex-col items-center justify-center overflow-hidden border border-stone-700/50">
              <span className="text-3xl font-bold font-['Noto_Sans_KR'] text-amber-300">유나</span>
              <span className="text-[11px] font-medium text-stone-400 mt-0.5">Yuna Tutor</span>
            </div>
          </div>

          {/* Audio Speaking Waves Animation */}
          {isTutorSpeaking && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
          )}
        </div>

        {/* Current Spoken Korean Line from Yuna */}
        {currentTutorData && (
          <div className="max-w-xl mx-auto px-4 mb-2">
            <p className="text-xl sm:text-2xl font-bold text-stone-100 font-['Noto_Sans_KR'] leading-relaxed">
              "{currentTutorData.spokenKorean}"
            </p>

            {showEnglishTranslation && (
              <p className="text-sm text-stone-400 mt-1 italic">
                {currentTutorData.spokenEnglishTranslation}
              </p>
            )}

            {/* Direct Answer / Responsive Scaffolding */}
            {currentTutorData.directAnswerToUser && (
              <div className="max-w-md mx-auto my-2 p-2.5 bg-stone-900/90 border border-amber-500/40 rounded-xl text-left text-xs text-stone-200">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-0.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {currentTutorData.detectedLanguage === 'English'
                      ? 'Answering your question:'
                      : 'Responding to your statement:'}
                  </span>
                </div>
                <p className="text-stone-300">{currentTutorData.directAnswerToUser}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-stone-500">
              <button
                onClick={handleReplayTutorAudio}
                className="flex items-center gap-1 hover:text-stone-300 transition-colors cursor-pointer"
                title="Replay Yuna's voice"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Listen Again</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setShowEnglishTranslation(!showEnglishTranslation)}
                className="hover:text-stone-300 transition-colors cursor-pointer"
              >
                {showEnglishTranslation ? 'Hide Translation' : 'Show Translation'}
              </button>
              <span>·</span>
              <span>Speed: {profile.audioSpeed}x</span>
            </div>
          </div>
        )}

        {/* Real-time Audio Waveform Visualizer */}
        <div className="w-full max-w-sm my-2">
          <AudioWaveform
            isActive={isListening || isTutorSpeaking}
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            mode={isListening ? 'listening' : isTutorSpeaking ? 'speaking' : 'idle'}
          />
        </div>

        {/* Status Callout */}
        <p className="text-xs text-stone-400 mb-2 font-medium tracking-wide">
          {statusMessage}
        </p>

        {/* Spoken Hangul Glanceable Card */}
        {currentTutorData?.hangulCard && (
          <div className="w-full mt-1 mb-3">
            <HangulCardView
              card={currentTutorData.hangulCard}
              speechLevel={currentTutorData.speechLevel}
              speechLevelExplanation={currentTutorData.speechLevelExplanation}
              showRomanization={profile.showRomanization}
              onToggleRomanization={() =>
                onUpdateProfile({ ...profile, showRomanization: !profile.showRomanization })
              }
              grammarNote={currentTutorData.grammarNote}
              correctionRecast={currentTutorData.correctionRecast}
            />
          </div>
        )}

        {/* Learner Prompt Banner */}
        {currentTutorData?.learnerPrompt && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-900/80 border border-stone-800 rounded-full text-xs text-stone-300 mb-3">
            <span className="font-semibold text-amber-400">Your Goal:</span>
            <span>{currentTutorData.learnerPrompt}</span>
          </div>
        )}

        {/* Pronunciation Feedback Pill-free Callout */}
        {currentTutorData?.pronunciationFeedback?.hasFeedback && (
          <div className="max-w-md mx-auto mb-3 p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-left text-xs text-amber-200">
            <div className="flex items-center justify-between font-semibold text-amber-300 mb-1">
              <span>Pronunciation Coach</span>
              {currentTutorData.pronunciationFeedback.isolatedSyllable && (
                <button
                  onClick={() =>
                    koreanSpeech.speakIsolatedSyllable(
                      currentTutorData.pronunciationFeedback!.isolatedSyllable!,
                      0.65
                    )
                  }
                  className="flex items-center gap-1 text-[11px] bg-amber-900/60 hover:bg-amber-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Hear [{currentTutorData.pronunciationFeedback.isolatedSyllable}]</span>
                </button>
              )}
            </div>
            <p className="text-stone-300">{currentTutorData.pronunciationFeedback.coachingTip}</p>
          </div>
        )}

        {/* Visual Transcript Window: Last 3 Turns */}
        <VisualTranscriptWindow
          messages={messages}
          onReplayTurn={(koreanText) => {
            soundEffects.playSyllableBlip();
            koreanSpeech.speakKorean(koreanText, { rate: profile.audioSpeed });
          }}
          showRomanization={profile.showRomanization}
          maxTurns={3}
        />
      </div>

      {/* Voice Controls: Large Tactile Microphone + Sub Controls */}
      <div className="mt-auto pt-2 border-t border-stone-800/80">
        {/* Live Interim Transcript Bubble */}
        {interimTranscript && (
          <div className="max-w-md mx-auto mb-3 p-2.5 bg-stone-900/90 border border-amber-600/40 rounded-xl text-center text-sm font-['Noto_Sans_KR'] text-amber-200 animate-pulse">
            "{interimTranscript}"
          </div>
        )}

        {/* Language Mode Switcher */}
        <div className="flex items-center justify-center mb-3">
          <div className="flex items-center p-1 bg-stone-900 border border-stone-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setInputLanguage('ko-KR');
                resetPauseTimer();
                startPauseTimer();
              }}
              className={`px-3 py-1 font-medium rounded-lg transition-colors cursor-pointer ${
                inputLanguage === 'ko-KR'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Speak Korean (한국어)
            </button>
            <button
              type="button"
              onClick={() => {
                setInputLanguage('en-US');
                resetPauseTimer();
                startPauseTimer();
              }}
              className={`px-3 py-1 font-medium rounded-lg transition-colors cursor-pointer ${
                inputLanguage === 'en-US'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Ask in English (질문하기)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          {/* Audio Speed Selector */}
          <button
            onClick={() => {
              const speeds = [0.75, 0.85, 1.0];
              const nextIdx = (speeds.indexOf(profile.audioSpeed) + 1) % speeds.length;
              onUpdateProfile({ ...profile, audioSpeed: speeds[nextIdx] });
            }}
            className="flex flex-col items-center text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Adjust Tutor Korean Voice Speed"
          >
            <Sliders className="w-5 h-5 mb-0.5" />
            <span>{profile.audioSpeed}x Voice</span>
          </button>

          {/* Primary Big Voice Button */}
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={isLoadingNextTurn}
            className={`w-18 h-18 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/40 scale-105'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold hover:scale-105'
            } ${isLoadingNextTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isListening ? 'Stop listening' : 'Start speaking Korean'}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
            <span className="text-[10px] tracking-tight mt-0.5 font-bold">
              {isListening ? 'Finish' : 'Speak'}
            </span>
          </button>

          {/* Text Input Fallback Toggle */}
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex flex-col items-center text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Type Korean with keyboard instead of voice"
          >
            <MessageSquare className="w-5 h-5 mb-0.5" />
            <span>Type Text</span>
          </button>
        </div>

        {/* Text fallback input drawer */}
        {showTextInput && (
          <form onSubmit={handleTextSubmit} className="max-w-md mx-auto mt-3 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="한국어로 입력해 보세요 (Type Korean response)..."
              className="flex-1 bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-['Noto_Sans_KR']"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isLoadingNextTurn}
              className="p-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Privacy & Engine Indicator Footer */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-800/40">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isOffline
                  ? 'bg-amber-500'
                  : localModelConfig.mode === 'local_endpoint'
                  ? 'bg-emerald-500'
                  : 'bg-sky-500'
              }`}
            />
            <span>
              {isOffline
                ? 'Offline Mode (Local Simulation & Web Speech)'
                : localModelConfig.mode === 'local_endpoint'
                ? `Local STT (${localModelConfig.modelName})`
                : 'Cloud Enhanced (Gemini 3.8 Flash)'}
            </span>
          </div>

          <button
            onClick={onOpenLocalModelModal}
            className="hover:text-stone-400 transition-colors underline cursor-pointer"
          >
            Configure Local Models
          </button>
        </div>
      </div>

      {/* 5-Second Silence / Pause Coaching Overlay */}
      <PauseCoachingOverlay
        isVisible={showPauseOverlay}
        onClose={() => {
          setShowPauseOverlay(false);
          resetPauseTimer();
        }}
        onStartSpeaking={() => {
          setShowPauseOverlay(false);
          handleStartListening();
        }}
        targetCard={currentTutorData?.hangulCard}
        targetPrompt={currentTutorData?.learnerPrompt}
        learnerLevel={profile.level}
      />
    </div>
  );
};
