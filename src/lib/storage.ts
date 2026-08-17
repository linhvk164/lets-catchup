import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { customAlphabet } from "nanoid";
import type { CatchUp, Participant } from "./types";

const STORAGE_PREFIX = "lets-catchup:";
const VIEWER_PREFIX = "lets-catchup:viewer:";
/** Prefix marks LZ-compressed share payloads (vs legacy raw base64url). */
const COMPRESSED_PREFIX = "z.";
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export type ViewerRole = "creator" | "invitee";

export type CatchUpViewer = {
  role: ViewerRole;
  /** Local participant id — creator's own, or invitee's after they join. */
  participantId?: string;
};

export function createCatchUpId(): string {
  return nanoid();
}

function storageKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

function viewerKey(id: string): string {
  return `${VIEWER_PREFIX}${id}`;
}

export function getCatchUpViewer(id: string): CatchUpViewer | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(viewerKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CatchUpViewer;
    if (parsed.role !== "creator" && parsed.role !== "invitee") return null;
    return parsed;
  } catch {
    return null;
  }
}

function isQuotaExceeded(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    err.code === 22
  );
}

function isCatchUpRecordKey(key: string): boolean {
  return key.startsWith(STORAGE_PREFIX) && !key.startsWith(VIEWER_PREFIX);
}

/** Drop other cached invites, largest first, to free localStorage space. */
function pruneCatchUpCache(keepId?: string): void {
  const keepKey = keepId ? storageKey(keepId) : null;
  const entries: { key: string; size: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !isCatchUpRecordKey(key) || key === keepKey) continue;
    entries.push({ key, size: localStorage.getItem(key)?.length ?? 0 });
  }
  entries.sort((a, b) => b.size - a.size);
  for (const { key } of entries) {
    localStorage.removeItem(key);
  }
}

function withoutLocalPhoto(catchUp: CatchUp): CatchUp {
  if (!catchUp.photo?.dataUrl) return catchUp;
  return {
    ...catchUp,
    photo: {
      src: catchUp.photo.src,
      caption: catchUp.photo.caption,
      credit: catchUp.photo.credit,
    },
  };
}

function writeLocal(key: string, value: string, keepId?: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (!isQuotaExceeded(err)) throw err;
  }
  pruneCatchUpCache(keepId);
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (!isQuotaExceeded(err)) throw err;
    return false;
  }
}

export function setCatchUpViewer(id: string, viewer: CatchUpViewer): void {
  if (typeof window === "undefined") return;
  writeLocal(viewerKey(id), JSON.stringify(viewer), id);
}

export function saveCatchUp(catchUp: CatchUp): void {
  if (typeof window === "undefined") return;
  const key = storageKey(catchUp.id);
  if (writeLocal(key, JSON.stringify(catchUp), catchUp.id)) return;
  writeLocal(key, JSON.stringify(withoutLocalPhoto(catchUp)), catchUp.id);
}

/** Mark this browser as the invitation creator. */
export function markAsCreator(id: string, participantId: string): void {
  setCatchUpViewer(id, { role: "creator", participantId });
}

/** Mark this browser as an invitee (optionally after joining). */
export function markAsInvitee(id: string, participantId?: string): void {
  setCatchUpViewer(id, { role: "invitee", participantId });
}

export function loadCatchUp(id: string): CatchUp | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CatchUp;
  } catch {
    return null;
  }
}

/** Drop empty / default fields so share URLs stay smaller. */
function leanParticipant(p: Participant): Participant {
  const lean: Participant = {
    id: p.id,
    name: p.name,
    timezone: p.timezone,
    cityLabel: p.cityLabel,
    availabilityText: p.availabilityText,
    rules: p.rules,
    exceptions: p.exceptions?.length ? p.exceptions : [],
  };
  if (p.countryCode) lean.countryCode = p.countryCode;
  if (p.countryLabel) lean.countryLabel = p.countryLabel;
  if (p.flagEmoji) lean.flagEmoji = p.flagEmoji;
  if (p.preferences?.length) lean.preferences = p.preferences;
  if (p.flexibility) lean.flexibility = p.flexibility;
  if (p.isCreator) lean.isCreator = true;
  return lean;
}

function toShareableCatchUp(catchUp: CatchUp): CatchUp {
  const shareable: CatchUp = {
    id: catchUp.id,
    title: catchUp.title,
    duration: catchUp.duration,
    createdAt: catchUp.createdAt,
    participants: catchUp.participants.map(leanParticipant),
  };
  if (catchUp.message) shareable.message = catchUp.message;
  if (catchUp.messageFont) shareable.messageFont = catchUp.messageFont;
  if (catchUp.selectedSlotId) shareable.selectedSlotId = catchUp.selectedSlotId;
  if (catchUp.photo) {
    shareable.photo = {
      src: catchUp.photo.src,
      caption: catchUp.photo.caption,
      credit: catchUp.photo.credit,
    };
  }
  return shareable;
}

function encodeLegacyBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeLegacyBase64Url(encoded: string): string | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Encode catch-up for share links.
 * Strips local-only photo data URLs, leans empty fields, LZ-compresses.
 */
export function encodeCatchUp(catchUp: CatchUp): string {
  const json = JSON.stringify(toShareableCatchUp(catchUp));
  const compressed = compressToEncodedURIComponent(json);
  if (compressed) return `${COMPRESSED_PREFIX}${compressed}`;
  return encodeLegacyBase64Url(json);
}

export function decodeCatchUp(encoded: string): CatchUp | null {
  if (!encoded) return null;

  try {
    let json: string | null = null;
    if (encoded.startsWith(COMPRESSED_PREFIX)) {
      json = decompressFromEncodedURIComponent(
        encoded.slice(COMPRESSED_PREFIX.length)
      );
    } else {
      // Legacy raw base64url, or bare lz-string without prefix
      json = decodeLegacyBase64Url(encoded);
      if (!json) {
        json = decompressFromEncodedURIComponent(encoded);
      }
    }
    if (!json) return null;
    return JSON.parse(json) as CatchUp;
  } catch {
    return null;
  }
}

export function buildSharePath(catchUp: CatchUp | string): string {
  const id = typeof catchUp === "string" ? catchUp : catchUp.id;
  return `/catchup/${id}`;
}

/**
 * Resolve invite for legacy clients. Prefer API (`apiGetCatchUp`) for shared state.
 * Still merges `?p=` payloads into localStorage for one-shot migration.
 */
export function resolveCatchUp(
  id: string,
  encoded?: string | null
): CatchUp | null {
  const local = loadCatchUp(id);
  if (encoded) {
    const fromUrl = decodeCatchUp(encoded);
    if (fromUrl && fromUrl.id === id) {
      const basePhoto = fromUrl.photo ?? local?.photo;
      const merged: CatchUp = {
        ...fromUrl,
        photo: basePhoto
          ? {
              src: basePhoto.src,
              caption: basePhoto.caption,
              credit: basePhoto.credit,
              dataUrl: local?.photo?.dataUrl,
            }
          : undefined,
      };
      saveCatchUp(merged);
      return merged;
    }
  }
  return local;
}
