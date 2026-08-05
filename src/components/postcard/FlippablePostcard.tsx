"use client";

import { useState } from "react";
import type { CatchUp, MeetingSlot, Participant } from "@/lib/types";
import { PostcardBackContent, PostcardFrontContent } from "./PostcardFaces";

export function FlippablePostcard({
  catchUp,
  bestSlot,
  isConfirmed = false,
  moreCount = 0,
  initialSide = "front",
  onViewMore,
  onAddParticipant,
  onEditParticipant,
  onViewAvailability,
  onCopyLink,
  onShare,
  onJoin,
  copied,
  compact = false,
  fitViewport = false,
  transitionName,
}: {
  catchUp: CatchUp;
  bestSlot?: MeetingSlot | null;
  isConfirmed?: boolean;
  moreCount?: number;
  initialSide?: "front" | "back";
  onViewMore?: () => void;
  onAddParticipant?: () => void;
  onEditParticipant?: (participant: Participant) => void;
  onViewAvailability?: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
  onJoin?: () => void;
  copied?: boolean;
  compact?: boolean;
  fitViewport?: boolean;
  transitionName?: string;
}) {
  const [flipped, setFlipped] = useState(initialSide === "back");

  function flip() {
    setFlipped((v) => !v);
  }

  return (
    <div
      className={[
        "postcard-product",
        compact ? "postcard-product--compact" : "",
        fitViewport ? "postcard-product--viewport" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
    >
      <div
        className="postcard-stage cursor-pointer"
        onClick={flip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            flip();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Flip to front of postcard" : "Flip to back of postcard"}
      >
        <div className={`postcard-flipper ${flipped ? "is-flipped" : ""}`}>
          <div className="postcard-face postcard-face--front">
            <PostcardFrontContent catchUp={catchUp} />
          </div>
          <div className="postcard-face postcard-face--back">
            <PostcardBackContent
              catchUp={catchUp}
              bestSlot={bestSlot}
              isConfirmed={isConfirmed}
              moreCount={moreCount}
              onViewMore={onViewMore}
              onAddParticipant={onAddParticipant}
              onEditParticipant={onEditParticipant}
              onViewAvailability={onViewAvailability}
              onCopyLink={onCopyLink}
              onShare={onShare}
              onJoin={onJoin}
              copied={copied}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={flip}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm text-ink-soft transition hover:text-ink"
      >
        <span aria-hidden>↻</span>
        Flip postcard
      </button>
    </div>
  );
}
