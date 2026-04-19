import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Trophy, Target, Flame, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Stat = Database["public"]["Tables"]["player_stats"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — CrickCast" },
      { name: "description", content: "Cricket analytics: top run-scorers, leading wicket-takers, six-hitters and match trends." },
      { property: "og:title", content: "Insights — CrickCast" },
      { property: "og:description", content: "Top performers and match analytics." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("players").select("*"),
      supabase.from("player_stats").select("*"),
      supabase.from("matches").select("*"),
    ]).then(([p, s, m]) => {
      setPlayers(p.data ?? []);
      setStats(s.data ?? []);
      setMatches(m.data ?? []);
      setLoading(false);
    });
  }, []);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const aggregated = players.map((p) => {
    const ps = stats.filter((s) => s.player_id === p.id);
    return {
      id: p.id,
      name: p.name,
      team: p.team,
      runs: ps.reduce((a, s) => a + s.runs, 0),
      wickets: ps.reduce((a, s) => a + s.wickets, 0),
      sixes: ps.reduce((a, s) => a + s.sixes, 0),
      fours: ps.reduce((a, s) => a + s.fours, 0),
      balls: ps.reduce((a, s) => a + s.balls_faced, 0),
    };
  });

  const topRuns = [...aggregated].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topWickets = [...aggregated].sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  const topSixes = [...aggregated].sort((a, b) => b.sixes - a.sixes).slice(0, 5);

  const totalRuns = aggregated.reduce((a, p) => a + p.runs, 0);
  const totalWickets = aggregated.reduce((a, p) => a + p.wickets, 0);
  const totalSixes = aggregated.reduce((a, p) => a + p.sixes, 0);
  const liveCount = matches.filter((m) => m.status === "live").length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="h-96 rounded-md bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-6 w-1 bg-primary" />
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wide">Insights</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Tournament-wide analytics, updated in real time.
      </p>

      {/* KPI tiles */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-10">
        <KPI label="Total runs" value={totalRuns} icon={<TrendingUp className="h-4 w-4" />} accent="primary" />
        <KPI label="Total wickets" value={totalWickets} icon={<Target className="h-4 w-4" />} accent="secondary" />
        <KPI label="Sixes hit" value={totalSixes} icon={<Flame className="h-4 w-4" />} accent="primary" />
        <KPI label="Live matches" value={liveCount} icon={<Trophy className="h-4 w-4" />} accent="secondary" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top Run-Scorers" accent="primary">
          {topRuns.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topRuns} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 252)" horizontal={false} />
                <XAxis type="number" stroke="oklch(0.72 0.02 250)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="oklch(0.72 0.02 250)"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.13 0.025 250)",
                    border: "1px solid oklch(0.3 0.02 252)",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                  cursor={{ fill: "oklch(0.62 0.24 27 / 0.1)" }}
                />
                <Bar dataKey="runs" fill="oklch(0.62 0.24 27)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Leading Wicket-Takers" accent="secondary">
          {topWickets.length === 0 || topWickets.every((p) => p.wickets === 0) ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topWickets} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 252)" horizontal={false} />
                <XAxis type="number" stroke="oklch(0.72 0.02 250)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="oklch(0.72 0.02 250)"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.13 0.025 250)",
                    border: "1px solid oklch(0.3 0.02 252)",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                  cursor={{ fill: "oklch(0.85 0.18 92 / 0.1)" }}
                />
                <Bar dataKey="wickets" fill="oklch(0.85 0.18 92)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Six hitters */}
      <Card className="mt-6 border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-broadcast flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm uppercase tracking-widest">Six-Hitting Leaderboard</h2>
        </div>
        {topSixes.length === 0 || topSixes.every((p) => p.sixes === 0) ? (
          <Empty />
        ) : (
          <div className="divide-y divide-border">
            {topSixes.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <span className="scoreboard-digits text-2xl text-muted-foreground w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display uppercase tracking-wide truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.team}</p>
                </div>
                <div className="scoreboard-digits text-2xl text-primary">{p.sixes}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function KPI({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "primary" | "secondary";
}) {
  return (
    <Card className="border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={accent === "primary" ? "text-primary" : "text-secondary"}>{icon}</span>
        <span className="text-[10px] font-display uppercase tracking-widest">{label}</span>
      </div>
      <p className="scoreboard-digits text-3xl mt-2">{value}</p>
    </Card>
  );
}

function ChartCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "primary" | "secondary";
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-broadcast flex items-center gap-2">
        <div className={`h-4 w-1 ${accent === "primary" ? "bg-primary" : "bg-secondary"}`} />
        <h2 className="font-display text-sm uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

function Empty() {
  return (
    <p className="p-10 text-center text-sm text-muted-foreground">
      No data yet — add matches and stats to see analytics.
    </p>
  );
}
