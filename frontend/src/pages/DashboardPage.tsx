import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Shell } from "../components/Shell";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  updatedAt: string;
  _count: { tasks: number };
};

export function DashboardPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<{ projects: Project[] }>("/api/projects", { token }),
  });

  const stats = useMemo(() => {
    const list = projectsQ.data?.projects ?? [];
    const totalProjects = list.length;
    const totalTasks = list.reduce((sum, p) => sum + (p._count?.tasks ?? 0), 0);
    return { totalProjects, totalTasks };
  }, [projectsQ.data]);

  const dashboardQ = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      apiFetch<{
        stats: { tasksByStatus: Record<string, number>; overdueCount: number };
        overdue: Array<{
          id: string;
          title: string;
          status: string;
          dueDate: string;
          project: { id: string; name: string };
        }>;
      }>("/api/dashboard", { token }),
  });

  return (
    <Shell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Projects</div>
          <div className="text-2xl font-semibold">{stats.totalProjects}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Tasks (all projects)</div>
          <div className="text-2xl font-semibold">{stats.totalTasks}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Overdue tasks</div>
          <div className="text-2xl font-semibold">{dashboardQ.data?.stats.overdueCount ?? 0}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Create project</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await apiFetch("/api/projects", {
                token,
                method: "POST",
                body: { name: newName, description: newDesc || undefined },
              });
              setNewName("");
              setNewDesc("");
              await qc.invalidateQueries({ queryKey: ["projects"] });
            }}
          >
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-800">
              Create
            </button>
          </form>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Your projects</h2>
          {projectsQ.isLoading && <div className="mt-3 text-sm text-slate-600">Loading…</div>}
          {projectsQ.error && (
            <div className="mt-3 text-sm text-red-600">
              {(projectsQ.error as any)?.message ?? "Failed to load"}
            </div>
          )}
          <div className="mt-3 divide-y">
            {(projectsQ.data?.projects ?? []).map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="block py-3 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-slate-600">{p._count.tasks} tasks</div>
                </div>
                {p.description && <div className="text-sm text-slate-600">{p.description}</div>}
              </Link>
            ))}
            {projectsQ.data?.projects?.length === 0 && (
              <div className="py-6 text-sm text-slate-600">No projects yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Tasks by status</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            {(["TODO", "IN_PROGRESS", "DONE"] as const).map((k) => (
              <div key={k} className="rounded-lg border p-3">
                <div className="text-slate-600">{k}</div>
                <div className="text-xl font-semibold">
                  {dashboardQ.data?.stats.tasksByStatus?.[k] ?? 0}
                </div>
              </div>
            ))}
          </div>
          {dashboardQ.isLoading && <div className="mt-3 text-sm text-slate-600">Loading…</div>}
          {dashboardQ.error && (
            <div className="mt-3 text-sm text-red-600">
              {(dashboardQ.error as any)?.message ?? "Failed to load"}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Overdue list</h2>
          <div className="mt-3 space-y-2">
            {(dashboardQ.data?.overdue ?? []).map((t) => (
              <Link
                key={t.id}
                to={`/projects/${t.project.id}`}
                className="block rounded-lg border p-3 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-red-600">Overdue</div>
                </div>
                <div className="text-sm text-slate-600">{t.project.name}</div>
              </Link>
            ))}
            {(dashboardQ.data?.overdue?.length ?? 0) === 0 && (
              <div className="py-6 text-sm text-slate-600">No overdue tasks.</div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

