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
  onEdit,
  onUpdateTitle,
  onUpdateMessage,
  copied,
  compact = false,
  large = false,
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
  onEdit?: () => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateMessage?: (message: string) => void;
  copied?: boolean;
  compact?: boolean;
  large?: boolean;
  fitViewport?: boolean;
  transitionName?: string;
}) {
  const [flipped, setFlipped] = useState(initialSide === "back");
  const hasActions = Boolean(onCopyLink || onShare || onJoin || onEdit);

  function flip() {
    setFlipped((v) => !v);
  }

  const secondaryBtn =
    "shrink-0 rounded-xl border border-ink/15 bg-white/80 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ocean/40";

  return (
    <div
      className={[
        "postcard-product",
        compact ? "postcard-product--compact" : "",
        large ? "postcard-product--large" : "",
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
              onUpdateTitle={onUpdateTitle}
              onUpdateMessage={onUpdateMessage}
            />
          </div>
        </div>
      </div>

      {hasActions ? (
        <div className="mt-4 flex w-full flex-wrap items-center gap-2">
          {onJoin ? (
            <button
              type="button"
              onClick={onJoin}
              className="min-w-0 flex-1 rounded-xl bg-ocean-deep px-4 py-2.5 text-sm font-medium text-white"
            >
              Join
            </button>
          ) : null}
          {onShare ? (
            <button type="button" onClick={onShare} className={secondaryBtn}>
              Share
            </button>
          ) : null}
          {onCopyLink ? (
            <button type="button" onClick={onCopyLink} className={secondaryBtn}>
              {copied ? "Copied" : "Copy link"}
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" onClick={onEdit} className={secondaryBtn}>
              Edit
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={flip}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink"
        aria-label={flipped ? "Flip to front of postcard" : "Flip to back of postcard"}
      >
        <span aria-hidden>↻</span>
        {flipped ? "Flip to front" : "Flip to back"}
      </button>
    </div>
  );
}
