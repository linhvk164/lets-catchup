import type { CatchUp } from "@/lib/types";

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || res.statusText;
  } catch {
    return res.statusText;
  }
}

/** Client: create invite on the server. */
export async function apiCreateCatchUp(
  catchUp: CatchUp
): Promise<{ id: string; catchUp: CatchUp }> {
  const res = await fetch("/api/catchups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(catchUp),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<{ id: string; catchUp: CatchUp }>;
}

/** Client: load latest invite by id. */
export async function apiGetCatchUp(id: string): Promise<CatchUp | null> {
  const res = await fetch(`/api/catchups/${encodeURIComponent(id)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<CatchUp>;
}

/** Client: replace entire invite document. */
export async function apiPutCatchUp(catchUp: CatchUp): Promise<CatchUp> {
  const res = await fetch(`/api/catchups/${encodeURIComponent(catchUp.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(catchUp),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json() as Promise<CatchUp>;
}
