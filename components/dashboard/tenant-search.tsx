"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Result {
  id: string;
  name: string;
  role: string;
  phone: string;
  roomNumber: string;
}

export function TenantSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search (~1s) — waits until the user stops typing. State updates
  // happen in the change handler and the async callback (not synchronously in
  // the effect body).
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tenants/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          setResults(await res.json());
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 1000);
    return () => clearTimeout(handle);
  }, [query]);

  function onChange(value: string) {
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
    } else {
      setLoading(false);
      setResults([]);
      setOpen(false);
    }
  }

  // Close the results panel on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/dashboard/tenants/${id}`);
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search tenants by name or room number…"
          className="swiss-focus h-10 pl-9 pr-9 text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">
              {loading ? "Searching…" : "No tenants found."}
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => go(r.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{r.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        Room {r.roomNumber || "—"} · {r.phone}
                      </span>
                    </span>
                    <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                      {r.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
