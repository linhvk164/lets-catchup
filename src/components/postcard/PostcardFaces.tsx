"use client";

import Image from "next/image";
import { DateTime } from "luxon";
import type {
  CatchUp,
  MeetingSlot,
  Participant,
  PostcardPhoto,
} from "@/lib/types";
import { resolvePhotoSrc } from "@/lib/photos";
import { uniqueLocalTimesByCity } from "@/lib/local-times";
import { formatAvailableCountPrompt } from "@/lib/meeting-copy";
import { isPerfectOverlap } from "@/lib/scheduler";
import {
  ENTER_DETAILS_HINT,
  resolvePostcardMessage,
} from "@/lib/postcard-copy";
import {
  EditableTitle,
  MessageArea,
  PostcardDivider,
  PostcardWriteLine,
  PostcardWriteLines,
  StampArea,
} from "./PostcardAnatomy";

/** Front visual: full-bleed postcard photo with credit eyebrow. */
export function CitiesFront({ photo }: { photo?: PostcardPhoto }) {
  const photoSrc = resolvePhotoSrc(photo);

  return (
    <div className="postcard-layer-paper relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_18%_22%,#d7e8f0,transparent_42%),radial-gradient(circle_at_82%_28%,#e8dcc8,transparent_40%),linear-gradient(165deg,#8fb6c9_0%,#2f6f7e_52%,#1e3340_100%)]">
      <Image
        src={photoSrc}
        alt={photo?.caption ?? "Postcard scene"}
        fill
        className="postcard-layer-photo object-cover"
        sizes="(max-width: 768px) 92vw, 576px"
        unoptimized
        priority={false}
      />

      {photo?.credit ? (
        <div className="postcard-layer-credit absolute inset-x-3 top-3 z-[1] flex items-center gap-3 sm:inset-x-4 sm:top-4">
          <p className="shrink-0 text-[10px] tracking-[0.06em] text-white/90">
            {photo.credit}
          </p>
          <div className="h-px min-w-0 flex-1 bg-white/40" aria-hidden />
        </div>
      ) : null}

      {/* Postage stamp — top-right, clipped slightly off the edge */}
      <div
        className="postcard-layer-stamp pointer-events-none absolute -top-3 -right-5 z-[2] w-[42%] max-w-[10rem] sm:-top-4 sm:-right-6 sm:max-w-[11.5rem]"
        aria-hidden
      >
        <Image
          src="/images/stamps/stamp-texture.webp"
          alt=""
          width={552}
          height={350}
          className="h-auto w-full brightness-[0.72] contrast-[1.15]"
          unoptimized
        />
      </div>
    </div>
  );
}

function CalendarIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect
        x="2"
        y="3.5"
        width="12"
        height="10.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M2 6.5h12"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M5 2v2.5M11 2v2.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M5 9h.01M8 9h.01M11 9h.01M5 11.5h.01M8 11.5h.01M11 11.5h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AvailabilitySection({
  catchUp,
  bestSlot,
  moreCount,
  onViewMore,
  onViewAvailability,
}: {
  catchUp: CatchUp;
  bestSlot: MeetingSlot | null;
  moreCount: number;
  onViewMore?: () => void;
  onViewAvailability?: () => void;
}) {
  const isCreating = catchUp.id === "draft" || catchUp.id === "landing";
  const hasFriends = catchUp.participants.length >= 2;
  const hasBestTime = hasFriends && Boolean(bestSlot);
  // No reasonable compromise from the scheduler (≥50% at reasonable hours).
  const hasNoOverlap = !isCreating && hasFriends && !bestSlot;
  const creatorAvailability = (
    catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0]
  )?.availabilityText?.trim();
  const hasCreatorAvailability = Boolean(creatorAvailability);

  const availabilityHeading = (
    <div className="flex items-center justify-between gap-3">
      <p
        className={
          hasBestTime && bestSlot
            ? "text-xs uppercase tracking-[0.16em] text-ocean"
            : "postcard-meta postcard-meta--medium"
        }
      >
        {hasBestTime && bestSlot
          ? isPerfectOverlap(bestSlot)
            ? "Best time"
            : "Best available"
          : "Availability"}
      </p>
      {onViewAvailability && !isCreating && catchUp.participants.length > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewAvailability();
          }}
          className="postcard-meta inline-flex shrink-0 items-center gap-1 text-ink-soft transition hover:text-ocean-deep"
          aria-label="View and edit schedules"
        >
          <CalendarIcon />
          <span>View and edit</span>
        </button>
      ) : null}
    </div>
  );

  if (hasBestTime && bestSlot) {
    const first = bestSlot.localTimes[0];
    const dateLabel = DateTime.fromISO(bestSlot.startUtc, { zone: "utc" })
      .setZone(first?.timezone ?? "UTC")
      .toFormat("cccc, LLLL d");
    const places = uniqueLocalTimesByCity(bestSlot.localTimes);
    const perfect = isPerfectOverlap(bestSlot);
    const unavailablePrompt = perfect
      ? null
      : formatAvailableCountPrompt(bestSlot);

    return (
      <div className="postcard-back-availability space-y-2 text-left">
        {availabilityHeading}
        <h3 className="font-display text-xl leading-snug text-ink sm:text-xl lg:text-2xl">
          {dateLabel}
        </h3>
        {perfect ? (
          <p className="postcard-meta leading-relaxed">
            We found a time that works for everyone. Set a call and have fun
            catching up!
          </p>
        ) : null}
        <ul className="mt-3 space-y-2 sm:mt-4">
          {places.map((place) => (
            <li key={`${place.cityLabel}-${place.hour}-${place.timeLabel}`}>
              <div className="postcard-meta flex min-w-0 items-baseline justify-between gap-2">
                <span className="postcard-meta--medium min-w-0 truncate">
                  {place.cityLabel}
                  {place.flagEmoji ? ` ${place.flagEmoji}` : ""}
                </span>
                <span className="shrink-0">{place.timeLabel}</span>
              </div>
            </li>
          ))}
        </ul>
        {unavailablePrompt ? (
          <p className="text-sm font-light leading-relaxed text-ink-soft">
            {unavailablePrompt}
          </p>
        ) : null}
        {moreCount > 0 && onViewMore ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewMore();
            }}
            className="postcard-meta inline-flex items-center rounded-full border border-ink/10 bg-ink/[0.03] px-2.5 py-0.5 transition hover:border-ocean/30 hover:text-ocean-deep"
          >
            + {moreCount} more
          </button>
        ) : null}
      </div>
    );
  }

  if (hasNoOverlap) {
    return (
      <div className="postcard-back-availability space-y-2 text-left">
        {availabilityHeading}
        <p className="postcard-meta leading-relaxed">
          We couldn&apos;t find a time that works for everyone. Click on View and
          edit to see everyone&apos;s schedule and try adjusting.
        </p>
      </div>
    );
  }

  return (
    <div className="postcard-back-availability space-y-2 text-left">
      {availabilityHeading}
      {isCreating && !hasCreatorAvailability && catchUp.id === "draft" ? (
        <PostcardWriteLines count={3} label="Availability" />
      ) : (
        <p className="postcard-meta leading-relaxed">
          {isCreating ? (
            hasCreatorAvailability ? (
              <>
                <span className="text-ocean" aria-hidden>
                  ✓{" "}
                </span>
                Availability added. Once your friends share their availability,
                we&apos;ll find a time that works for everyone.
              </>
            ) : (
              "Add your availability"
            )
          ) : (
            "Your postcard is ready to share. Times will appear once everyone adds their availability."
          )}
        </p>
      )}
    </div>
  );
}

export function PostcardFrontContent({ catchUp }: { catchUp: CatchUp }) {
  const creator =
    catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0];
  const creatorName = creator?.name?.trim();
  const showFrom = Boolean(creatorName && creatorName !== "You");
  const isDraft = catchUp.id === "draft";
  const title = catchUp.title?.trim() ?? "";

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="min-h-0 w-full flex-1">
        <CitiesFront photo={catchUp.photo} />
      </div>
      <div className="postcard-layer-text relative z-[1] shrink-0 space-y-0.5 px-3.5 py-2.5 pr-14 text-left sm:space-y-1 sm:px-5 sm:py-3.5 sm:pr-16">
        {title ? (
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-2xl lg:text-3xl">
            {title}
          </h2>
        ) : isDraft ? (
          <PostcardWriteLine
            className="postcard-write-line--title"
            label="Postcard title"
          />
        ) : (
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-2xl lg:text-3xl">
            &nbsp;
          </h2>
        )}
        {showFrom ? (
          <p className="postcard-meta mt-3 font-normal">
            from {creatorName}
          </p>
        ) : isDraft ? (
          <p className="postcard-meta mt-3 font-normal">
            from
            <PostcardWriteLine inline label="Your name" />
          </p>
        ) : null}
      </div>
      {/* Overlaps photo + white band; clipped on bottom/right */}
      <div
        className="postcard-layer-stamp pointer-events-none absolute -bottom-5 -right-6 z-[3] sm:-bottom-6 sm:-right-8"
        aria-hidden
      >
        <Image
          src="/images/logo/flip-me-stamp.svg"
          alt=""
          width={210}
          height={209}
          className="h-24 w-auto select-none opacity-30 sm:h-28 lg:h-32"
          unoptimized
        />
      </div>
    </div>
  );
}

export function PostcardBackContent({
  catchUp,
  bestSlot,
  moreCount = 0,
  onViewMore,
  onViewAvailability,
  onUpdateTitle,
  onUpdateMessage,
}: {
  catchUp: CatchUp;
  bestSlot?: MeetingSlot | null;
  isConfirmed?: boolean;
  moreCount?: number;
  onViewMore?: () => void;
  onAddParticipant?: () => void;
  onEditParticipant?: (participant: Participant) => void;
  /** When set, only matching participants get an edit affordance on their name. */
  canEditParticipant?: (participant: Participant) => boolean;
  onViewAvailability?: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
  onJoin?: () => void;
  copied?: boolean;
  onUpdateTitle?: (title: string) => void;
  onUpdateMessage?: (message: string) => void;
}) {
  const creator =
    catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0];
  const creatorName = creator?.name?.trim();
  const showFrom = Boolean(creatorName && creatorName !== "You");
  const recipients = catchUp.participants
    .filter((p) => p.id !== creator?.id)
    .map((p) => p.name.trim())
    .filter(Boolean);
  const toLine = recipients.length > 0 ? recipients.join(", ") : null;
  const message = resolvePostcardMessage(catchUp.message);
  const isDraft = catchUp.id === "draft";
  const title = catchUp.title?.trim() ?? "";
  const showDetailsHint =
    isDraft && !message && !title && !showFrom;

  return (
    <div className="relative flex h-full flex-col overflow-hidden p-3.5 pb-8 sm:p-5 sm:pb-10">
      <div className="postcard-back-invite flex min-h-0 flex-col">
        {/* Eyebrow rule */}
        <div className="flex shrink-0 items-center gap-3">
          <p className="font-syne-mono shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
            Postcard
          </p>
          <div className="h-px min-w-0 flex-1 bg-ink/20" aria-hidden />
        </div>

        {/* Title + stamp */}
        <div className="mt-2.5 flex shrink-0 items-start justify-between gap-2.5 sm:mt-3 sm:gap-3">
          <div className="min-w-0 flex-1 text-left">
            {title || onUpdateTitle ? (
              <EditableTitle
                value={catchUp.title}
                editable={Boolean(onUpdateTitle)}
                onChange={onUpdateTitle}
              />
            ) : isDraft ? (
              <PostcardWriteLine
                className="postcard-write-line--title"
                label="Postcard title"
              />
            ) : null}
            {showFrom ? (
              <p className="postcard-meta mt-3 font-normal">
                from {creatorName}
              </p>
            ) : isDraft ? (
              <p className="postcard-meta mt-3 font-normal">
                from
                <PostcardWriteLine inline label="Your name" />
              </p>
            ) : null}
            {toLine ? (
              <p className="postcard-meta mt-1 font-normal">to {toLine}</p>
            ) : null}
          </div>
          <StampArea />
        </div>

        {message ? (
          <div className="mt-2.5 min-h-0 shrink sm:mt-4">
            <MessageArea
              value={message}
              editable={Boolean(onUpdateMessage)}
              onChange={onUpdateMessage}
              fontId={catchUp.messageFont}
            />
          </div>
        ) : showDetailsHint ? (
          <div className="mt-2.5 min-h-0 shrink sm:mt-4">
            <p className="text-sm leading-relaxed text-ink-soft/70">
              {ENTER_DETAILS_HINT}
            </p>
          </div>
        ) : onUpdateMessage ? (
          <div className="mt-2.5 min-h-0 shrink sm:mt-4">
            <MessageArea
              value=""
              editable
              onChange={onUpdateMessage}
              fontId={catchUp.messageFont}
            />
          </div>
        ) : null}
      </div>

      <div className="my-3 shrink-0 sm:my-4">
        <PostcardDivider />
      </div>

      {/* Availability */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
        <AvailabilitySection
          catchUp={catchUp}
          bestSlot={bestSlot ?? null}
          moreCount={moreCount}
          onViewMore={onViewMore}
          onViewAvailability={onViewAvailability}
        />
      </div>

      <div className="pointer-events-none absolute bottom-2.5 right-3 sm:bottom-3 sm:right-4">
        <Image
          src="/images/logo/logo-stamped-black.png"
          alt=""
          width={2373}
          height={1134}
          className="h-10 w-auto select-none opacity-50 sm:h-12 lg:h-14"
          unoptimized
          aria-hidden
        />
      </div>
    </div>
  );
}

export function PostcardFront({ catchUp }: { catchUp: CatchUp; animate?: boolean }) {
  return (
    <article className="postcard-product">
      <div className="postcard-stage relative">
        <div className="postcard-face postcard-face--static">
          <PostcardFrontContent catchUp={catchUp} />
        </div>
      </div>
    </article>
  );
}

export function PostcardBack(props: {
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
  onUpdateTitle?: (title: string) => void;
  onUpdateMessage?: (message: string) => void;
}) {
  return (
    <article className="postcard-product">
      <div className="postcard-stage relative">
        <div className="postcard-face postcard-face--static">
          <PostcardBackContent {...props} />
        </div>
      </div>
    </article>
  );
}

export function Postcard({
  catchUp,
  side = "front",
  ...rest
}: {
  catchUp: CatchUp;
  side?: "front" | "back";
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
  onUpdateTitle?: (title: string) => void;
  onUpdateMessage?: (message: string) => void;
}) {
  if (side === "back") {
    return <PostcardBack catchUp={catchUp} {...rest} />;
  }
  return <PostcardFront catchUp={catchUp} />;
}
