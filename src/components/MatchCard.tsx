import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Match = Database["public"]["Tables"]["matches"]["Row"];

interface Props {
  match: Match;
}

export function MatchCard({ match }: Props) {
  const isLive = match.status === "live";
  const battingA = match.batting_team === "A";
  const battingB = match.batting_team === "B";

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="block group"
    >
      <Card className="overflow-hidden border-border bg-card shadow-[var(--shadow-card)] transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[var(--shadow-glow-red)]">
        {/* Status bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-broadcast">
          <div className="flex items-center gap-2">
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              · {match.format}
            </span>
          </div>
          {match.venue && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate max-w-[140px]">
              {match.venue}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="p-4 space-y-3">
          <TeamRow
            name={match.team_a}
            short={match.team_a_short}
            runs={match.team_a_runs}
            wickets={match.team_a_wickets}
            overs={match.team_a_overs}
            batting={battingA}
            played={match.current_innings >= 1 && (battingA || match.team_a_overs > 0)}
          />
          <TeamRow
            name={match.team_b}
            short={match.team_b_short}
            runs={match.team_b_runs}
            wickets={match.team_b_wickets}
            overs={match.team_b_overs}
            batting={battingB}
            played={match.current_innings >= 2 || match.team_b_overs > 0}
          />
        </div>

        {/* Result strip */}
        {match.result_summary && (
          <div className="border-t border-border bg-broadcast px-4 py-2">
            <p className="text-xs font-display uppercase tracking-wider text-secondary">
              {match.result_summary}
            </p>
          </div>
        )}
      </Card>
    </Link>
  );
}

function TeamRow({
  name,
  short,
  runs,
  wickets,
  overs,
  batting,
  played,
}: {
  name: string;
  short: string;
  runs: number;
  wickets: number;
  overs: number;
  batting: boolean;
  played: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-sm font-display text-sm font-bold tracking-wider ${
            batting ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          {short}
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm uppercase tracking-wide truncate">{name}</p>
          {batting && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
              Batting
            </p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        {played ? (
          <>
            <p className="scoreboard-digits text-2xl leading-none">
              {runs}
              <span className="text-muted-foreground">/{wickets}</span>
            </p>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider mt-0.5">
              {overs} OV
            </p>
          </>
        ) : (
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Yet to bat</p>
        )}
      </div>
    </div>
  );
}
