import { createFileRoute } from "@tanstack/react-router";
import { useMatches } from "@/lib/realtime";
import { MatchCard } from "@/components/MatchCard";
import { useState } from "react";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "All Matches — CrickCast" },
      { name: "description", content: "Browse all live, upcoming and completed cricket matches with full scoreboards." },
      { property: "og:title", content: "All Matches — CrickCast" },
      { property: "og:description", content: "Live, upcoming and completed cricket matches." },
    ],
  }),
  component: MatchesPage,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function MatchesPage() {
  const { matches, loading } = useMatches();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = filter === "all" ? matches : matches.filter((m) => m.status === filter);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-6 w-1 bg-primary" />
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wide">Matches</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        {matches.length} match{matches.length === 1 ? "" : "es"} on the schedule
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-display uppercase tracking-widest transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-glow-red)]"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-md bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center">
          <p className="font-display uppercase tracking-wide text-muted-foreground">
            No matches in this category
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
