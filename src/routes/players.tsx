import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Stat = Database["public"]["Tables"]["player_stats"]["Row"];

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Players — CrickCast" },
      { name: "description", content: "Browse all players, teams and aggregated career stats across matches." },
      { property: "og:title", content: "Players — CrickCast" },
      { property: "og:description", content: "All players and career stats." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("players").select("*").order("name"),
      supabase.from("player_stats").select("*"),
    ]).then(([p, s]) => {
      setPlayers(p.data ?? []);
      setStats(s.data ?? []);
      setLoading(false);
    });
  }, []);

  const aggregated = players.map((p) => {
    const ps = stats.filter((s) => s.player_id === p.id);
    return {
      ...p,
      matches: ps.length,
      runs: ps.reduce((a, s) => a + s.runs, 0),
      wickets: ps.reduce((a, s) => a + s.wickets, 0),
      fours: ps.reduce((a, s) => a + s.fours, 0),
      sixes: ps.reduce((a, s) => a + s.sixes, 0),
    };
  });

  const teams = Array.from(new Set(players.map((p) => p.team)));
  const [team, setTeam] = useState<string>("all");
  const visible = team === "all" ? aggregated : aggregated.filter((p) => p.team === team);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-6 w-1 bg-primary" />
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wide">Players</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        {players.length} player{players.length === 1 ? "" : "s"} across {teams.length} team
        {teams.length === 1 ? "" : "s"}
      </p>

      {teams.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip active={team === "all"} onClick={() => setTeam("all")}>
            All teams
          </FilterChip>
          {teams.map((t) => (
            <FilterChip key={t} active={team === t} onClick={() => setTeam(t)}>
              {t}
            </FilterChip>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-md bg-card animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center">
          <p className="font-display uppercase tracking-wide text-muted-foreground">
            No players added yet
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <Card
              key={p.id}
              className="border-border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg uppercase tracking-wide truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{p.team}</p>
                  <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider">
                    {p.role}
                  </Badge>
                </div>
                {p.jersey_number != null && (
                  <div className="scoreboard-digits text-3xl text-primary leading-none">
                    {p.jersey_number}
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-border">
                <Mini label="M" value={p.matches} />
                <Mini label="Runs" value={p.runs} />
                <Mini label="Wkts" value={p.wickets} />
                <Mini label="6s" value={p.sixes} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm border px-3 py-1.5 text-xs font-display uppercase tracking-widest transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[9px] font-display uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="scoreboard-digits text-base">{value}</p>
    </div>
  );
}
