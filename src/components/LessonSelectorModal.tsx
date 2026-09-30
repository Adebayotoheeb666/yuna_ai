import React from 'react';
import { X, BookOpen, Sparkles, MessageCircle, Volume2, Shield } from 'lucide-react';
import { LearnerLevel, PracticeLesson } from '../types/yuna';
import { OFFLINE_LESSONS } from '../services/offlineTutorEngine';

interface LessonSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLessonId: string;
  onSelectLesson: (lesson: PracticeLesson) => void;
  currentLevel: LearnerLevel;
  onSelectLevel: (lvl: LearnerLevel) => void;
}

export const LessonSelectorModal: React.FC<LessonSelectorModalProps> = ({
  isOpen,
  onClose,
  activeLessonId,
  onSelectLesson,
  currentLevel,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  const levels: LearnerLevel[] = ['Absolute Beginner', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Choose Practice Scenario</h2>
            <p className="text-xs text-stone-400">Select targeted drills, speech level drills, or roleplay.</p>
          </div>
        </div>

        {/* Level Selector Segmented Control */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
            Learner Level
          </label>
          <div className="flex items-center gap-1 p-1 bg-stone-950 border border-stone-800 rounded-xl text-xs">
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSelectLevel(lvl)}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-colors cursor-pointer text-center ${
                  currentLevel === lvl
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {lvl.replace(' ', '\n')}
              </button>
            ))}
          </div>
        </div>

        {/* Lessons List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {OFFLINE_LESSONS.map((lesson) => {
            const isSelected = lesson.id === activeLessonId;
            return (
              <div
                key={lesson.id}
                onClick={() => {
                  onSelectLesson(lesson);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-stone-800/40 border-stone-700/60 hover:bg-stone-800/80 hover:border-stone-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        {lesson.category}
                      </span>
                      <span aria-hidden="true" className="text-stone-600">·</span>
                      <span className="text-xs text-stone-400">{lesson.level}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-0.5">{lesson.title}</h3>
                    <p className="text-xs text-stone-400 mt-1">{lesson.description}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-700/40 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="text-stone-300 font-medium">Focus: {lesson.grammarFocus}</span>
                  <span className="text-amber-400 font-medium">{isSelected ? 'Active Now' : 'Select'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
