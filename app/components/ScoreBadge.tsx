interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let badgeColor = "";
  let badgeText = "";

  if (score > 70) {
    badgeColor =
      "bg-badge-green text-green-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60";
    badgeText = "Strong";
  } else if (score > 49) {
    badgeColor =
      "bg-badge-yellow text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/60";
    badgeText = "Good Start";
  } else {
    badgeColor =
      "bg-badge-red text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/60";
    badgeText = "Needs Work";
  }

  return (
    <div className={`px-3 py-1 rounded-full ${badgeColor}`}>
      <p className="text-sm font-medium">{badgeText}</p>
    </div>
  );
};

export default ScoreBadge;
