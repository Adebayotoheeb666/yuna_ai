import {
  DashboardStats,
  LearnerProfile,
  LocalModelConfig,
  Milestone,
  SessionHistory,
  VocabItem,
} from '../types/yuna';

const STORAGE_KEYS = {
  PROFILE: 'yuna_learner_profile_v1',
  STATS: 'yuna_dashboard_stats_v1',
  VOCAB: 'yuna_vocab_vault_v1',
  MILESTONES: 'yuna_milestones_v1',
  LOCAL_MODEL: 'yuna_local_model_v1',
  SESSIONS: 'yuna_sessions_history_v1',
};

export const INITIAL_PROFILE: LearnerProfile = {
  level: 'Beginner',
  goals: 'Everyday conversation, ordering food & K-drama comprehension',
  hangulComfort: 'learning',
  preferredSpeechLevel: '존댓말 (Polite 요-form)',
  showRomanization: true,
  audioSpeed: 0.85,
  autoPlayAudio: true,
};

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'first_sentence',
    title: 'First Korean Words',
    description: 'Spoke your first full Korean sentence aloud with Yuna.',
    unlocked: true,
    unlockedAt: '2026-09-28',
    icon: 'mic',
    category: 'speaking',
  },
  {
    id: 'hangul_pioneer',
    title: 'Hangul Pioneer',
    description: 'Read and responded to Hangul script directly without romanization.',
    unlocked: false,
    icon: 'book-open',
    category: 'reading',
  } as any,
  {
    id: 'particle_champion',
    title: 'Particle Champion',
    description: 'Accurately used 은/는 and 이/가 in rapid-fire guided practice.',
    unlocked: false,
    icon: 'sparkles',
    category: 'grammar',
  },
  {
    id: 'honorifics_adept',
    title: 'Honorifics Navigator',
    description: 'Successfully transformed informal 반말 into respectful 존댓말.',
    unlocked: false,
    icon: 'shield-check',
    category: 'grammar',
  },
  {
    id: 'cafe_connoisseur',
    title: 'Hongdae Café Master',
    description: 'Completed a full coffee ordering dialogue in natural Korean.',
    unlocked: false,
    icon: 'coffee',
    category: 'roleplay',
  },
  {
    id: 'pronunciation_star',
    title: 'Vowel Precision (ㅓ vs ㅗ)',
    description: 'Achieved 90%+ pronunciation accuracy on tricky vowel pairs.',
    unlocked: false,
    icon: 'volume-2',
    category: 'speaking',
  },
  {
    id: 'streak_master',
    title: '7-Day Voice Streak',
    description: 'Practiced speaking Korean for 7 consecutive days.',
    unlocked: false,
    icon: 'flame',
    category: 'streak',
  },
];

export const INITIAL_VOCAB: VocabItem[] = [
  {
    id: 'v1',
    korean: '안녕하세요',
    romanization: 'annyeonghaseyo',
    english: 'Hello / Good day',
    speechLevel: '존댓말 (Polite 요-form)',
    timesPracticed: 12,
    masteryStatus: 'mastered',
    lastPracticed: Date.now() - 86400000,
  },
  {
    id: 'v2',
    korean: '감사합니다',
    romanization: 'gamsahamnida',
    english: 'Thank you (formal)',
    speechLevel: '합니다체 (Formal)',
    timesPracticed: 9,
    masteryStatus: 'mastered',
    lastPracticed: Date.now() - 86400000,
  },
  {
    id: 'v3',
    korean: '저는',
    romanization: 'jeoneun',
    english: 'As for me (humble topic)',
    particleUsed: '는 (topic)',
    timesPracticed: 6,
    masteryStatus: 'reviewing',
    lastPracticed: Date.now() - 3600000,
  },
  {
    id: 'v4',
    korean: '아이스 아메리카노',
    romanization: 'aiseu amerikano',
    english: 'Iced Americano',
    speechLevel: '존댓말',
    timesPracticed: 4,
    masteryStatus: 'learning',
    lastPracticed: Date.now() - 7200000,
  },
  {
    id: 'v5',
    korean: '주세요',
    romanization: 'juseyo',
    english: 'Please give me',
    speechLevel: '존댓말 (Polite 요-form)',
    timesPracticed: 7,
    masteryStatus: 'mastered',
    lastPracticed: Date.now() - 3600000,
  },
];

export const INITIAL_LOCAL_MODEL: LocalModelConfig = {
  mode: 'browser',
  endpointUrl: 'http://localhost:8000/v1/audio/transcriptions',
  modelName: 'whisper-1',
  isTested: false,
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function loadLearnerProfile(): LearnerProfile {
  if (typeof window === 'undefined') return INITIAL_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return raw ? { ...INITIAL_PROFILE, ...JSON.parse(raw) } : INITIAL_PROFILE;
  } catch {
    return INITIAL_PROFILE;
  }
}

export function saveLearnerProfile(profile: LearnerProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function loadDashboardStats(): DashboardStats {
  const today = getTodayString();
  const defaultStats: DashboardStats = {
    streakDays: 4,
    bestStreak: 7,
    lastActiveDate: today,
    todayMinutes: 8,
    dailyGoalMinutes: 15,
    todaySpokenTurns: 14,
    totalSpokenTurns: 86,
    averagePronunciationScore: 88,
    pronunciationEvaluationsCount: 19,
    weeklyActivity: [
      { day: 'Thu', date: '2026-09-24', minutes: 10, turns: 18 },
      { day: 'Fri', date: '2026-09-25', minutes: 12, turns: 22 },
      { day: 'Sat', date: '2026-09-26', minutes: 6, turns: 11 },
      { day: 'Sun', date: '2026-09-27', minutes: 15, turns: 25 },
      { day: 'Mon', date: '2026-09-28', minutes: 14, turns: 20 },
      { day: 'Tue', date: '2026-09-29', minutes: 11, turns: 19 },
      { day: 'Wed', date: today, minutes: 8, turns: 14 },
    ],
    topikReadiness: {
      level1: 68,
      level2: 32,
      level3: 10,
    },
  };

  if (typeof window === 'undefined') return defaultStats;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return defaultStats;
    const stats: DashboardStats = JSON.parse(raw);

    // Refresh streak logic
    if (stats.lastActiveDate !== today) {
      const last = new Date(stats.lastActiveDate);
      const cur = new Date(today);
      const diffDays = Math.floor((cur.getTime() - last.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        stats.streakDays += 1;
        stats.bestStreak = Math.max(stats.bestStreak, stats.streakDays);
      } else if (diffDays > 1) {
        stats.streakDays = 1;
      }
      stats.lastActiveDate = today;
      stats.todayMinutes = 0;
      stats.todaySpokenTurns = 0;
    }
    return stats;
  } catch {
    return defaultStats;
  }
}

export function saveDashboardStats(stats: DashboardStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

export function recordSpokenTurn(
  durationSeconds: number = 15,
  pronunciationScore?: number
): DashboardStats {
  const stats = loadDashboardStats();
  stats.todaySpokenTurns += 1;
  stats.totalSpokenTurns += 1;
  stats.todayMinutes = Math.round((stats.todayMinutes + durationSeconds / 60) * 10) / 10;

  if (pronunciationScore !== undefined && pronunciationScore > 0) {
    const count = stats.pronunciationEvaluationsCount || 1;
    stats.averagePronunciationScore = Math.round(
      (stats.averagePronunciationScore * count + pronunciationScore) / (count + 1)
    );
    stats.pronunciationEvaluationsCount = count + 1;
  }

  // Update TOPIK readiness incrementally
  stats.topikReadiness.level1 = Math.min(100, stats.topikReadiness.level1 + 0.2);
  if (stats.topikReadiness.level1 > 60) {
    stats.topikReadiness.level2 = Math.min(100, stats.topikReadiness.level2 + 0.15);
  }

  // Update today's entry in weekly activity
  if (stats.weeklyActivity.length > 0) {
    const lastDay = stats.weeklyActivity[stats.weeklyActivity.length - 1];
    lastDay.minutes = Math.round(stats.todayMinutes);
    lastDay.turns = stats.todaySpokenTurns;
  }

  saveDashboardStats(stats);
  return stats;
}

export function updateDailyGoal(goalMinutes: number): DashboardStats {
  const stats = loadDashboardStats();
  stats.dailyGoalMinutes = goalMinutes;
  saveDashboardStats(stats);
  return stats;
}

export function loadVocabVault(): VocabItem[] {
  if (typeof window === 'undefined') return INITIAL_VOCAB;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOCAB);
    return raw ? JSON.parse(raw) : INITIAL_VOCAB;
  } catch {
    return INITIAL_VOCAB;
  }
}

export function saveVocabVault(items: VocabItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(items));
}

export function addLearnedVocab(
  words: Array<{ korean: string; romanization: string; english: string; particleUsed?: string }>
): VocabItem[] {
  const current = loadVocabVault();
  const updated = [...current];

  words.forEach((w) => {
    const existingIndex = updated.findIndex((i) => i.korean === w.korean);
    if (existingIndex >= 0) {
      updated[existingIndex].timesPracticed += 1;
      updated[existingIndex].lastPracticed = Date.now();
      if (updated[existingIndex].timesPracticed >= 5) {
        updated[existingIndex].masteryStatus = 'mastered';
      } else if (updated[existingIndex].timesPracticed >= 2) {
        updated[existingIndex].masteryStatus = 'reviewing';
      }
    } else {
      updated.unshift({
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        korean: w.korean,
        romanization: w.romanization,
        english: w.english,
        particleUsed: w.particleUsed,
        timesPracticed: 1,
        masteryStatus: 'learning',
        lastPracticed: Date.now(),
      });
    }
  });

  saveVocabVault(updated);
  return updated;
}

export function loadMilestones(): Milestone[] {
  if (typeof window === 'undefined') return INITIAL_MILESTONES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    return raw ? JSON.parse(raw) : INITIAL_MILESTONES;
  } catch {
    return INITIAL_MILESTONES;
  }
}

export function unlockMilestone(milestoneId: string): Milestone | null {
  const milestones = loadMilestones();
  const target = milestones.find((m) => m.id === milestoneId);
  if (target && !target.unlocked) {
    target.unlocked = true;
    target.unlockedAt = getTodayString();
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
    return target;
  }
  return null;
}

export function loadLocalModelConfig(): LocalModelConfig {
  if (typeof window === 'undefined') return INITIAL_LOCAL_MODEL;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_MODEL);
    return raw ? { ...INITIAL_LOCAL_MODEL, ...JSON.parse(raw) } : INITIAL_LOCAL_MODEL;
  } catch {
    return INITIAL_LOCAL_MODEL;
  }
}

export function saveLocalModelConfig(config: LocalModelConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LOCAL_MODEL, JSON.stringify(config));
}

export function loadSessionHistories(): SessionHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessionHistory(session: SessionHistory): void {
  if (typeof window === 'undefined') return;
  const list = loadSessionHistories();
  list.unshift(session);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list.slice(0, 30)));
}
