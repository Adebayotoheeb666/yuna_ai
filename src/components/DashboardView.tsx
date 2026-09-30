import React, { useState } from 'react';
import {
  Flame,
  Award,
  Volume2,
  Calendar,
  CheckCircle2,
  Lock,
  Search,
  BookOpen,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  DashboardStats,
  Milestone,
  SessionHistory,
  VocabItem,
} from '../types/yuna';
import { koreanSpeech } from '../services/speechSynthesis';
import { soundEffects } from '../services/soundEffects';
import { RadialProgressBar } from './RadialProgressBar';

interface DashboardViewProps {
  stats: DashboardStats;
  milestones: Milestone[];
  vocabList: VocabItem[];
  sessionHistories: SessionHistory[];
  onStartPractice: () => void;
  onUpdateGoal?: (minutes: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  milestones,
  vocabList,
  sessionHistories,
  onStartPractice,
  onUpdateGoal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vocab' | 'milestones' | 'history'>('overview');
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabFilter, setVocabFilter] = useState<'all' | 'learning' | 'reviewing' | 'mastered'>('all');

  const filteredVocab = vocabList.filter((item) => {
    const matchesSearch =
      item.korean.includes(vocabSearch) ||
      item.romanization.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      item.english.toLowerCase().includes(vocabSearch.toLowerCase());
    const matchesFilter = vocabFilter === 'all' || item.masteryStatus === vocabFilter;
    return matchesSearch && matchesFilter;
  });

  const handlePlayWord = (korean: string) => {
    soundEffects.playSyllableBlip();
    koreanSpeech.speakKorean(korean, { rate: 0.85 });
  };

  const unlockedMilestonesCount = milestones.filter((m) => m.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Banner: Daily Improvement Streak Highlight */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {stats.streakDays} Day Voice Streak!
                </h1>
                <span className="text-xs text-amber-400 font-medium">
                  (Best: {stats.bestStreak} days)
                </span>
              </div>
              <p className="text-sm text-stone-400 mt-0.5">
                Spoken Korean practice builds automatic conversational reflexes.
              </p>
            </div>
          </div>

          <button
            onClick={onStartPractice}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all cursor-pointer text-sm shadow-md self-start sm:self-auto"
          >
            Start Today's Session
          </button>
        </div>

        {/* Quick Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-stone-800/80">
          <div>
            <span className="text-xs text-stone-400 block">Today's Spoken Turns</span>
            <span className="text-xl font-bold text-stone-100">{stats.todaySpokenTurns} turns</span>
          </div>
          <div>
            <span className="text-xs text-stone-400 block">Today's Voice Time</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-stone-100">{stats.todayMinutes} min</span>
              <span className="text-xs text-amber-400 font-mono">
                / {stats.dailyGoalMinutes || 15}m
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs text-stone-400 block">Pronunciation Accuracy</span>
            <span className="text-xl font-bold text-emerald-400">{stats.averagePronunciationScore}%</span>
          </div>
          <div>
            <span className="text-xs text-stone-400 block">Vocab Bank</span>
            <span className="text-xl font-bold text-amber-300">{vocabList.length} words</span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl mb-6 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 font-medium rounded-lg transition-colors cursor-pointer text-center ${
            activeTab === 'overview'
              ? 'bg-stone-800 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Daily Improvement
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-2 font-medium rounded-lg transition-colors cursor-pointer text-center ${
            activeTab === 'milestones'
              ? 'bg-stone-800 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Milestones ({unlockedMilestonesCount}/{milestones.length})
        </button>
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-2 font-medium rounded-lg transition-colors cursor-pointer text-center ${
            activeTab === 'vocab'
              ? 'bg-stone-800 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Vocab & Particles ({vocabList.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 font-medium rounded-lg transition-colors cursor-pointer text-center ${
            activeTab === 'history'
              ? 'bg-stone-800 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Past Sessions
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PROGRESS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Goal Radial Tracker Card */}
          <RadialProgressBar
            currentMinutes={stats.todayMinutes}
            goalMinutes={stats.dailyGoalMinutes || 15}
            onGoalChange={(newGoal) => {
              if (onUpdateGoal) {
                onUpdateGoal(newGoal);
              }
            }}
          />

          {/* Weekly Spoken Practice Activity */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-1">Weekly Speaking Activity</h2>
            <p className="text-xs text-stone-400 mb-4">Minutes spent listening and responding in Korean.</p>

            <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
              {stats.weeklyActivity.map((day, idx) => {
                const maxMins = 20;
                const heightPercent = Math.min(100, Math.max(12, (day.minutes / maxMins) * 100));
                const isToday = idx === stats.weeklyActivity.length - 1;

                return (
                  <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[11px] font-mono text-stone-400">{day.minutes}m</span>
                    <div className="w-full max-w-[32px] bg-stone-800 rounded-t-md h-full flex items-end overflow-hidden">
                      <div
                        className={`w-full transition-all duration-300 rounded-t-md ${
                          isToday ? 'bg-amber-500' : 'bg-stone-600 hover:bg-stone-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isToday ? 'text-amber-400 font-bold' : 'text-stone-400'}`}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOPIK Readiness Progress Bands */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-white">TOPIK Readiness Progress</h2>
                <p className="text-xs text-stone-400">
                  Pedagogical progression: 한글 literacy → basic particles → honorifics → connectors
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-stone-200">TOPIK I · Level 1 (Foundations & Daily Greetings)</span>
                  <span className="text-amber-400 font-semibold">{Math.round(stats.topikReadiness.level1)}%</span>
                </div>
                <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.topikReadiness.level1}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-stone-200">TOPIK I · Level 2 (Particles, Conjugation & Ordering)</span>
                  <span className="text-amber-400 font-semibold">{Math.round(stats.topikReadiness.level2)}%</span>
                </div>
                <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.topikReadiness.level2}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-400">TOPIK II · Level 3 (Honorific Infix -시- & Connectors)</span>
                  <span className="text-stone-400 font-semibold">{Math.round(stats.topikReadiness.level3)}%</span>
                </div>
                <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-stone-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.topikReadiness.level3}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-xl border transition-all ${
                m.unlocked
                  ? 'bg-stone-900 border-amber-500/30'
                  : 'bg-stone-900/40 border-stone-800/80 opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    m.unlocked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  {m.unlocked ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${m.unlocked ? 'text-white' : 'text-stone-400'}`}>
                      {m.title}
                    </h3>
                    {m.unlocked && m.unlockedAt && (
                      <span className="text-[11px] text-stone-500 font-mono">{m.unlockedAt}</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{m.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: VOCAB & PARTICLES VAULT */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={vocabSearch}
                onChange={(e) => setVocabSearch(e.target.value)}
                placeholder="Search Korean, romanization, or English..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl text-xs">
              {(['all', 'learning', 'reviewing', 'mastered'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setVocabFilter(status)}
                  className={`px-3 py-1.5 font-medium rounded-lg capitalize transition-colors cursor-pointer ${
                    vocabFilter === status
                      ? 'bg-stone-800 text-amber-300'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Vocab Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVocab.map((v) => (
              <div
                key={v.id}
                className="bg-stone-900 border border-stone-800/80 rounded-xl p-3.5 flex items-center justify-between hover:border-stone-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white font-['Noto_Sans_KR']">
                      {v.korean}
                    </span>
                    <button
                      onClick={() => handlePlayWord(v.korean)}
                      className="p-1 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-stone-400 font-mono">{v.romanization}</div>
                  <div className="text-xs text-stone-300 font-medium mt-0.5">{v.english}</div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-amber-400 font-medium capitalize">{v.masteryStatus}</span>
                  <div className="text-[11px] text-stone-500 mt-1 font-mono">
                    Practiced {v.timesPracticed}x
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVocab.length === 0 && (
            <div className="text-center py-10 text-stone-500 text-sm">
              No words found matching criteria. Practice sessions will add new vocabulary automatically!
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SESSION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {sessionHistories.length > 0 ? (
            sessionHistories.map((s) => (
              <div key={s.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                  <div className="flex items-center gap-2 font-medium text-stone-300">
                    <span className="font-semibold text-white">{s.topic}</span>
                    <span>·</span>
                    <span>{s.level}</span>
                  </div>
                  <span>{s.date}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-400 mb-3">
                  <span>Duration: {s.durationMinutes} min</span>
                  <span>·</span>
                  <span>Spoken Turns: {s.spokenTurns}</span>
                </div>

                {s.recapPhrases && s.recapPhrases.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                      Key Spoken Phrases
                    </span>
                    {s.recapPhrases.map((phrase, pIdx) => (
                      <div key={pIdx} className="flex items-center justify-between text-xs py-1">
                        <span className="font-bold text-stone-200 font-['Noto_Sans_KR']">
                          {phrase.korean}
                        </span>
                        <span className="text-stone-400">{phrase.english}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-8 text-center text-sm text-stone-400">
              <Calendar className="w-8 h-8 text-stone-500 mx-auto mb-2" />
              <p className="font-medium text-stone-300">No session recaps recorded yet.</p>
              <p className="text-xs text-stone-500 mt-1">
                Complete a guided lesson with Yuna to view summaries and key vocabulary recaps here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
