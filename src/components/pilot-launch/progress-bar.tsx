export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`h-1.5 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className="h-full bg-primary rounded-full motion-safe:transition-[width] duration-200"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
