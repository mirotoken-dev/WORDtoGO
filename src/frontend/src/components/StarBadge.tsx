import { motion } from "motion/react";

interface StarBadgeProps {
  count: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { star: "text-lg", count: "text-xs", gap: "gap-0.5" },
  md: { star: "text-2xl", count: "text-sm", gap: "gap-1" },
  lg: { star: "text-4xl", count: "text-base", gap: "gap-1.5" },
};

export default function StarBadge({
  count,
  max,
  size = "md",
  animate = false,
  className = "",
}: StarBadgeProps) {
  const s = SIZE_MAP[size];

  if (max !== undefined) {
    return (
      <div
        className={`flex items-center ${s.gap} ${className}`}
        data-ocid="star_badge"
      >
        {Array.from({ length: max }, (_, i) => {
          const filled = i < count;
          return (
            <motion.span
              key={`star-${i}-${filled ? "filled" : "empty"}`}
              className={s.star}
              initial={animate ? { scale: 0, rotate: -180 } : false}
              animate={animate && filled ? { scale: 1, rotate: 0 } : {}}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 260 }}
            >
              {filled ? "⭐" : "☆"}
            </motion.span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center ${s.gap} ${className}`}
      data-ocid="star_badge"
    >
      <motion.span
        className={s.star}
        animate={animate ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        ⭐
      </motion.span>
      {count > 0 && (
        <span className={`font-display font-bold text-foreground ${s.count}`}>
          {count}
        </span>
      )}
    </div>
  );
}
