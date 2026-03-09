import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MetricRowProps {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  labelSuffix?: ReactNode;
  value: string;
}

export function MetricRow({
  icon,
  iconClassName,
  label,
  labelSuffix,
  value,
}: MetricRowProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          iconClassName
        )}
      >
        {icon}
      </div>
      <div>
        <p className="flex items-center gap-1 text-muted-foreground text-xs uppercase tracking-widest">
          {label}
          {labelSuffix}
        </p>
        <p className="font-bold text-foreground text-xl">{value}</p>
      </div>
    </div>
  );
}
