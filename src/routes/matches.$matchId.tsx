import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMatch } from "@/lib/realtime";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];

export const Route = createFileRoute("/matches/$matchId")({
  head: () => ({
    meta: [
      { title: "Match Centre — CrickCast" },
      { name: "description", content: "Live cricket match scoreboard with batting and bowling stats." },
    ],
  }),
  component: MatchDetailPage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="font-display text-3xl">Match not found</h1>
      <Button asChild className="mt-4">
        <Link to="/matches">Back to matches</Link>
      </Button>
    </div>
  ),
});

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const { match, stats, loading } = useMatch(matchId);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    void supabase
      .from("players")
      .select("*")
      .then(({ data }) => setPlayers(data ?? []));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="h-64 rounded-md bg-card animate-pulse" />
      </div>
    );
  }
  if (!match) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Match not found</h1>
        <Button asChild className="mt-4">
          <Link to="/matches">Back to matches</Link>
        </Button>
      </div>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));
  const isLive = match.status === "live";

  const teamAStats = stats.filter((s) => playerById.get(s.player_id)?.team === match.team_a);
  const teamBStats = stats.filter((s) => playerById.get(s.player_id)?.team === match.team_b);

  const battingTeamStats = match.batting_team === "A" ? teamAStats : teamBStats;
  const bowlingTeamStats = match.batting_team === "A" ? teamBStats : teamAStats;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/matches"
        className="inline-flex items-center gap-1 text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-3 w-3" /> All matches
      </Link>

      {/* Scoreboard */}
      <Card className="overflow-hidden border-border bg-scoreboard shadow-[var(--shadow-broadcast)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-broadcast">
          <div className="flex items-center gap-3">
            {isLive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-live live-pulse" />
                <span className="font-display text-xs font-bold uppercase tracking-widest text-live">
                  Live
                </span>
              </>
            ) : (
              <Badge variant="outline" className="font-display text-[10px] uppercase tracking-widest">
                {match.status}
              </Badge>
            )}
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {match.format} · Innings {match.current_innings}
            </span>
          </div>
          {match.venue && (
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {match.venue}
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <ScoreCell
            name={match.team_a}
            short={match.team_a_short}
            runs={match.team_a_runs}
            wickets={match.team_a_wickets}
            overs={match.team_a_overs}
            batting={match.batting_team === "A"}
          />
          <ScoreCell
            name={match.team_b}
            short={match.team_b_short}
            runs={match.team_b_runs}
            wickets={match.team_b_wickets}
            overs={match.team_b_overs}
            batting={match.batting_team === "B"}
          />
        </div>

        {match.result_summary && (
          <div className="border-t border-border bg-broadcast px-6 py-3">
            <p className="font-display text-sm uppercase tracking-wider text-secondary">
              {match.result_summary}
            </p>
          </div>
        )}
      </Card>

      {/* Stats tables */}
      <div className="grid gap-6 mt-8 lg:grid-cols-2">
        <BattingTable
          title="Batting"
          stats={battingTeamStats}
          playerById={playerById}
        />
        <BowlingTable
          title="Bowling"
          stats={bowlingTeamStats.filter((s) => s.overs_bowled > 0 || s.wickets > 0)}
          playerById={playerById}
        />
      </div>
    </div>
  );
}

function ScoreCell({
  name,
  short,
  runs,
  wickets,
  overs,
  batting,
}: {
  name: string;
  short: string;
  runs: number;
  wickets: number;
  overs: number;
  batting: boolean;
}) {
  return (
    <div className={`p-6 ${batting ? "bg-gradient-to-br from-primary/10 to-transparent" : ""}`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-sm font-display text-base font-bold ${
            batting ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          {short}
        </div>
        <div>
          <p className="font-display text-lg uppercase tracking-wide">{name}</p>
          {batting && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
              ● Batting
            </p>
          )}
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <p className="scoreboard-digits text-6xl leading-none">
          {runs}
          <span className="text-muted-foreground text-4xl">/{wickets}</span>
        </p>
        <p className="scoreboard-digits text-xl text-muted-foreground">({overs} ov)</p>
      </div>
    </div>
  );
}

function BattingTable({
  title,
  stats,
  playerById,
}: {
  title: string;
  stats: Database["public"]["Tables"]["player_stats"]["Row"][];
  playerById: Map<string, Player>;
}) {
  const sorted = [...stats].sort((a, b) => b.runs - a.runs);
  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-broadcast flex items-center gap-2">
        <div className="h-4 w-1 bg-primary" />
        <h2 className="font-display text-sm uppercase tracking-widest">{title}</h2>
      </div>
      {sorted.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">No batting data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left p-3">Batter</th>
                <th className="text-right p-3">R</th>
                <th className="text-right p-3">B</th>
                <th className="text-right p-3">4s</th>
                <th className="text-right p-3">6s</th>
                <th className="text-right p-3">SR</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const p = playerById.get(s.player_id);
                const sr = s.balls_faced > 0 ? ((s.runs / s.balls_faced) * 100).toFixed(1) : "—";
                return (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-broadcast/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p?.name ?? "Unknown"}</span>
                        {s.is_striker && (
                          <span className="text-[9px] font-mono text-primary">●</span>
                        )}
                        {s.is_out && (
                          <span className="text-[9px] font-mono text-muted-foreground">out</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right scoreboard-digits font-bold">{s.runs}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{s.balls_faced}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{s.fours}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{s.sixes}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{sr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function BowlingTable({
  title,
  stats,
  playerById,
}: {
  title: string;
  stats: Database["public"]["Tables"]["player_stats"]["Row"][];
  playerById: Map<string, Player>;
}) {
  const sorted = [...stats].sort((a, b) => b.wickets - a.wickets);
  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-broadcast flex items-center gap-2">
        <div className="h-4 w-1 bg-secondary" />
        <h2 className="font-display text-sm uppercase tracking-widest">{title}</h2>
      </div>
      {sorted.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">No bowling data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left p-3">Bowler</th>
                <th className="text-right p-3">O</th>
                <th className="text-right p-3">R</th>
                <th className="text-right p-3">W</th>
                <th className="text-right p-3">Econ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const p = playerById.get(s.player_id);
                const econ = s.overs_bowled > 0 ? (s.runs_conceded / s.overs_bowled).toFixed(2) : "—";
                return (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-broadcast/50">
                    <td className="p-3 font-medium">{p?.name ?? "Unknown"}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{s.overs_bowled}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{s.runs_conceded}</td>
                    <td className="p-3 text-right scoreboard-digits font-bold text-secondary">
                      {s.wickets}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{econ}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
