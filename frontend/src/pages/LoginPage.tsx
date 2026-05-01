import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const nav = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Login</h1>
      <form
        className="space-y-3 rounded-xl border bg-white p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          try {
            const res = await apiFetch<{ token: string; user: any }>("/api/auth/login", {
              method: "POST",
              body: { email, password },
            });
            setSession({ token: res.token, user: res.user });
            nav("/dashboard");
          } catch (err: any) {
            setError(err?.message ?? "Login failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="text-center text-sm text-slate-600">
          No account?{" "}
          <Link className="font-medium text-slate-900 underline" to="/signup">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

