import ScoreGauge from "./ScoreGauge";

const ScoreBadge = ({ score }: { score: number }) => {
  const badgeColor =
    score > 69
      ? "bg-badge-green text-green-700 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/60"
      : score > 49
        ? "bg-badge-yellow text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/60"
        : "bg-badge-red text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 dark:border dark:border-rose-800/60";
  const badgeText =
    score > 69 ? "Strong" : score > 49 ? "Good Start" : "Needs Work";

  return (
    <div className={`score-badge ${badgeColor}`}>
      <p className="text-xs font-semibold">{badgeText}</p>
    </div>
  );
};

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 69
      ? "text-green-600 dark:text-emerald-400"
      : score > 49
        ? "text-yellow-600 dark:text-amber-400"
        : "text-red-600 dark:text-rose-400";

  return (
    <div className="resume-summary !p-2 sm:!p-4">
      <div className="category !p-3 sm:!p-4 flex flex-row items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800/80 rounded-2xl">
        <div className="flex flex-row gap-2 items-center min-w-0">
          <p className="text-sm sm:text-lg md:text-xl font-medium text-gray-800 dark:text-slate-200 truncate">
            {title}
          </p>
          <ScoreBadge score={score} />
        </div>
        <p className="text-sm sm:text-lg md:text-xl font-bold flex-shrink-0 text-gray-700 dark:text-slate-300">
          <span className={textColor}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-md w-full overflow-hidden transition-colors">
      <div className="flex flex-col sm:flex-row items-center p-4 sm:p-6 gap-4 sm:gap-8 border-b border-gray-100 dark:border-slate-800">
        <ScoreGauge score={feedback.overallScore} />
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Your Resume Score
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
            This score is calculated based on the variables listed below.
          </p>
        </div>
      </div>
      <div className="py-2">
        <Category title="Tone & Style" score={feedback.toneAndStyle.score} />
        <Category title="Content" score={feedback.content.score} />
        <Category title="Structure" score={feedback.structure.score} />
        <Category title="Skills" score={feedback.skills.score} />
      </div>
    </div>
  );
};

export default Summary;
