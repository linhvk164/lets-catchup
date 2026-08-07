import { Redis } from "@upstash/redis";
import type { CatchUp } from "@/lib/types";

/** 90 days — refreshed on every write so active invites stay alive. */
export const CATCHUP_TTL_SECONDS = 60 * 60 * 24 * 90;

const KEY_PREFIX = "catchup:";

function keyFor(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

let redis: Redis | null = null;

function getRedis(): Redis {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. See .env.example."
    );
  }
  redis = new Redis({ url, token });
  return redis;
}

export function isCatchUpStoreConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/** Server-only: load invite by id. */
export async function getCatchUp(id: string): Promise<CatchUp | null> {
  if (!id) return null;
  const value = await getRedis().get<CatchUp>(keyFor(id));
  if (!value) return null;
  // Upstash may return already-parsed JSON objects
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as CatchUp;
    } catch {
      return null;
    }
  }
  return value;
}

/** Server-only: create or replace full invite document; refreshes TTL. */
export async function putCatchUp(catchUp: CatchUp): Promise<CatchUp> {
  if (!catchUp?.id) {
    throw new Error("CatchUp id is required");
  }
  // Strip local-only photo data URLs before persisting
  const toStore: CatchUp = {
    ...catchUp,
    photo: catchUp.photo
      ? {
          src: catchUp.photo.src,
          caption: catchUp.photo.caption,
          credit: catchUp.photo.credit,
        }
      : undefined,
  };
  await getRedis().set(keyFor(catchUp.id), toStore, {
    ex: CATCHUP_TTL_SECONDS,
  });
  return toStore;
}

export async function createCatchUp(catchUp: CatchUp): Promise<CatchUp> {
  return putCatchUp(catchUp);
}
