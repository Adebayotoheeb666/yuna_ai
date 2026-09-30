import React from 'react';
import { Target, CheckCircle2, Plus, Minus, Sparkles } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface RadialProgressBarProps {
  currentMinutes: number;
  goalMinutes: number;
  onGoalChange: (newGoal: number) => void;
  size?: number;
  strokeWidth?: number;
}

export const RadialProgressBar: React.FC<RadialProgressBarProps> = ({
  currentMinutes,
  goalMinutes,
  onGoalChange,
  size = 170,
  strokeWidth = 12,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const validGoal = Math.max(1, goalMinutes || 15);
  const ratio = currentMinutes / validGoal;
  const clampedRatio = Math.min(1, Math.max(0, ratio));
  const strokeDashoffset = circumference * (1 - clampedRatio);
  const percentage = Math.round(ratio * 100);
  const isGoalAchieved = percentage >= 100;

  const presets = [5, 10, 15, 20, 30];

  const handlePresetClick = (mins: number) => {
    soundEffects.playSyllableBlip();
    onGoalChange(mins);
  };

  const handleAdjust = (delta: number) => {
    const next = Math.max(5, Math.min(60, validGoal + delta));
    soundEffects.playSyllableBlip();
    onGoalChange(next);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
      {/* Radial Progress Graphic */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          aria-label={`Daily Goal Progress: ${currentMinutes} of ${validGoal} minutes`}
        >
          {/* Defs for gradient */}
          <defs>
            <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="achievedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Background track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgb(41 37 36)" // stone-800
            strokeWidth={strokeWidth}
          />

          {/* Active Progress stroke circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={isGoalAchieved ? 'url(#achievedGradient)' : 'url(#goalGradient)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text inside the radial circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          {isGoalAchieved ? (
            <Sparkles className="w-5 h-5 text-emerald-400 mb-0.5 animate-bounce" />
          ) : (
            <Target className="w-4 h-4 text-amber-400 mb-0.5" />
          )}

          <div className="text-2xl font-bold tracking-tight text-white leading-none font-mono">
            {currentMinutes.toFixed(1)}m
          </div>

          <div className="text-[11px] text-stone-400 mt-1 font-medium">
            of {validGoal}m goal
          </div>

          <div
            className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-md ${
              isGoalAchieved
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
            }`}
          >
            {isGoalAchieved ? 'Goal Achieved! 🎉' : `${percentage}% done`}
          </div>
        </div>
      </div>

      {/* Goal Setting & Progress Details */}
      <div className="flex-1 w-full text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <span>Daily Practice Goal</span>
              {isGoalAchieved && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed today
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Set your target speaking minutes. Regular short sessions build long-term fluency.
            </p>
          </div>

          {/* Stepper buttons */}
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => handleAdjust(-5)}
              className="p-1.5 rounded-lg border border-stone-800 bg-stone-950 hover:bg-stone-800 text-stone-300 transition-colors cursor-pointer"
              title="Decrease goal by 5 minutes"
              aria-label="Decrease daily goal by 5 minutes"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-bold font-mono text-stone-200">
              {validGoal}m
            </span>
            <button
              onClick={() => handleAdjust(5)}
              className="p-1.5 rounded-lg border border-stone-800 bg-stone-950 hover:bg-stone-800 text-stone-300 transition-colors cursor-pointer"
              title="Increase goal by 5 minutes"
              aria-label="Increase daily goal by 5 minutes"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="mt-3">
          <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
            Quick Goal Presets:
          </label>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
            {presets.map((mins) => {
              const isSelected = validGoal === mins;
              return (
                <button
                  key={mins}
                  onClick={() => handlePresetClick(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-sm scale-102'
                      : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 border border-stone-700/60'
                  }`}
                >
                  {mins} min
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Narrative */}
        <div className="mt-4 pt-3 border-t border-stone-800 text-xs text-stone-400">
          {isGoalAchieved ? (
            <span className="text-emerald-400 font-medium">
              You exceeded your daily goal by {(currentMinutes - validGoal).toFixed(1)} minutes! Fantastic consistency.
            </span>
          ) : (
            <span>
              {(validGoal - currentMinutes).toFixed(1)} minutes remaining to reach today's target.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
