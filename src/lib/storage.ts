import { customAlphabet } from "nanoid";
import type { CatchUp } from "./types";

const STORAGE_PREFIX = "lets-catchup:";
const VIEWER_PREFIX = "lets-catchup:viewer:";
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

export function setCatchUpViewer(id: string, viewer: CatchUpViewer): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(viewerKey(id), JSON.stringify(viewer));
}

/** Mark this browser as the invitation creator. */
export function markAsCreator(id: string, participantId: string): void {
  setCatchUpViewer(id, { role: "creator", participantId });
}

/** Mark this browser as an invitee (optionally after joining). */
export function markAsInvitee(id: string, participantId?: string): void {
  setCatchUpViewer(id, { role: "invitee", participantId });
}

export function saveCatchUp(catchUp: CatchUp): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(catchUp.id), JSON.stringify(catchUp));
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

/** Encode catch-up for share links. Strip local-only photo data URLs to keep links small. */
export function encodeCatchUp(catchUp: CatchUp): string {
  const shareable: CatchUp = {
    ...catchUp,
    photo: catchUp.photo
      ? {
          src: catchUp.photo.src,
          caption: catchUp.photo.caption,
          credit: catchUp.photo.credit,
        }
      : undefined,
  };
  const json = JSON.stringify(shareable);
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

export function decodeCatchUp(encoded: string): CatchUp | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as CatchUp;
  } catch {
    return null;
  }
}

export function buildSharePath(catchUp: CatchUp): string {
  return `/catchup/${catchUp.id}?p=${encodeCatchUp(catchUp)}`;
}

export function resolveCatchUp(id: string, encoded?: string | null): CatchUp | null {
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
