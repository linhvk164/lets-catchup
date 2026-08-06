"use client";

import { useEffect, useRef, useState } from "react";
import type { CatchUp, MeetingSlot, Participant } from "@/lib/types";
import { PostcardBackContent, PostcardFrontContent } from "./PostcardFaces";

function photoIdentity(catchUp: CatchUp): string {
  return `${catchUp.photo?.src ?? ""}|${catchUp.photo?.dataUrl ?? ""}`;
}

export function FlippablePostcard({
  catchUp,
  bestSlot,
  isConfirmed = false,
  moreCount = 0,
  initialSide = "front",
  flipped: flippedProp,
  onFlipChange,
  showFlipButton = true,
  disableFaceClick = false,
  onClose,
  onViewMore,
  onAddParticipant,
  onEditParticipant,
  canEditParticipant,
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
  className = "",
}: {
  catchUp: CatchUp;
  bestSlot?: MeetingSlot | null;
  isConfirmed?: boolean;
  moreCount?: number;
  initialSide?: "front" | "back";
  /** Controlled flip state. When set, parent owns flip. */
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  showFlipButton?: boolean;
  disableFaceClick?: boolean;
  /** Touch screens: show an × close control under the postcard (right). */
  onClose?: () => void;
  onViewMore?: () => void;
  onAddParticipant?: () => void;
  onEditParticipant?: (participant: Participant) => void;
  canEditParticipant?: (participant: Participant) => boolean;
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
  className?: string;
}) {
  const controlled = flippedProp !== undefined;
  const [internalFlipped, setInternalFlipped] = useState(
    initialSide === "back"
  );
  const flipped = controlled ? Boolean(flippedProp) : internalFlipped;
  const hasActions = Boolean(onCopyLink || onShare || onJoin || onEdit);
  const photoKey = photoIdentity(catchUp);
  const prevPhotoKeyRef = useRef(photoKey);

  useEffect(() => {
    if (!controlled) setInternalFlipped(initialSide === "back");
  }, [controlled, initialSide]);

  // When the postcard photo changes, flip to the front so the image is visible.
  useEffect(() => {
    if (prevPhotoKeyRef.current === photoKey) return;
    prevPhotoKeyRef.current = photoKey;
    if (!controlled) setInternalFlipped(false);
    onFlipChange?.(false);
  }, [photoKey, controlled, onFlipChange]);

  function flip() {
    const next = !flipped;
    if (!controlled) setInternalFlipped(next);
    onFlipChange?.(next);
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
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
    >
      <div
        className={`postcard-stage ${disableFaceClick ? "" : "cursor-pointer"}`}
        onClick={disableFaceClick ? undefined : flip}
        onKeyDown={
          disableFaceClick
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  flip();
                }
              }
        }
        role={disableFaceClick ? undefined : "button"}
        tabIndex={disableFaceClick ? undefined : 0}
        aria-label={
          disableFaceClick
            ? undefined
            : flipped
              ? "Flip to front of postcard"
              : "Flip to back of postcard"
        }
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
              canEditParticipant={canEditParticipant}
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

      {showFlipButton || onClose ? (
        onClose ? (
          <div className="mt-4 flex items-center justify-between gap-2 sm:mt-5">
            {showFlipButton ? (
              <button
                type="button"
                onClick={flip}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-ink/10 bg-white/55 px-2.5 py-1.5 text-sm font-medium text-ink backdrop-blur-sm transition hover:bg-white/75 active:scale-[0.98]"
                aria-label="Click or tap to flip postcard"
              >
                <span aria-hidden>↻</span>
                click/tap to flip
              </button>
            ) : (
              <span aria-hidden />
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-ink/10 bg-white/55 px-2.5 py-1.5 text-sm font-medium text-ink backdrop-blur-sm transition hover:bg-white/75 active:scale-[0.98]"
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              Close
            </button>
          </div>
        ) : showFlipButton ? (
          <button
            type="button"
            onClick={flip}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink sm:mt-6"
            aria-label="Click or tap to flip postcard"
          >
            <span aria-hidden>↻</span>
            click/tap to flip
          </button>
        ) : null
      ) : null}
    </div>
  );
}
