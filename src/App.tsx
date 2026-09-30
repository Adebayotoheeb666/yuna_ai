import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { VoiceSessionView } from './components/VoiceSessionView';
import { DashboardView } from './components/DashboardView';
import { LocalModelModal } from './components/LocalModelModal';
import { LessonSelectorModal } from './components/LessonSelectorModal';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import {
  LearnerLevel,
  LearnerProfile,
  LocalModelConfig,
  PracticeLesson,
} from './types/yuna';
import {
  loadDashboardStats,
  loadLearnerProfile,
  loadLocalModelConfig,
  loadMilestones,
  loadSessionHistories,
  loadVocabVault,
  saveDashboardStats,
  saveLearnerProfile,
  saveLocalModelConfig,
  saveSessionHistory,
  updateDailyGoal,
} from './services/storage';
import { OFFLINE_LESSONS } from './services/offlineTutorEngine';
import { soundEffects } from './services/soundEffects';

export default function App() {
  const [activeView, setActiveView] = useState<'session' | 'dashboard'>('session');
  const [profile, setProfile] = useState<LearnerProfile>(loadLearnerProfile());
  const [stats, setStats] = useState(loadDashboardStats());
  const [milestones, setMilestones] = useState(loadMilestones());
  const [vocabList, setVocabList] = useState(loadVocabVault());
  const [sessionHistories, setSessionHistories] = useState(loadSessionHistories());
  const [localModelConfig, setLocalModelConfig] = useState<LocalModelConfig>(
    loadLocalModelConfig()
  );

  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  });
  const [isMuted, setIsMuted] = useState(false);

  // Active Lesson
  const [activeLesson, setActiveLesson] = useState<PracticeLesson>(OFFLINE_LESSONS[0]);

  // Modals
  const [isLocalModelModalOpen, setIsLocalModelModalOpen] = useState(false);
  const [isLessonPickerOpen, setIsLessonPickerOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [currentSummaryData, setCurrentSummaryData] = useState<{
    topic: string;
    level: string;
    turns: number;
    accuracy: number;
    phrases: Array<{ korean: string; romanization: string; english: string }>;
    notes: string;
  } | null>(null);

  // Monitor network connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdateProfile = (updated: LearnerProfile) => {
    setProfile(updated);
    saveLearnerProfile(updated);
  };

  const handleSaveLocalModel = (updated: LocalModelConfig) => {
    setLocalModelConfig(updated);
    saveLocalModelConfig(updated);
  };

  const handleToggleOffline = () => {
    setIsOffline((prev) => !prev);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
  };

  const handleSelectLesson = (lesson: PracticeLesson) => {
    setActiveLesson(lesson);
    setActiveView('session');
  };

  const handleSelectLevel = (lvl: LearnerLevel) => {
    const updated: LearnerProfile = { ...profile, level: lvl };
    setProfile(updated);
    saveLearnerProfile(updated);
  };

  // Called when a session concludes (Wrap-up stage)
  const handleSessionComplete = (sessionResult: any) => {
    const summary = {
      topic: activeLesson.title,
      level: profile.level,
      turns: sessionResult.turns || 5,
      accuracy: sessionResult.accuracy || 90,
      phrases: [
        {
          korean: '저는 학생이에요',
          romanization: 'jeoneun haksaeng-ieyo',
          english: 'As for me, I am a student',
        },
        {
          korean: '제가 할게요',
          romanization: 'jega halgeyo',
          english: 'I will do it (subject focus)',
        },
        {
          korean: '커피 한 잔 주세요',
          romanization: 'keopi han jan juseyo',
          english: 'Please give me one cup of coffee',
        },
      ],
      notes:
        'Great work distinguishing 은/는 (topic) from 이/가 (specific subject). Keep relaxing your jaw for vowel ㅓ!',
    };

    setCurrentSummaryData(summary);
    setIsSummaryModalOpen(true);

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    // Save session history
    const historyItem = {
      id: `s_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      topic: activeLesson.title,
      level: profile.level,
      durationMinutes: 4,
      spokenTurns: summary.turns,
      recapPhrases: summary.phrases,
      notes: summary.notes,
    };
    saveSessionHistory(historyItem);
    setSessionHistories(loadSessionHistories());
    setStats(loadDashboardStats());
    setMilestones(loadMilestones());
    setVocabList(loadVocabVault());
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        onChangeView={setActiveView}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        streakDays={stats.streakDays}
        onOpenLocalModelModal={() => setIsLocalModelModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        localModelMode={localModelConfig.mode}
      />

      {/* Main View Body */}
      <main className="flex-1 flex flex-col">
        {activeView === 'session' ? (
          <VoiceSessionView
            profile={profile}
            localModelConfig={localModelConfig}
            isOffline={isOffline}
            activeLesson={activeLesson}
            onSessionComplete={handleSessionComplete}
            onOpenLessonPicker={() => setIsLessonPickerOpen(true)}
            onOpenLocalModelModal={() => setIsLocalModelModalOpen(true)}
            onUpdateProfile={handleUpdateProfile}
          />
        ) : (
          <DashboardView
            stats={stats}
            milestones={milestones}
            vocabList={vocabList}
            sessionHistories={sessionHistories}
            onStartPractice={() => setActiveView('session')}
            onUpdateGoal={(newGoal) => {
              const updated = updateDailyGoal(newGoal);
              setStats(updated);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <LocalModelModal
        isOpen={isLocalModelModalOpen}
        onClose={() => setIsLocalModelModalOpen(false)}
        config={localModelConfig}
        onSave={handleSaveLocalModel}
      />

      <LessonSelectorModal
        isOpen={isLessonPickerOpen}
        onClose={() => setIsLessonPickerOpen(false)}
        activeLessonId={activeLesson.id}
        onSelectLesson={handleSelectLesson}
        currentLevel={profile.level}
        onSelectLevel={handleSelectLevel}
      />

      {currentSummaryData && (
        <SessionSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          sessionData={currentSummaryData}
          streakDays={stats.streakDays}
          onContinue={() => {
            setActiveView('dashboard');
          }}
        />
      )}
    </div>
  );
}
