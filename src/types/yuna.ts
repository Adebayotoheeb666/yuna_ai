export type LearnerLevel = 'Absolute Beginner' | 'Beginner' | 'Intermediate' | 'Advanced';

export type SpeechLevel =
  | '반말 (Informal)'
  | '존댓말 (Polite 요-form)'
  | '합니다체 (Formal)';

export type SessionStage =
  | 'warmup'
  | 'new_material'
  | 'guided_practice'
  | 'free_conversation'
  | 'wrap_up';

export interface LearnerProfile {
  level: LearnerLevel;
  goals: string;
  hangulComfort: 'learning' | 'comfortable' | 'fluent';
  preferredSpeechLevel: SpeechLevel;
  showRomanization: boolean;
  audioSpeed: number; // 0.75 to 1.15
  autoPlayAudio: boolean;
}

export interface SyllablePart {
  syllable: string;
  romanization: string;
  tip?: string;
}

export interface HangulCard {
  hangul: string;
  romanization: string;
  englishGloss: string;
  syllableBreakdown?: SyllablePart[];
}

export interface PronunciationFeedback {
  hasFeedback?: boolean;
  detectedIssue?: string;
  isolatedSyllable?: string;
  coachingTip?: string;
}

export interface VocabItem {
  id: string;
  korean: string;
  romanization: string;
  english: string;
  speechLevel?: string;
  particleUsed?: string;
  timesPracticed: number;
  masteryStatus: 'learning' | 'reviewing' | 'mastered';
  lastPracticed: number;
}

export interface TutorResponse {
  spokenKorean: string;
  spokenEnglishTranslation: string;
  speechLevel: string;
  speechLevelExplanation?: string;
  hangulCard: HangulCard;
  grammarNote?: string;
  pronunciationFeedback?: PronunciationFeedback;
  correctionRecast?: string;
  learnerPrompt: string;
  sessionStage: SessionStage;
  detectedLanguage?: 'Korean' | 'English' | 'Mixed';
  userIntent?: 'asked_question' | 'attempted_korean' | 'asked_translation' | 'general_conversation';
  directAnswerToUser?: string;
  newVocabulary?: Array<{
    korean: string;
    romanization: string;
    english: string;
    particleUsed?: string;
  }>;
  milestoneUnlocked?: string;
  audioBase64?: string;
}

export interface PauseCoachingTip {
  hangulReadingTip: string;
  pronunciationTip: string;
  isolatedSyllable?: string;
  suggestedPhrase: string;
  suggestedRomanization: string;
  suggestedEnglish: string;
}

export interface ChatMessage {
  id: string;
  role: 'tutor' | 'learner';
  timestamp: number;
  tutorData?: TutorResponse;
  learnerText?: string;
  pronunciationScore?: number;
  isOffline?: boolean;
}

export interface LocalModelConfig {
  mode: 'browser' | 'local_endpoint' | 'cloud';
  endpointUrl: string;
  modelName: string;
  apiKey?: string;
  isTested: boolean;
  latencyMs?: number;
  testedAt?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
  category: 'speaking' | 'grammar' | 'streak' | 'roleplay';
}

export interface DayActivity {
  day: string;
  date: string;
  minutes: number;
  turns: number;
}

export interface DashboardStats {
  streakDays: number;
  bestStreak: number;
  lastActiveDate: string;
  todayMinutes: number;
  dailyGoalMinutes?: number; // Target practice minutes per day
  todaySpokenTurns: number;
  totalSpokenTurns: number;
  averagePronunciationScore: number;
  pronunciationEvaluationsCount: number;
  weeklyActivity: DayActivity[];
  topikReadiness: {
    level1: number; // percentage 0-100
    level2: number;
    level3: number;
  };
}

export interface SessionHistory {
  id: string;
  date: string;
  topic: string;
  level: string;
  durationMinutes: number;
  spokenTurns: number;
  recapPhrases: Array<{
    korean: string;
    romanization: string;
    english: string;
  }>;
  notes: string;
}

export interface PracticeLesson {
  id: string;
  title: string;
  subtitle: string;
  level: LearnerLevel;
  category: 'Particle Drill' | 'Speech Level' | 'Roleplay' | 'Warmup & Basics';
  stage: SessionStage;
  description: string;
  initialPrompt: string;
  targetVocab: string[];
  grammarFocus: string;
}
