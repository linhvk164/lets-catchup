import { NextResponse } from "next/server";
import {
  createCatchUp,
  isCatchUpStoreConfigured,
} from "@/lib/catchup-store";
import { createCatchUpId } from "@/lib/storage";
import type { CatchUp } from "@/lib/types";

function storeUnavailable() {
  return NextResponse.json(
    {
      error:
        "Invite storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    },
    { status: 503 }
  );
}

function isCatchUp(body: unknown): body is CatchUp {
  if (!body || typeof body !== "object") return false;
  const c = body as CatchUp;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.createdAt === "string" &&
    Array.isArray(c.participants)
  );
}

/** POST /api/catchups — create invite; body is full CatchUp (id optional). */
export async function POST(request: Request) {
  if (!isCatchUpStoreConfigured()) return storeUnavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected CatchUp body" }, { status: 400 });
  }

  const incoming = body as Partial<CatchUp>;
  const id =
    typeof incoming.id === "string" && incoming.id.trim()
      ? incoming.id.trim()
      : createCatchUpId();

  const catchUp: CatchUp = {
    ...(incoming as CatchUp),
    id,
    title: String(incoming.title ?? "").trim() || "Let's Catch-up",
    duration: (incoming.duration as CatchUp["duration"]) ?? 30,
    createdAt: incoming.createdAt || new Date().toISOString(),
    participants: Array.isArray(incoming.participants)
      ? incoming.participants
      : [],
  };

  if (!isCatchUp(catchUp)) {
    return NextResponse.json({ error: "Invalid CatchUp" }, { status: 400 });
  }

  try {
    const saved = await createCatchUp(catchUp);
    return NextResponse.json({ id: saved.id, catchUp: saved }, { status: 201 });
  } catch (err) {
    console.error("POST /api/catchups", err);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
