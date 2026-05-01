import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Shell(props: { title: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-full">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="font-semibold">
            Task Manager
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">{user?.email}</span>
            <button
              className="rounded-md border px-3 py-1.5 hover:bg-slate-50"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">{props.title}</h1>
        </div>
        {props.children}
      </main>
    </div>
  );
}

