import { NextResponse } from "next/server";
import {
  getCatchUp,
  isCatchUpStoreConfigured,
  putCatchUp,
} from "@/lib/catchup-store";
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

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/catchups/[id] — load latest invite. */
export async function GET(_request: Request, context: RouteContext) {
  if (!isCatchUpStoreConfigured()) return storeUnavailable();

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const catchUp = await getCatchUp(id);
    if (!catchUp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(catchUp);
  } catch (err) {
    console.error("GET /api/catchups/[id]", err);
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  }
}

/** PUT /api/catchups/[id] — replace entire CatchUp document. */
export async function PUT(request: Request, context: RouteContext) {
  if (!isCatchUpStoreConfigured()) return storeUnavailable();

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected CatchUp body" }, { status: 400 });
  }

  const catchUp = { ...(body as CatchUp), id };

  if (
    typeof catchUp.title !== "string" ||
    typeof catchUp.createdAt !== "string" ||
    !Array.isArray(catchUp.participants)
  ) {
    return NextResponse.json({ error: "Invalid CatchUp" }, { status: 400 });
  }

  try {
    const saved = await putCatchUp(catchUp);
    return NextResponse.json(saved);
  } catch (err) {
    console.error("PUT /api/catchups/[id]", err);
    return NextResponse.json({ error: "Failed to save invite" }, { status: 500 });
  }
}
