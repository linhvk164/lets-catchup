"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { customAlphabet } from "nanoid";
import { findMeetingSlots, getSelectedSlot } from "@/lib/scheduler";
import { apiGetCatchUp, apiPutCatchUp } from "@/lib/catchup-api";
import {
  buildSharePath,
  decodeCatchUp,
  loadCatchUp,
  resolveCatchUp,
  saveCatchUp,
} from "@/lib/storage";
import type { CatchUp, MeetingSlot, Participant } from "@/lib/types";

const participantId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function createParticipantId(): string {
  return participantId();
}

function mergeLocalPhoto(remote: CatchUp, local: CatchUp | null): CatchUp {
  if (!local?.photo?.dataUrl) return remote;
  return {
    ...remote,
    photo: remote.photo
      ? { ...remote.photo, dataUrl: local.photo.dataUrl }
      : local.photo,
  };
}

/**
 * Single source of truth for a catch-up invitation.
 * Shared state lives on the server; localStorage is a cache only.
 */
export function useCatchUp(id: string, encodedFromUrl?: string | null) {
  const [catchUp, setCatchUp] = useState<CatchUp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRemote = useCallback(async () => {
    setError(null);
    const local = loadCatchUp(id);

    // Legacy fat URL: upsert once, then clean the address bar.
    if (encodedFromUrl) {
      const fromUrl = decodeCatchUp(encodedFromUrl);
      if (fromUrl && fromUrl.id === id) {
        const merged = resolveCatchUp(id, encodedFromUrl) ?? fromUrl;
        try {
          const saved = await apiPutCatchUp(merged);
          const withPhoto = mergeLocalPhoto(saved, local);
          saveCatchUp(withPhoto);
          setCatchUp(withPhoto);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", buildSharePath(id));
          }
          return;
        } catch (err) {
          // Fall back to URL/local snapshot if store is down
          setCatchUp(merged);
          setError(err instanceof Error ? err.message : "Failed to sync invite");
          return;
        }
      }
    }

    try {
      const remote = await apiGetCatchUp(id);
      if (remote) {
        const withPhoto = mergeLocalPhoto(remote, local);
        saveCatchUp(withPhoto);
        setCatchUp(withPhoto);
        return;
      }
      // Not on server yet — use local cache if present
      if (local) {
        setCatchUp(local);
        return;
      }
      setCatchUp(null);
    } catch (err) {
      if (local) {
        setCatchUp(local);
        setError(err instanceof Error ? err.message : "Failed to load invite");
        return;
      }
      setCatchUp(null);
      setError(err instanceof Error ? err.message : "Failed to load invite");
    }
  }, [id, encodedFromUrl]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await loadRemote();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRemote]);

  // Refetch when returning to the tab so the same link shows latest changes.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void loadRemote();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadRemote]);

  const persist = useCallback(async (next: CatchUp) => {
    setCatchUp(next);
    saveCatchUp(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", buildSharePath(next.id));
    }
    try {
      const saved = await apiPutCatchUp(next);
      const withPhoto = mergeLocalPhoto(saved, next);
      saveCatchUp(withPhoto);
      setCatchUp(withPhoto);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invite");
    }
  }, []);

  const slots = useMemo(
    () => (catchUp ? findMeetingSlots(catchUp, { limit: 12 }) : []),
    [catchUp]
  );

  const selectedSlot = useMemo(() => {
    if (!catchUp) return null;
    if (!catchUp.selectedSlotId) return null;
    return getSelectedSlot(catchUp, slots) ?? null;
  }, [catchUp, slots]);

  const bestSlot = useMemo(() => {
    if (selectedSlot) return selectedSlot;
    return slots[0] ?? null;
  }, [selectedSlot, slots]);

  const moreCount = Math.max(0, slots.length - 1);

  const shareUrl = useMemo(() => {
    if (!catchUp || typeof window === "undefined") return null;
    return `${window.location.origin}${buildSharePath(catchUp)}`;
  }, [catchUp]);

  const addParticipant = useCallback(
    (participant: Omit<Participant, "id"> & { id?: string }) => {
      if (!catchUp) return;
      const next: CatchUp = {
        ...catchUp,
        selectedSlotId: undefined,
        participants: [
          ...catchUp.participants,
          { ...participant, id: participant.id ?? createParticipantId() },
        ],
      };
      void persist(next);
    },
    [catchUp, persist]
  );

  const updateParticipant = useCallback(
    (participantId: string, patch: Partial<Participant>) => {
      if (!catchUp) return;
      const next: CatchUp = {
        ...catchUp,
        selectedSlotId: undefined,
        participants: catchUp.participants.map((p) =>
          p.id === participantId ? { ...p, ...patch, id: p.id } : p
        ),
      };
      void persist(next);
    },
    [catchUp, persist]
  );

  const removeParticipant = useCallback(
    (participantId: string) => {
      if (!catchUp) return;
      if (catchUp.participants.length <= 1) return;
      const next: CatchUp = {
        ...catchUp,
        selectedSlotId: undefined,
        participants: catchUp.participants.filter((p) => p.id !== participantId),
      };
      void persist(next);
    },
    [catchUp, persist]
  );

  const selectSlot = useCallback(
    (slot: MeetingSlot) => {
      if (!catchUp) return;
      void persist({ ...catchUp, selectedSlotId: slot.id });
    },
    [catchUp, persist]
  );

  const updateTitle = useCallback(
    (title: string) => {
      if (!catchUp) return;
      void persist({ ...catchUp, title });
    },
    [catchUp, persist]
  );

  const updateMessage = useCallback(
    (message: string) => {
      if (!catchUp) return;
      void persist({ ...catchUp, message });
    },
    [catchUp, persist]
  );

  return {
    catchUp,
    loading,
    error,
    slots,
    bestSlot,
    selectedSlot,
    moreCount,
    shareUrl,
    persist,
    reload: loadRemote,
    addParticipant,
    updateParticipant,
    removeParticipant,
    selectSlot,
    updateTitle,
    updateMessage,
  };
}
