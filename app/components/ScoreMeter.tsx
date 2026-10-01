import React, { useEffect, useState } from "react";

export interface ScoreMeterProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showNeedle?: boolean;
  showSubcategories?: boolean;
  categories?: {
    name: string;
    score: number;
    weight?: string;
  }[];
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  label = "Overall Score",
  size = "md",
  showNeedle = true,
  showSubcategories = false,
  categories = [],
}) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(safeScore);
    }, 150);
    return () => clearTimeout(timer);
  }, [safeScore]);

  // Color logic
  const getScoreTheme = (val: number) => {
    if (val >= 80) {
      return {
        stroke: "#10b981", // emerald-500
        gradientId: "meter-emerald",
        startColor: "#34d399",
        endColor: "#059669",
        textColor: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        statusText: "Exceptional / Ready",
        benchmark: "Top 15% of Candidates",
      };
    }
    if (val >= 60) {
      return {
        stroke: "#f59e0b", // amber-500
        gradientId: "meter-amber",
        startColor: "#fbbf24",
        endColor: "#d97706",
        textColor: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        statusText: "Good Baseline",
        benchmark: "Competitive (Needs Polish)",
      };
    }
    return {
      stroke: "#f43f5e", // rose-500
      gradientId: "meter-rose",
      startColor: "#fb7185",
      endColor: "#e11d48",
      textColor: "text-rose-600 dark:text-rose-400",
      badgeBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      statusText: "Needs Optimization",
      benchmark: "High Rejection Risk",
    };
  };

  const theme = getScoreTheme(safeScore);

  // SVG Gauge Calculations
  // Semi-circle from angle 180° (left) to 0° (right)
  const radius = size === "lg" ? 95 : size === "sm" ? 60 : 80;
  const strokeWidth = size === "lg" ? 14 : size === "sm" ? 9 : 12;
  const cx = 110;
  const cy = 100;

  // Arc length for semicircle: PI * radius
  const arcLength = Math.PI * radius;
  const progressRatio = animatedScore / 100;
  const strokeDashoffset = arcLength * (1 - progressRatio);

  // Needle angle: -90° (at score 0, pointing left) to +90° (at score 100, pointing right)
  const needleAngle = -90 + (animatedScore / 100) * 180;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Semi-circular Radial Meter */}
      <div className="relative flex flex-col items-center">
        <svg
          viewBox="0 0 220 125"
          className={
            size === "lg"
              ? "w-64 h-36"
              : size === "sm"
              ? "w-44 h-26"
              : "w-56 h-32"
          }
        >
          <defs>
            <linearGradient id="meter-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="meter-amber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="meter-rose" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <filter id="meterShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Segment Tick Marks */}
          <line
            x1={cx - radius + strokeWidth / 2}
            y1={cy}
            x2={cx - radius - strokeWidth / 2}
            y2={cy}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
          />
          <line
            x1={cx}
            y1={cy - radius - strokeWidth / 2}
            x2={cx}
            y2={cy - radius + strokeWidth / 2}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
          />
          <line
            x1={cx + radius - strokeWidth / 2}
            y1={cy}
            x2={cx + radius + strokeWidth / 2}
            y2={cy}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
          />

          {/* Active Colored Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={`url(#${theme.gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            filter="url(#meterShadow)"
          />

          {/* Optional Center Needle */}
          {showNeedle && (
            <g
              transform={`rotate(${needleAngle} ${cx} ${cy})`}
              className="transition-transform duration-1000 ease-out origin-center"
            >
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - radius + strokeWidth + 4}
                stroke="currentColor"
                className="text-slate-700 dark:text-slate-200"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle
                cx={cx}
                cy={cy}
                r="5"
                className="fill-slate-800 dark:fill-slate-100"
              />
              <circle
                cx={cx}
                cy={cy}
                r="2.5"
                className="fill-white dark:fill-slate-900"
              />
            </g>
          )}

          {/* Baseline Markers: 0, 50, 100 */}
          <text
            x={cx - radius - 2}
            y={cy + 16}
            className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 font-semibold"
            textAnchor="middle"
          >
            0
          </text>
          <text
            x={cx}
            y={cy - radius - strokeWidth - 2}
            className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 font-semibold"
            textAnchor="middle"
          >
            50
          </text>
          <text
            x={cx + radius + 2}
            y={cy + 16}
            className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 font-semibold"
            textAnchor="middle"
          >
            100
          </text>
        </svg>

        {/* Center Score Reading */}
        <div className="absolute top-[52px] flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0.5">
            <span
              className={`font-mono text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${theme.textColor}`}
            >
              {animatedScore}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">/100</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
      </div>

      {/* Status Badge & Benchmark */}
      <div className="mt-2 flex flex-col items-center gap-1">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${theme.badgeBg}`}
        >
          {theme.statusText}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {theme.benchmark}
        </span>
      </div>

      {/* Subcategory mini-meters */}
      {showSubcategories && categories.length > 0 && (
        <div className="w-full mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
          {categories.map((cat, idx) => {
            const catTheme = getScoreTheme(cat.score);
            return (
              <div key={idx} className="flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {cat.score}
                    </span>
                    <span className="text-slate-400 text-[10px]">/100</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(5, Math.min(100, cat.score))}%`,
                      backgroundColor:
                        cat.score >= 80
                          ? "#10b981"
                          : cat.score >= 60
                          ? "#f59e0b"
                          : "#f43f5e",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScoreMeter;
