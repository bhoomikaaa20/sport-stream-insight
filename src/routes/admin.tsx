import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Pencil, Check, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type Stat = Database["public"]["Tables"]["player_stats"]["Row"];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CrickCast" },
      { name: "description", content: "Admin panel to manage cricket matches, players and live scores." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="container mx-auto px-4 py-10">Loading…</div>;
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account doesn't have admin privileges yet. Use the button below to claim admin
          access for this demo project.
        </p>
        <ClaimAdminButton userId={user.id} />
        <p className="text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-6 w-1 bg-primary" />
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wide">Admin</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Manage matches, players and live scores.
      </p>

      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="scoring">Live scoring</TabsTrigger>
        </TabsList>
        <TabsContent value="matches" className="mt-6">
          <MatchesAdmin />
        </TabsContent>
        <TabsContent value="players" className="mt-6">
          <PlayersAdmin />
        </TabsContent>
        <TabsContent value="scoring" className="mt-6">
          <ScoringAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClaimAdminButton({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);
  async function claim() {
    setBusy(true);
    // Allowed: user_roles has policy "Admins manage roles" — but bootstrap relies on
    // there being no admin yet. We use a security-definer-style insert via RPC isn't
    // set up; for a demo, allow self-grant if no admin exists. We do this by trying
    // to insert; if an admin exists, RLS will reject and we tell the user.
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    setBusy(false);
    if (error) {
      toast.error("Couldn't grant admin. An admin already exists — ask them to add you.");
    } else {
      toast.success("Admin granted! Refreshing…");
      setTimeout(() => window.location.reload(), 800);
    }
  }
  return (
    <Button onClick={claim} disabled={busy} className="mt-6">
      {busy ? "Granting…" : "Claim admin access"}
    </Button>
  );
}

/* ---------- Matches ---------- */

function MatchesAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [creating, setCreating] = useState(false);

  async function load() {
    const { data } = await supabase.from("matches").select("*").order("created_at", { ascending: false });
    setMatches(data ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-5 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg uppercase tracking-wide">Create match</h2>
          <Button size="sm" variant="ghost" onClick={() => setCreating((v) => !v)}>
            {creating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        {creating && <CreateMatchForm onCreated={() => { setCreating(false); void load(); }} />}
      </Card>

      <div className="space-y-3">
        {matches.map((m) => (
          <MatchAdminRow key={m.id} match={m} onChange={load} />
        ))}
        {matches.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No matches yet</p>
        )}
      </div>
    </div>
  );
}

function CreateMatchForm({ onCreated }: { onCreated: () => void }) {
  const [teamA, setTeamA] = useState("");
  const [teamAShort, setTeamAShort] = useState("");
  const [teamB, setTeamB] = useState("");
  const [teamBShort, setTeamBShort] = useState("");
  const [venue, setVenue] = useState("");
  const [format, setFormat] = useState("T20");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("matches").insert({
      team_a: teamA.trim(),
      team_a_short: teamAShort.trim().toUpperCase().slice(0, 4),
      team_b: teamB.trim(),
      team_b_short: teamBShort.trim().toUpperCase().slice(0, 4),
      venue: venue.trim() || null,
      format,
      status: "upcoming",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Match created");
    setTeamA(""); setTeamAShort(""); setTeamB(""); setTeamBShort(""); setVenue("");
    onCreated();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <Field label="Team A">
        <Input value={teamA} onChange={(e) => setTeamA(e.target.value)} required maxLength={60} placeholder="India" />
      </Field>
      <Field label="Team A short">
        <Input value={teamAShort} onChange={(e) => setTeamAShort(e.target.value)} required maxLength={4} placeholder="IND" />
      </Field>
      <Field label="Team B">
        <Input value={teamB} onChange={(e) => setTeamB(e.target.value)} required maxLength={60} placeholder="Australia" />
      </Field>
      <Field label="Team B short">
        <Input value={teamBShort} onChange={(e) => setTeamBShort(e.target.value)} required maxLength={4} placeholder="AUS" />
      </Field>
      <Field label="Venue">
        <Input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={120} placeholder="MCG" />
      </Field>
      <Field label="Format">
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="T20">T20</SelectItem>
            <SelectItem value="ODI">ODI</SelectItem>
            <SelectItem value="Test">Test</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create match"}
        </Button>
      </div>
    </form>
  );
}

function MatchAdminRow({ match, onChange }: { match: Match; onChange: () => void }) {
  const [busy, setBusy] = useState(false);

  async function update(patch: Partial<Match>) {
    setBusy(true);
    const { error } = await supabase.from("matches").update(patch).eq("id", match.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else onChange();
  }

  async function remove() {
    if (!confirm(`Delete ${match.team_a} vs ${match.team_b}?`)) return;
    const { error } = await supabase.from("matches").delete().eq("id", match.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onChange(); }
  }

  return (
    <Card className="p-4 border-border bg-card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-display uppercase tracking-wide">
            {match.team_a_short} <span className="text-muted-foreground">vs</span> {match.team_b_short}
          </p>
          <p className="text-xs text-muted-foreground">{match.format} · {match.venue ?? "TBD"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={match.status} onValueChange={(v) => update({ status: v })} disabled={busy}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Players ---------- */

function PlayersAdmin() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("Batter");
  const [jersey, setJersey] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("players").select("*").order("team").order("name");
    setPlayers(data ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("players").insert({
      name: name.trim(),
      team: team.trim(),
      role,
      jersey_number: jersey ? Number(jersey) : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Player added");
    setName(""); setJersey("");
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete player?")) return;
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 border-border bg-card">
        <h2 className="font-display text-lg uppercase tracking-wide mb-4">Add player</h2>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-5">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></Field>
          <Field label="Team"><Input value={team} onChange={(e) => setTeam(e.target.value)} required maxLength={60} /></Field>
          <Field label="Role">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Batter">Batter</SelectItem>
                <SelectItem value="Bowler">Bowler</SelectItem>
                <SelectItem value="All-rounder">All-rounder</SelectItem>
                <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Jersey #"><Input type="number" value={jersey} onChange={(e) => setJersey(e.target.value)} min={0} max={999} /></Field>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Adding…" : "Add"}</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-2 md:grid-cols-2">
        {players.map((p) => (
          <Card key={p.id} className="p-3 border-border bg-card flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.team} · {p.role}{p.jersey_number != null ? ` · #${p.jersey_number}` : ""}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Scoring ---------- */

function ScoringAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState<string>("");
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    void supabase
      .from("matches")
      .select("*")
      .neq("status", "completed")
      .order("status")
      .then(({ data }) => {
        setMatches(data ?? []);
        if (!matchId && data && data.length > 0) setMatchId(data[0].id);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!matchId) return;
    Promise.all([
      supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
      supabase.from("players").select("*"),
      supabase.from("player_stats").select("*").eq("match_id", matchId),
    ]).then(([m, p, s]) => {
      setMatch(m.data);
      setPlayers(p.data ?? []);
      setStats(s.data ?? []);
    });
  }, [matchId]);

  async function reload() {
    if (!matchId) return;
    const [m, s] = await Promise.all([
      supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
      supabase.from("player_stats").select("*").eq("match_id", matchId),
    ]);
    setMatch(m.data);
    setStats(s.data ?? []);
  }

  async function updateMatch(patch: Partial<Match>) {
    if (!matchId) return;
    const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
    if (error) toast.error(error.message); else void reload();
  }

  if (matches.length === 0) {
    return (
      <Card className="p-10 text-center border-border bg-card">
        <p className="text-muted-foreground">No active or upcoming matches. Create one in the Matches tab.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 border-border bg-card">
        <Label className="mb-2 block">Select match</Label>
        <Select value={matchId} onValueChange={setMatchId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {matches.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.team_a_short} vs {m.team_b_short} · {m.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {match && (
        <>
          <Card className="p-5 border-border bg-card">
            <h3 className="font-display text-lg uppercase tracking-wide mb-4">Scoreboard control</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <TeamScoreEditor
                label={`${match.team_a} (${match.team_a_short})`}
                runs={match.team_a_runs}
                wickets={match.team_a_wickets}
                overs={match.team_a_overs}
                onChange={(p) =>
                  updateMatch({
                    team_a_runs: p.runs ?? match.team_a_runs,
                    team_a_wickets: p.wickets ?? match.team_a_wickets,
                    team_a_overs: p.overs ?? match.team_a_overs,
                  })
                }
              />
              <TeamScoreEditor
                label={`${match.team_b} (${match.team_b_short})`}
                runs={match.team_b_runs}
                wickets={match.team_b_wickets}
                overs={match.team_b_overs}
                onChange={(p) =>
                  updateMatch({
                    team_b_runs: p.runs ?? match.team_b_runs,
                    team_b_wickets: p.wickets ?? match.team_b_wickets,
                    team_b_overs: p.overs ?? match.team_b_overs,
                  })
                }
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3 mt-4 pt-4 border-t border-border">
              <div>
                <Label className="text-xs">Batting team</Label>
                <Select
                  value={match.batting_team ?? ""}
                  onValueChange={(v) => updateMatch({ batting_team: v })}
                >
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Team A — {match.team_a_short}</SelectItem>
                    <SelectItem value="B">Team B — {match.team_b_short}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Innings</Label>
                <Select
                  value={String(match.current_innings)}
                  onValueChange={(v) => updateMatch({ current_innings: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st innings</SelectItem>
                    <SelectItem value="2">2nd innings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Result summary</Label>
                <Input
                  defaultValue={match.result_summary ?? ""}
                  onBlur={(e) => updateMatch({ result_summary: e.target.value || null })}
                  placeholder="e.g. India won by 6 wickets"
                />
              </div>
            </div>
          </Card>

          <PlayerStatsEditor
            matchId={matchId}
            match={match}
            players={players}
            stats={stats}
            onChange={reload}
          />
        </>
      )}
    </div>
  );
}

function TeamScoreEditor({
  label, runs, wickets, overs, onChange,
}: {
  label: string;
  runs: number;
  wickets: number;
  overs: number;
  onChange: (p: { runs?: number; wickets?: number; overs?: number }) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-broadcast p-4">
      <p className="font-display text-sm uppercase tracking-wide mb-3 truncate">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <NumField label="Runs" value={runs} onCommit={(v) => onChange({ runs: v })} />
        <NumField label="Wickets" value={wickets} max={10} onCommit={(v) => onChange({ wickets: v })} />
        <NumField label="Overs" value={overs} step={0.1} onCommit={(v) => onChange({ overs: v })} />
      </div>
    </div>
  );
}

function NumField({
  label, value, max, step, onCommit,
}: {
  label: string;
  value: number;
  max?: number;
  step?: number;
  onCommit: (v: number) => void;
}) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-widest">{label}</Label>
      <Input
        type="number"
        value={v}
        min={0}
        max={max}
        step={step ?? 1}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onCommit(Number(v) || 0)}
        className="scoreboard-digits"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function PlayerStatsEditor({
  matchId, match, players, stats, onChange,
}: {
  matchId: string;
  match: Match;
  players: Player[];
  stats: Stat[];
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [pickedPlayer, setPickedPlayer] = useState("");

  const teams = [match.team_a, match.team_b];
  const matchPlayers = players.filter((p) => teams.includes(p.team));
  const playerById = new Map(matchPlayers.map((p) => [p.id, p]));
  const trackedIds = new Set(stats.map((s) => s.player_id));
  const available = matchPlayers.filter((p) => !trackedIds.has(p.id));

  async function addPlayer() {
    if (!pickedPlayer) return;
    const { error } = await supabase.from("player_stats").insert({
      match_id: matchId,
      player_id: pickedPlayer,
    });
    if (error) toast.error(error.message);
    else { setPickedPlayer(""); setAdding(false); onChange(); }
  }

  async function updateStat(id: string, patch: Partial<Stat>) {
    const { error } = await supabase.from("player_stats").update(patch).eq("id", id);
    if (error) toast.error(error.message); else onChange();
  }

  async function removeStat(id: string) {
    const { error } = await supabase.from("player_stats").delete().eq("id", id);
    if (error) toast.error(error.message); else onChange();
  }

  return (
    <Card className="p-5 border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg uppercase tracking-wide">Player stats</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          {adding ? <X className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> Add</>}
        </Button>
      </div>

      {adding && (
        <div className="flex gap-2 mb-4">
          <Select value={pickedPlayer} onValueChange={setPickedPlayer}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Pick a player" /></SelectTrigger>
            <SelectContent>
              {available.length === 0 && (
                <div className="px-2 py-1 text-xs text-muted-foreground">All players added</div>
              )}
              {available.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} · {p.team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addPlayer} disabled={!pickedPlayer}><Check className="h-4 w-4" /></Button>
        </div>
      )}

      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No players tracked yet</p>
      ) : (
        <div className="space-y-2">
          {stats.map((s) => {
            const p = playerById.get(s.player_id);
            return (
              <StatRow
                key={s.id}
                playerName={p?.name ?? "Unknown"}
                team={p?.team ?? ""}
                stat={s}
                onUpdate={(patch) => updateStat(s.id, patch)}
                onRemove={() => removeStat(s.id)}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}

function StatRow({
  playerName, team, stat, onUpdate, onRemove,
}: {
  playerName: string;
  team: string;
  stat: Stat;
  onUpdate: (patch: Partial<Stat>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border bg-broadcast">
      <div className="flex items-center justify-between p-3">
        <div className="min-w-0">
          <p className="font-medium truncate">{playerName}</p>
          <p className="text-xs text-muted-foreground truncate">{team}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span><span className="scoreboard-digits text-base">{stat.runs}</span>({stat.balls_faced})</span>
          <span className="text-secondary"><span className="scoreboard-digits text-base">{stat.wickets}</span>w</span>
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
      {open && (
        <div className="p-3 pt-0 grid grid-cols-3 md:grid-cols-6 gap-2">
          <NumField label="Runs" value={stat.runs} onCommit={(v) => onUpdate({ runs: v })} />
          <NumField label="Balls" value={stat.balls_faced} onCommit={(v) => onUpdate({ balls_faced: v })} />
          <NumField label="4s" value={stat.fours} onCommit={(v) => onUpdate({ fours: v })} />
          <NumField label="6s" value={stat.sixes} onCommit={(v) => onUpdate({ sixes: v })} />
          <NumField label="Wkts" value={stat.wickets} onCommit={(v) => onUpdate({ wickets: v })} />
          <NumField label="Conc" value={stat.runs_conceded} onCommit={(v) => onUpdate({ runs_conceded: v })} />
          <NumField label="Overs" value={stat.overs_bowled} step={0.1} onCommit={(v) => onUpdate({ overs_bowled: v })} />
          <div className="flex items-end gap-2 col-span-2">
            <Button
              size="sm"
              variant={stat.is_striker ? "default" : "outline"}
              onClick={() => onUpdate({ is_striker: !stat.is_striker })}
            >
              {stat.is_striker ? "● Striker" : "Set striker"}
            </Button>
            <Button
              size="sm"
              variant={stat.is_out ? "destructive" : "outline"}
              onClick={() => onUpdate({ is_out: !stat.is_out })}
            >
              {stat.is_out ? "Out" : "Mark out"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
