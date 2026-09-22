import { formatConfidence } from "../../lib/utils";

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percentage = confidence * 100;
  
  let colorClass = "bg-stone-100 text-stone-700 ring-stone-200";
  
  if (percentage >= 90) {
    colorClass = "bg-emerald-50 text-emerald-700 ring-emerald-100";
  } else if (percentage >= 70) {
    colorClass = "bg-amber-50 text-amber-700 ring-amber-100";
  } else {
    colorClass = "bg-rose-50 text-rose-700 ring-rose-100";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${colorClass}`}
    >
      {formatConfidence(confidence)}
    </span>
  );
}
