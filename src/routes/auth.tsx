import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — CrickCast" },
      { name: "description", content: "Sign in to CrickCast to manage matches and follow live cricket analytics." },
    ],
  }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  displayName: z.string().trim().min(1).max(60).optional(),
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    void navigate({ to: "/" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = credSchema.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're in!");
        await navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        await navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-primary shadow-[var(--shadow-glow-red)]">
          <Activity className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-wide">
          {mode === "signin" ? "Welcome back" : "Join the broadcast"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to your account" : "Create a free account to get started"}
        </p>
      </div>

      <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Virat K"
                maxLength={60}
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already a member?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        <Link to="/" className="hover:text-foreground">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
