"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useSession();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          setError("Full name is required");
          setLoading(false);
          return;
        }
        await register(email, password, fullName);
      }
      router.push("/command-center");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--aiva-bg)] px-4">
      {/* Background grid pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(52, 211, 153, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] mb-4">
            <span className="text-2xl font-bold text-[var(--aiva-accent)] tracking-tight">
              Ai
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
            Sign in to <span className="text-[var(--aiva-accent)]">AIVA</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--aiva-text-muted)]">
            AI Virtual Advisor — Wealth Management Workstation
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-xl p-8 shadow-2xl shadow-black/50">
          {/* Mode tabs */}
          <div className="flex mb-6 bg-[var(--aiva-bg)] rounded-lg p-1 border border-[var(--aiva-border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-[var(--aiva-surface-hover)] text-[var(--aiva-accent)] shadow-sm"
                  : "text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-secondary)]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "register"
                  ? "bg-[var(--aiva-surface-hover)] text-[var(--aiva-accent)] shadow-sm"
                  : "text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-secondary)]"
              }`}
            >
              Register
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-lg text-[var(--aiva-text-primary)] text-sm placeholder-[var(--aiva-text-faint)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30 transition-colors"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advisor@firm.com"
                required
                className="w-full px-4 py-3 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-lg text-[var(--aiva-text-primary)] text-sm placeholder-[var(--aiva-text-faint)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30 transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-lg text-[var(--aiva-text-primary)] text-sm placeholder-[var(--aiva-text-faint)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30 transition-colors"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-[var(--aiva-accent)] hover:bg-[var(--aiva-accent-hover)] text-[var(--aiva-bg)] font-semibold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--aiva-accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--aiva-surface-elevated)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle link */}
          <p className="mt-6 text-center text-sm text-[var(--aiva-text-muted)]">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-[var(--aiva-accent)] hover:text-[var(--aiva-accent-hover)] font-medium transition-colors"
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--aiva-text-faint)]">
            AIVA Platform v1.0 &middot; Secure connection
          </p>
        </div>
      </div>
    </div>
  );
}
