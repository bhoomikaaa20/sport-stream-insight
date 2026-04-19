import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, Shield, BarChart3 } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl font-display font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off the field</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is out of bounds. Let's get you back to the action.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CrickCast — Live Cricket Analytics" },
      {
        name: "description",
        content:
          "Real-time cricket scoreboards, player stats and match analytics. Broadcast-grade insights, live as they happen.",
      },
      { property: "og:title", content: "CrickCast — Live Cricket Analytics" },
      {
        property: "og:description",
        content: "Live cricket scoreboards and analytics, broadcast-grade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </AuthProvider>
  );
}

function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const navItem = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`text-sm font-display uppercase tracking-wider transition-colors ${
          active ? "text-primary" : "text-foreground/70 hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary shadow-[var(--shadow-glow-red)]">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-wider">CrickCast</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Live Analytics
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItem("/", "Live")}
          {navItem("/matches", "Matches")}
          {navItem("/players", "Players")}
          {navItem("/insights", "Insights")}
          {isAdmin && navItem("/admin", "Admin")}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-1 text-[10px] font-display uppercase tracking-wider text-secondary-foreground">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Join
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-broadcast">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs font-mono uppercase tracking-wider">
            CrickCast Broadcast © {new Date().getFullYear()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          Real-time cricket analytics · Built for the love of the game
        </p>
      </div>
    </footer>
  );
}
