"use client";

import { FlippablePostcard } from "@/components/postcard";
import type { CatchUp, MeetingSlot, Participant } from "@/lib/types";

export function PostcardPreviewModal({
  open,
  onClose,
  catchUp,
  bestSlot,
  isConfirmed,
  moreCount,
  onViewMore,
  onAddParticipant,
  onEditParticipant,
  onViewAvailability,
  onCopyLink,
  onShare,
  onJoin,
  copied,
}: {
  open: boolean;
  onClose: () => void;
  catchUp: CatchUp;
  bestSlot?: MeetingSlot | null;
  isConfirmed?: boolean;
  moreCount?: number;
  onViewMore?: () => void;
  onAddParticipant?: () => void;
  onEditParticipant?: (participant: Participant) => void;
  onViewAvailability?: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
  onJoin?: () => void;
  copied?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 pt-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white px-4 pb-6 pt-3 sm:rounded-none sm:bg-transparent sm:p-0">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/90 px-3 py-1.5 text-sm text-ink shadow sm:bg-white"
          >
            Close
          </button>
        </div>
        <FlippablePostcard
          catchUp={catchUp}
          bestSlot={bestSlot}
          isConfirmed={isConfirmed}
          moreCount={moreCount}
          initialSide="back"
          onViewMore={onViewMore}
          onAddParticipant={onAddParticipant}
          onEditParticipant={onEditParticipant}
          onViewAvailability={onViewAvailability}
          onCopyLink={onCopyLink}
          onShare={onShare}
          onJoin={onJoin}
          copied={copied}
          fitViewport
        />
      </div>
    </div>
  );
}
