import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plane, Receipt, MessageSquare, User, X, ArrowRight } from "lucide-react";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { cn } from "@/lib/utils";

interface GlobalSearchDropdownProps {
  onClose?: () => void;
}

export function GlobalSearchDropdown({ onClose }: GlobalSearchDropdownProps) {
  const navigate = useNavigate();
  const { query, setQuery, results } = useGlobalSearch();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case "trip":
        navigate("/trips", { state: { openTripId: result.entityId } });
        break;
      case "expense":
        navigate("/expenses", { state: { openExpenseId: result.entityId } });
        break;
      case "chat":
        navigate("/chats", { state: { openChatId: result.entityId } });
        break;
      case "person":
        navigate("/team", { state: { openMemberId: result.entityId } });
        break;
    }
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "trip": return <Plane className="w-4 h-4" />;
      case "expense": return <Receipt className="w-4 h-4" />;
      case "chat": return <MessageSquare className="w-4 h-4" />;
      case "person": return <User className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const groupedResults = {
    trip: results.filter((r) => r.type === "trip"),
    expense: results.filter((r) => r.type === "expense"),
    chat: results.filter((r) => r.type === "chat"),
    person: results.filter((r) => r.type === "person"),
  };

  return (
    <div ref={containerRef} className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors duration-200 cursor-pointer"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search</span>
        <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-background/80 rounded border border-border/50">
          ⌘K
        </kbd>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search trips, expenses, chats, people…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 text-sm bg-secondary/50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {query === "" ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Search trips, expenses, chats, people…
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="p-2">
                  {(["trip", "expense", "chat", "person"] as const).map((type) => {
                    const items = groupedResults[type];
                    if (items.length === 0) return null;
                    
                    return (
                      <div key={type} className="mb-2 last:mb-0">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {type === "trip" ? "Trips" : type === "expense" ? "Expenses" : type === "chat" ? "Chats" : "People"}
                        </div>
                        {items.slice(0, 3).map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left",
                              "hover:bg-secondary/80 transition-colors"
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                              {getIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors"
                >
                  View all {results.length} results
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
