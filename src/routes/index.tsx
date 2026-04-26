import { createFileRoute, Link } from "@tanstack/react-router";
import { useMatches } from "@/lib/realtime";
import { MatchCard } from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Radio,
  BarChart3,
  Users,
  Zap,
  Trophy,
  Activity,
  TrendingUp,
  Target,
  Gauge,
  Eye,
  Sparkles,
  Clock,
  ShieldCheck,
  Quote,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CrickCast — Live Cricket Scores & Analytics" },
      {
        name: "description",
        content:
          "Follow live cricket matches with broadcast-grade scoreboards, real-time player stats and instant analytics.",
      },
      { property: "og:title", content: "CrickCast — Live Cricket" },
      {
        property: "og:description",
        content: "Live scoreboards and player analytics, broadcast-grade.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { matches, loading } = useMatches();
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming").slice(0, 4);
  const recent = matches.filter((m) => m.status === "completed").slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl fade-up">
            <div className="inline-flex items-center gap-2 rounded-sm bg-primary/10 px-3 py-1 mb-6 border border-primary/30">
              <span className="h-1.5 w-1.5 rounded-full bg-primary live-pulse" />
              <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
                Broadcast quality · Live now
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight">
              Every <span className="text-primary">ball.</span>
              <br />
              Every <span className="text-secondary">stat.</span>
              <br />
              In real time.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Live scoreboards, player performance breakdowns, and match insights — all updated
              instantly as the action unfolds on the pitch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/matches">
                  <Radio className="h-4 w-4" /> Watch live
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/insights">
                  <BarChart3 className="h-4 w-4" /> View insights
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              <Stat label="Live now" value={live.length} icon={<Radio className="h-4 w-4" />} />
              <Stat
                label="Matches"
                value={matches.length}
                icon={<Zap className="h-4 w-4" />}
              />
              <Stat
                label="Upcoming"
                value={upcoming.length}
                icon={<Users className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live now */}
      <Section
        title="Live now"
        accent
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/matches">
              All matches <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      >
        {loading ? (
          <Skeletons />
        ) : live.length === 0 ? (
          <EmptyState
            title="No live matches right now"
            body="Check back soon, or browse upcoming fixtures and recent results below."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </Section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Section title="Upcoming">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </Section>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <Section title="Recent results">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recent.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </Section>
      )}

      {/* CTA */}
      {matches.length === 0 && !loading && (
        <Section title="Get started">
          <EmptyState
            title="The pitch is empty"
            body="Sign in as an admin to add matches, players and live scores. Or sign up to follow your team."
            cta={
              <div className="flex gap-2 mt-4">
                <Button asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Create account
                  </Link>
                </Button>
              </div>
            }
          />
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  accent,
  action,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`h-6 w-1 ${accent ? "bg-primary" : "bg-secondary"}`} />
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wide">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-display uppercase tracking-widest">{label}</span>
      </div>
      <p className="scoreboard-digits text-3xl mt-1">{value}</p>
    </div>
  );
}

function Skeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-44 rounded-md bg-card border border-border animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center">
      <h3 className="font-display text-xl uppercase tracking-wide">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
      {cta}
    </div>
  );
}
