import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type PlayerStat = Database["public"]["Tables"]["player_stats"]["Row"];

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .order("status", { ascending: true })
        .order("scheduled_at", { ascending: false, nullsFirst: false });
      if (mounted) {
        setMatches(data ?? []);
        setLoading(false);
      }
    }

    void load();

    const channel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { matches, loading };
}

export function useMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    let mounted = true;

    async function load() {
      const [{ data: m }, { data: s }] = await Promise.all([
        supabase.from("matches").select("*").eq("id", matchId!).maybeSingle(),
        supabase.from("player_stats").select("*").eq("match_id", matchId!),
      ]);
      if (mounted) {
        setMatch(m);
        setStats(s ?? []);
        setLoading(false);
      }
    }

    void load();

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => {
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_stats", filter: `match_id=eq.${matchId}` },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [matchId]);

  return { match, stats, loading };
}
