import { Link } from "react-router-dom";
import flybyLogo from "@/assets/flybyLogo";

/**
 * Shared shell for the public legal pages.
 *
 * These must render for someone who is NOT signed in — Google's OAuth reviewer
 * and any prospective customer will read them while logged out — so they sit
 * outside the protected layout.
 */
export function LegalPage({
  title, updated, children,
}: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={flybyLogo.url} alt="Flyby AI" className="w-7 h-7 rounded" />
            <span className="font-semibold">Flyby AI</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Last updated {updated}</p>
        <div className="mt-8 space-y-7 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/60 mt-8">
        <div className="max-w-3xl mx-auto px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Flyby AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}
