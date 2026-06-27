import { useMemo, useState } from "react";
import { Building2, Check, Plus, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCompanies, type ClientCompany } from "@/hooks/useCompanies";

interface CompanyPickerProps {
  value?: string | null; // company id
  onChange: (company: ClientCompany | null) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  allowClear?: boolean;
}

export function CompanyPicker({
  value,
  onChange,
  className,
  buttonClassName,
  placeholder = "Link to a client/company",
  allowClear = true,
}: CompanyPickerProps) {
  const { companies, addCompany, getCompany } = useCompanies();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = getCompany(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  const showCreate =
    query.trim().length > 0 &&
    !companies.some((c) => c.name.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = () => {
    const company = addCompany(query);
    onChange(company);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-11 justify-start gap-2 font-normal flex-1",
              !selected && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <Building2 className="w-4 h-4 shrink-0 text-primary/70" />
            <span className="truncate">{selected?.name ?? placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-0">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or add a company"
                className="h-9 pl-8"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No companies yet
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/60 text-left",
                  selected?.id === c.id && "bg-muted/40",
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{c.name}</span>
                  {c.industry && (
                    <span className="text-xs text-muted-foreground truncate">· {c.industry}</span>
                  )}
                </span>
                {selected?.id === c.id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
            {showCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border-t border-border hover:bg-muted/60 text-left"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>
                  Add <span className="font-medium">"{query.trim()}"</span>
                </span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {allowClear && selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          onClick={() => onChange(null)}
          aria-label="Clear company"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
