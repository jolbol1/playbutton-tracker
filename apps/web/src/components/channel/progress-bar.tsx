import { cn } from "@/lib/utils";

interface ProgressBarProps {
  ariaLabel: string;
  className?: string;
  value: number;
}

export function ProgressBar({ ariaLabel, className, value }: ProgressBarProps) {
  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn("overflow-hidden rounded-full", className)}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
