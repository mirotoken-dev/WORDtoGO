import { useRouter } from "@tanstack/react-router";
import { BarChart2, Home, Layers, Music } from "lucide-react";
import { playTapSound } from "../utils/audio";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "Cards", icon: Layers, path: "/flashcards" },
  { label: "Blend", icon: Music, path: "/blending" },
  { label: "Progress", icon: BarChart2, path: "/progress" },
] as const;

interface BottomNavProps {
  active: "home" | "cards" | "blend" | "progress";
}

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-center justify-around py-2 px-2"
      style={{ borderColor: "oklch(0.90 0.02 60)", boxShadow: "0 -2px 12px oklch(0 0 0 / 0.08)" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.label.toLowerCase();
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              playTapSound();
              router.navigate({ to: item.path as "/" });
            }}
            className="flex flex-col items-center gap-0.5 px-4 py-1 active:scale-95 transition-smooth"
          >
            <Icon
              className="w-6 h-6"
              style={{ color: isActive ? "oklch(0.68 0.22 40)" : "oklch(0.55 0.03 60)" }}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span
              className="text-xs font-display font-semibold"
              style={{ color: isActive ? "oklch(0.68 0.22 40)" : "oklch(0.55 0.03 60)" }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
