import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatDockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A search is running: shown as a dot on the button while the window is closed. */
  busy?: boolean;
  /** The planner itself. Fills the window; scrolls inside itself as needed. */
  children: ReactNode;
}

/**
 * The trip planner as a chat window behind a button in the corner, so the
 * home page leads with the traveler's own trips and calendar rather than a
 * chat box. It holds the same planner that used to sit at the top of the page.
 *
 * Rendered into <body> so no animated or scrolling parent can shift or clip
 * it. It sits below the full-page hotel step (z-40), the app's header and
 * mobile nav (z-50) and every dialog (z-50), all of which the planner opens
 * on top of itself.
 */
export function ChatDock({ open, onOpenChange, busy = false, children }: ChatDockProps) {
  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            key="chat-dock"
            role="dialog"
            aria-label="Trip planner"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "fixed z-30 flex flex-col overflow-hidden bg-background shadow-2xl origin-bottom-right",
              // Phones: the whole space between the header and the bottom nav.
              "inset-x-0 top-16 bottom-12 border-y border-border",
              // Larger screens: a window above the button. Its height leaves the
              // 4rem header, a 1rem gap and the 6rem it sits above the bottom.
              "md:inset-auto md:right-6 md:bottom-24 md:rounded-2xl md:border",
              "md:w-[min(720px,calc(100vw-3rem))] md:h-[min(780px,calc(100vh-11rem))]",
            )}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Trip planner</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close trip planner">
                <X className="h-4 w-4" />
              </Button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? "Close trip planner" : "Open trip planner"}
        aria-expanded={open}
        title={open ? "Close trip planner" : "Plan a trip"}
        className={cn(
          "fixed z-30 right-4 bottom-20 md:right-6 md:bottom-6 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:shadow-xl",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // On a phone the open window covers this corner and has its own close button.
          open && "hidden md:flex",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && busy && (
          <span className="absolute right-1 top-1 h-3 w-3 animate-pulse rounded-full bg-success ring-2 ring-background" aria-hidden />
        )}
      </button>
    </>,
    document.body,
  );
}
