import { cn } from "@/lib/utils";

interface ProgressBarProps {
  className?: string;
  value: number;
}

export function ProgressBar({ className, value }: ProgressBarProps) {
  return (
    <div
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
