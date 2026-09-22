export function SeverityBadge({ severity }: { severity: "info" | "warning" | "critical" | string }) {
  let colorClass = "bg-stone-100 text-stone-700 ring-stone-200";
  
  if (severity === "critical") {
    colorClass = "bg-rose-50 text-rose-700 ring-rose-100";
  } else if (severity === "warning") {
    colorClass = "bg-amber-50 text-amber-700 ring-amber-100";
  } else if (severity === "info") {
    colorClass = "bg-blue-50 text-blue-700 ring-blue-100";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${colorClass}`}
    >
      {severity}
    </span>
  );
}
