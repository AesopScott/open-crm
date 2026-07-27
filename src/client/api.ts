const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function appUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${appBase}${normalized}`;
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: {} };
  if (body) {
    (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(appUrl(path), opts);
  const data = await r.json();
  if (!r.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as T;
}
