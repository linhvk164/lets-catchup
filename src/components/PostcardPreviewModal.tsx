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
  onEdit,
  onUpdateTitle,
  onUpdateMessage,
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
  onEdit?: () => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateMessage?: (message: string) => void;
  copied?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-5">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[calc(100dvh-2.5rem)] w-full max-w-[calc(100vw-2.5rem)] items-center justify-center">
        <FlippablePostcard
          catchUp={catchUp}
          bestSlot={bestSlot}
          isConfirmed={isConfirmed}
          moreCount={moreCount}
          initialSide="back"
          large
          className="postcard-product--preview"
          onClose={onClose}
          onViewMore={onViewMore}
          onAddParticipant={onAddParticipant}
          onEditParticipant={onEditParticipant}
          onViewAvailability={onViewAvailability}
          onCopyLink={onCopyLink}
          onShare={onShare}
          onJoin={onJoin}
          onEdit={onEdit}
          onUpdateTitle={onUpdateTitle}
          onUpdateMessage={onUpdateMessage}
          copied={copied}
        />
      </div>
    </div>
  );
}
