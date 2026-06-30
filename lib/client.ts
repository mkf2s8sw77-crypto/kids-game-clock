// Browser-side fetch helpers (use basePath so it works behind /kids-game-clock)
import { BASE_PATH } from "./config";

export async function apiGet<T = any>(path: string): Promise<T> {
  const r = await fetch(`${BASE_PATH}${path}`);
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return r.json();
}

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const r = await fetch(`${BASE_PATH}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `${path} -> ${r.status}`);
  return data as T;
}

export async function apiPatch<T = any>(path: string, body?: any): Promise<T> {
  const r = await fetch(`${BASE_PATH}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `PATCH ${path} -> ${r.status}`);
  return data as T;
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const r = await fetch(`${BASE_PATH}${path}`, { method: "DELETE" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `DELETE ${path} -> ${r.status}`);
  return data as T;
}
