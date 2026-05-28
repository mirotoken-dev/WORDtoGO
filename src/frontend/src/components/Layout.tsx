import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";
import { getUILabel } from "../data/arabicTranslations";
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
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b-2 border-border shadow-xs"
        data-ocid="layout.header"
      >
        <div className="flex items-center gap-2 min-w-[44px]">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="nav-btn"
              aria-label={getUILabel("Go back")}
              data-ocid="layout.back_button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {title && (
          <h1 className="font-display font-black text-xl text-center flex-1 truncate px-2 text-foreground">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-2 min-w-[44px] justify-end">
          {rightSlot}
          {showHome && (
            <button
              type="button"
              onClick={handleHome}
              className="nav-btn"
              aria-label={getUILabel("Go home")}
              data-ocid="layout.home_button"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
