"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { customAlphabet } from "nanoid";
import { findMeetingSlots, getSelectedSlot } from "@/lib/scheduler";
import {
  buildSharePath,
  encodeCatchUp,
  resolveCatchUp,
  saveCatchUp,
} from "@/lib/storage";
import type { CatchUp, MeetingSlot, Participant } from "@/lib/types";

const participantId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function createParticipantId(): string {
  return participantId();
}

/**
 * Single source of truth for a catch-up invitation.
 * Participant edits, time selection, and share payload all flow through here.
 */
export function useCatchUp(id: string, encodedFromUrl?: string | null) {
  const [catchUp, setCatchUp] = useState<CatchUp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = resolveCatchUp(id, encodedFromUrl);
    setCatchUp(data);
    setLoading(false);
  }, [id, encodedFromUrl]);

  const persist = useCallback((next: CatchUp) => {
    // Clear selection if it no longer exists after participant changes
    saveCatchUp(next);
    setCatchUp(next);
    if (typeof window !== "undefined") {
      const path = `${window.location.pathname}?p=${encodeCatchUp(next)}`;
      window.history.replaceState(null, "", path);
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
      persist(next);
    },
    [catchUp, persist]
  );

  const updateParticipant = useCallback(
    (id: string, patch: Partial<Participant>) => {
      if (!catchUp) return;
      const next: CatchUp = {
        ...catchUp,
        selectedSlotId: undefined,
        participants: catchUp.participants.map((p) =>
          p.id === id ? { ...p, ...patch, id: p.id } : p
        ),
      };
      persist(next);
    },
    [catchUp, persist]
  );

  const removeParticipant = useCallback(
    (id: string) => {
      if (!catchUp) return;
      if (catchUp.participants.length <= 1) return;
      const next: CatchUp = {
        ...catchUp,
        selectedSlotId: undefined,
        participants: catchUp.participants.filter((p) => p.id !== id),
      };
      persist(next);
    },
    [catchUp, persist]
  );

  const selectSlot = useCallback(
    (slot: MeetingSlot) => {
      if (!catchUp) return;
      persist({ ...catchUp, selectedSlotId: slot.id });
    },
    [catchUp, persist]
  );

  return {
    catchUp,
    loading,
    slots,
    bestSlot,
    selectedSlot,
    moreCount,
    shareUrl,
    persist,
    addParticipant,
    updateParticipant,
    removeParticipant,
    selectSlot,
  };
}

