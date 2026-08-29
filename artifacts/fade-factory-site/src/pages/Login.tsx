import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { resolveLoginRedirect } from "@/lib/loginRedirect";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const sessionExpired = params.get("expired") === "1";
  const redirectParam = params.get("redirect") ?? "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Login failed");
        return;
      }

      const data = await res.json() as { role: string };
      navigate(resolveLoginRedirect(data.role, redirectParam));
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <DotLottieReact
            src="/FF_Logo_1777738558539.lottie"
            loop
            autoplay
            style={{ width: 100, height: 100 }}
          />
        </div>

        <h1 className="font-display text-3xl uppercase tracking-widest text-white text-center mb-1">
          Fade Factory
        </h1>
        <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-10">
          Staff Portal
        </p>

        {sessionExpired && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-center">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Session expired — please sign in again</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-red transition-colors"
              placeholder="username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-red transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-accent-red text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-red text-white font-black uppercase tracking-widest py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center">
          <a href="/" className="text-gray-600 text-xs uppercase tracking-widest hover:text-white transition-colors">
            ← Back to site
          </a>
        </p>
      </div>
    </div>
  );
}
