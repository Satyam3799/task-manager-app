import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Shell } from "../components/Shell";

type UserLite = { id: string; email: string; name?: string | null };
type Member = { role: "OWNER" | "ADMIN" | "MEMBER"; user: UserLite };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate?: string | null;
  updatedAt: string;
  assignedTo?: UserLite | null;
};

export function ProjectPage() {
  const { projectId } = useParams();
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Member["role"]>("MEMBER");

  const projectQ = useQuery({
    queryKey: ["project", projectId],
    enabled: !!projectId,
    queryFn: () =>
      apiFetch<{ project: any }>(`/api/projects/${projectId}`, {
        token,
      }),
  });

  const tasks: Task[] = projectQ.data?.project?.tasks ?? [];
  const members: Member[] = projectQ.data?.project?.members ?? [];
  const myRole = useMemo(() => {
    const me = members.find((m) => m.user.id === user?.id);
    return me?.role ?? "MEMBER";
  }, [members, user?.id]);
  const canManageMembers = myRole === "OWNER" || myRole === "ADMIN";

  const taskStats = useMemo(() => {
    const by = { TODO: 0, IN_PROGRESS: 0, DONE: 0 } as Record<Task["status"], number>;
    for (const t of tasks) by[t.status] += 1;
    return by;
  }, [tasks]);

  return (
    <Shell title={projectQ.data?.project?.name ?? "Project"}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Todo</div>
          <div className="text-2xl font-semibold">{taskStats.TODO}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">In progress</div>
          <div className="text-2xl font-semibold">{taskStats.IN_PROGRESS}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Done</div>
          <div className="text-2xl font-semibold">{taskStats.DONE}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Create task</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await apiFetch(`/api/projects/${projectId}/tasks`, {
                token,
                method: "POST",
                body: { title, description: description || undefined },
              });
              setTitle("");
              setDescription("");
              await qc.invalidateQueries({ queryKey: ["project", projectId] });
            }}
          >
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full rounded-md border px-3 py-2"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <button className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-800">
              Add
            </button>
          </form>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Tasks</h2>
          {projectQ.isLoading && <div className="mt-3 text-sm text-slate-600">Loading…</div>}
          {projectQ.error && (
            <div className="mt-3 text-sm text-red-600">
              {(projectQ.error as any)?.message ?? "Failed to load"}
            </div>
          )}
          <div className="mt-3 space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    {t.description && <div className="text-sm text-slate-600">{t.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border px-2 py-1 text-sm"
                      value={t.status}
                      onChange={async (e) => {
                        await apiFetch(`/api/projects/${projectId}/tasks/${t.id}`, {
                          token,
                          method: "PATCH",
                          body: { status: e.target.value },
                        });
                        await qc.invalidateQueries({ queryKey: ["project", projectId] });
                      }}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                    <select
                      className="max-w-[12rem] rounded-md border px-2 py-1 text-sm"
                      value={t.assignedTo?.id ?? ""}
                      onChange={async (e) => {
                        await apiFetch(`/api/projects/${projectId}/tasks/${t.id}`, {
                          token,
                          method: "PATCH",
                          body: { assignedToId: e.target.value || null },
                        });
                        await qc.invalidateQueries({ queryKey: ["project", projectId] });
                      }}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.user.id} value={m.user.id}>
                          {m.user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <div>Assigned: {t.assignedTo?.email ?? "—"}</div>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={async () => {
                      await apiFetch(`/api/projects/${projectId}/tasks/${t.id}`, {
                        token,
                        method: "DELETE",
                      });
                      await qc.invalidateQueries({ queryKey: ["project", projectId] });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <div className="py-6 text-sm text-slate-600">No tasks yet.</div>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Members</h2>
          <div className="mt-3 space-y-2">
            {members.map((m) => (
              <div key={m.user.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="text-sm">
                  <div className="font-medium">{m.user.email}</div>
                  <div className="text-xs text-slate-500">{m.role}</div>
                </div>
                {canManageMembers && m.user.id !== user?.id && (
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={async () => {
                      await apiFetch(`/api/projects/${projectId}/members/${m.user.id}`, {
                        token,
                        method: "DELETE",
                      });
                      await qc.invalidateQueries({ queryKey: ["project", projectId] });
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Add member</h2>
          {!canManageMembers ? (
            <div className="mt-3 text-sm text-slate-600">Only ADMIN/OWNER can add members.</div>
          ) : (
            <form
              className="mt-3 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await apiFetch(`/api/projects/${projectId}/members`, {
                  token,
                  method: "POST",
                  body: { email: memberEmail, role: memberRole === "OWNER" ? "ADMIN" : memberRole },
                });
                setMemberEmail("");
                setMemberRole("MEMBER");
                await qc.invalidateQueries({ queryKey: ["project", projectId] });
              }}
            >
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="user@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                type="email"
                required
              />
              <select
                className="w-full rounded-md border px-3 py-2"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as any)}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-800">
                Add / Update role
              </button>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}

