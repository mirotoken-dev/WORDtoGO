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

  const defaultHeaderBg = "linear-gradient(135deg, oklch(0.72 0.22 40) 0%, oklch(0.60 0.22 40) 100%)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.98 0.02 60)" }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: headerColor ?? defaultHeaderBg, boxShadow: "0 2px 8px oklch(0 0 0 / 0.12)" }}
        data-ocid="layout.header"
      >
        <div className="flex items-center gap-2 min-w-[44px]">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-smooth"
              style={{ background: "oklch(1 0 0 / 0.25)" }}
              aria-label="Go back"
              data-ocid="layout.back_button"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {title && (
          <h1 className="font-display font-bold text-xl text-white text-center flex-1 truncate px-2">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-2 min-w-[44px] justify-end">
          {rightSlot}
          {showHome && (
            <button
              type="button"
              onClick={handleHome}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-smooth"
              style={{ background: "oklch(1 0 0 / 0.25)" }}
              aria-label="Go home"
              data-ocid="layout.home_button"
            >
              <Home className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>

      <footer
        className="py-3 text-center border-t bg-white"
        style={{ borderColor: "oklch(0.90 0.02 60)" }}
      >
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "oklch(0.68 0.22 40)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
