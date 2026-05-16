interface ProgressBarProps {
  value: number; // 0-100
  color?: "red" | "blue" | "green" | "yellow" | "purple" | "gold" | "indigo";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const FILL_MAP: Record<string, string> = {
  red: "bg-gradient-to-r from-[oklch(0.65_0.26_15)] to-[oklch(0.50_0.26_15)]",
  blue: "bg-gradient-to-r from-[oklch(0.58_0.22_260)] to-[oklch(0.44_0.22_260)]",
  green: "bg-gradient-to-r from-[oklch(0.62_0.22_145)] to-[oklch(0.48_0.22_145)]",
  yellow: "bg-gradient-to-r from-[oklch(0.80_0.18_84)] to-[oklch(0.68_0.18_84)]",
  purple: "bg-gradient-to-r from-[oklch(0.60_0.22_310)] to-[oklch(0.46_0.22_310)]",
  gold: "bg-gradient-to-r from-[oklch(0.80_0.18_84)] to-[oklch(0.68_0.16_84)]",
  indigo: "bg-gradient-to-r from-[oklch(0.58_0.22_280)] to-[oklch(0.44_0.22_280)]",
};

const SIZE_MAP: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export default function ProgressBar({
  value,
  color = "indigo",
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
        <div className="flex justify-between items-center mb-1.5">
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
        className={`w-full rounded-full overflow-hidden ${h} bg-muted`}
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
