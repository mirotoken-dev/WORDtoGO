interface ProgressBarProps {
  value: number; // 0-100
  color?: "red" | "blue" | "green" | "yellow" | "purple";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const FILL_MAP: Record<string, string> = {
  red: "bg-primary",
  blue: "bg-secondary",
  green: "bg-accent",
  yellow: "bg-[oklch(0.72_0.16_84)]",
  purple: "bg-[oklch(0.55_0.22_320)]",
};

const SIZE_MAP: Record<string, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  color = "green",
  size = "md",
  showLabel = false,
  label,
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const h = SIZE_MAP[size];

  return (
    <div className={`w-full ${className}`} data-ocid="progress_bar">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs font-body font-semibold text-foreground">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-xs font-body text-muted-foreground ml-auto">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${h}`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${h} rounded-full transition-all duration-500 ease-out ${FILL_MAP[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
