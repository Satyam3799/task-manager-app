export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type ApiError = { error: string };

export async function apiFetch<T>(
  path: string,
  opts?: { method?: string; body?: unknown; token?: string | null }
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts?.method ?? (opts?.body ? "POST" : "GET"),
    headers: {
      "content-type": "application/json",
      ...(opts?.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const message = (json && typeof json.error === "string" && json.error) || "Request failed";
    throw new Error(message);
  }
  return json as T;
}

