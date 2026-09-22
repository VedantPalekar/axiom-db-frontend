export function LoadingSkeleton({
  className = "h-6 w-full",
}: {
  className?: string;
}) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />;
}
