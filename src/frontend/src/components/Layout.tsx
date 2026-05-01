import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";
import { playTapSound } from "../utils/audio";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  headerColor?: string;
  rightSlot?: React.ReactNode;
}

export default function Layout({
  children,
  title,
  showBack = true,
  showHome = true,
  headerColor,
  rightSlot,
}: LayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    playTapSound();
    router.history.back();
  };

  const handleHome = () => {
    playTapSound();
    router.navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-[oklch(0.82_0.17_84/0.2)] shadow-luxury backdrop-blur-sm"
        style={
          headerColor
            ? { background: headerColor }
            : { background: "oklch(0.10 0.02 264 / 0.95)" }
        }
        data-ocid="layout.header"
      >
        <div className="flex items-center gap-2 min-w-[44px]">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="w-11 h-11 rounded-full bg-card/80 border border-[oklch(0.82_0.17_84/0.25)] flex items-center justify-center shadow-xs btn-tap transition-smooth hover:bg-card hover:border-[oklch(0.82_0.17_84/0.5)]"
              aria-label="Go back"
              data-ocid="layout.back_button"
            >
              <ArrowLeft className="w-5 h-5 text-[oklch(0.82_0.17_84)]" />
            </button>
          )}
        </div>

        {title && (
          <h1 className="font-display font-bold text-xl text-foreground text-center flex-1 truncate px-2">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-2 min-w-[44px] justify-end">
          {rightSlot}
          {showHome && (
            <button
              type="button"
              onClick={handleHome}
              className="w-11 h-11 rounded-full bg-card/80 border border-[oklch(0.82_0.17_84/0.25)] flex items-center justify-center shadow-xs btn-tap transition-smooth hover:bg-card hover:border-[oklch(0.82_0.17_84/0.5)]"
              aria-label="Go home"
              data-ocid="layout.home_button"
            >
              <Home className="w-5 h-5 text-[oklch(0.82_0.17_84)]" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>

      <footer className="py-3 text-center bg-card/60 border-t border-[oklch(0.82_0.17_84/0.15)]">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[oklch(0.82_0.17_84)] transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
