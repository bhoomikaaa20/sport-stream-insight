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

      {/* Live ticker */}
      <TickerStrip />

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

      {/* Features grid */}
      <FeaturesSection />

      {/* How it works */}
      <HowItWorks />

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

      {/* Testimonials */}
      <Testimonials />

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}

function TickerStrip() {
  const items = [
    "IND 287/4 (42.3) · Kohli 89* · Rahul 54*",
    "AUS vs ENG · Tea break · 198/3",
    "T20 World Cup · Group B · Live",
    "SA chasing 245 · Need 67 off 48",
    "Player of the match · J. Bumrah 4/22",
    "NZ vs PAK · Toss won by NZ · Bowl first",
    "Highest run-rate today · 9.84 RPO",
    "Wicket! Maxwell c & b Jadeja · 34(22)",
  ];
  const loop = [...items, ...items];
  return (
    <div className="border-y border-border bg-scoreboard overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex shrink-0 items-center gap-2 rounded-sm bg-primary px-2.5 py-1 shadow-[var(--shadow-glow-red)]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground live-pulse" />
          <span className="text-[10px] font-display uppercase tracking-widest text-primary-foreground">
            Live wire
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track flex gap-8 whitespace-nowrap font-mono text-xs text-foreground/80">
            {loop.map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-secondary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Activity className="h-5 w-5" />,
      title: "Ball-by-ball",
      body: "Every delivery captured. Boundaries, wickets and dot balls update the moment they happen.",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Run-rate analytics",
      body: "Required vs current run-rate, partnership graphs and momentum shifts in real time.",
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Player heatmaps",
      body: "Strike rates, dismissal patterns and bowler match-ups for every player on the field.",
    },
    {
      icon: <Gauge className="h-5 w-5" />,
      title: "Live win predictor",
      body: "Probability engine recalculates after every over so you always know who's in front.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Verified scoring",
      body: "Admin-curated scorecards with audit trails — no guesswork, no stale data.",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Broadcast UI",
      body: "ESPN-grade presentation tuned for big screens, second screens and mobile alike.",
    },
  ];
  return (
    <section className="border-y border-border bg-broadcast">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl">
          <span className="text-[10px] font-display uppercase tracking-[0.25em] text-primary">
            Why CrickCast
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-wide">
            Built for the pace of the game
          </h2>
          <p className="mt-3 text-muted-foreground">
            From the first ball to the final wicket, every metric is engineered for clarity under pressure.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-md border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow-red)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary border border-primary/30">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg tracking-wide">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Big stats row */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
          {[
            { v: "2.1M", l: "Balls tracked" },
            { v: "184ms", l: "Avg update latency" },
            { v: "98.7%", l: "Scoring accuracy" },
            { v: "24/7", l: "Live coverage" },
          ].map((s) => (
            <div key={s.l} className="bg-scoreboard px-6 py-8 text-center">
              <p className="scoreboard-digits text-3xl md:text-4xl text-primary">{s.v}</p>
              <p className="mt-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: <Users className="h-5 w-5" />,
      title: "Set up the squad",
      body: "Admins create matches, add teams and register players from the broadcast control room.",
    },
    {
      n: "02",
      icon: <Clock className="h-5 w-5" />,
      title: "Score in real time",
      body: "Live scoring panel pushes every event to viewers within milliseconds.",
    },
    {
      n: "03",
      icon: <Eye className="h-5 w-5" />,
      title: "Fans tune in",
      body: "Anyone can follow scoreboards, player cards and momentum charts as the over unfolds.",
    },
    {
      n: "04",
      icon: <Trophy className="h-5 w-5" />,
      title: "Insights at full time",
      body: "Tournament-wide leaderboards, strike-rate ladders and award-grade highlight stats.",
    },
  ];
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-display uppercase tracking-[0.25em] text-secondary">
            The workflow
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-wide">
            From toss to trophy
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          A four-step pipeline that takes a match from the captain's call to the post-match analysis without a beat missed.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.n}
            className="relative rounded-md border border-border bg-card p-6 overflow-hidden"
          >
            <span className="scoreboard-digits absolute -top-2 -right-2 text-7xl text-primary/10 select-none">
              {s.n}
            </span>
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary/10 text-secondary border border-secondary/30">
                {s.icon}
              </div>
              <h3 className="mt-4 font-display text-lg tracking-wide">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      q: "The fastest scoreboard I've used in a control room. Updates land before the broadcast feed catches up.",
      a: "Ravi Menon",
      r: "Match producer · Stadium Live",
    },
    {
      q: "Our fans stopped refreshing other apps. CrickCast became the second screen overnight.",
      a: "Aisha Patel",
      r: "Digital lead · State Cricket Board",
    },
    {
      q: "Player heatmaps and partnership graphs are tournament-grade. Genuinely broadcast quality.",
      a: "Daniel Pereira",
      r: "Analyst · Pace & Spin Podcast",
    },
  ];
  return (
    <section className="border-y border-border bg-broadcast">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-6 w-1 bg-secondary" />
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wide">
            From the press box
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quotes.map((t) => (
            <figure
              key={t.a}
              className="relative rounded-md border border-border bg-card p-6"
            >
              <Quote className="h-6 w-6 text-primary/40" />
              <blockquote className="mt-3 text-sm text-foreground/90 leading-relaxed">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3">
                <p className="font-display text-sm tracking-wide">{t.a}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                  {t.r}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-br from-card to-scoreboard p-10 md:p-16 text-center shadow-[var(--shadow-broadcast)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.62_0.24_27/0.18),transparent_60%)] pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-sm bg-primary/10 px-3 py-1 mb-6 border border-primary/30">
            <span className="h-1.5 w-1.5 rounded-full bg-primary live-pulse" />
            <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
              Take the field
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Your scoreboard. <span className="text-primary">Your story.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join the broadcast. Sign up to follow your team — or claim admin access to run the next match like a producer.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/matches">Browse matches</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
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
