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
import { messageFontFamily } from "@/lib/message-fonts";
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

      {/* Postage stamp — clipped slightly off the right edge */}
      <div
        className="postcard-layer-stamp pointer-events-none absolute bottom-8 -right-5 z-[2] w-[42%] max-w-[10rem] sm:bottom-10 sm:-right-6 sm:max-w-[11.5rem]"
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
  const creatorAvailability = (
    catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0]
  )?.availabilityText?.trim();
  const hasCreatorAvailability = Boolean(creatorAvailability);

  const availabilityHeading = (
    <div className="flex items-center justify-between gap-3">
      <p className="postcard-meta postcard-meta--medium">
        {hasBestTime ? "Best time" : "Availability"}
      </p>
      {onViewAvailability && !isCreating && catchUp.participants.length > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewAvailability();
          }}
          className="postcard-meta shrink-0 text-ocean underline underline-offset-2 transition-colors hover:text-ocean-deep"
        >
          View all schedules
        </button>
      ) : null}
    </div>
  );

  if (hasBestTime && bestSlot) {
    const first = bestSlot.localTimes[0];
    const dateLabel = DateTime.fromISO(bestSlot.startUtc, { zone: "utc" })
      .setZone(first?.timezone ?? "UTC")
      .toFormat("cccc, LLLL d");
    const places = [...bestSlot.localTimes].sort(
      (a, b) => a.hour - b.hour || a.cityLabel.localeCompare(b.cityLabel)
    );

    return (
      <div className="postcard-back-availability space-y-2 text-left">
        {availabilityHeading}
        <h3 className="font-display text-base leading-snug text-ink sm:text-xl lg:text-2xl">
          {dateLabel}
        </h3>
        <ul className="space-y-1.5">
          {places.map((place) => (
            <li
              key={`${place.participantId}-${place.hour}-${place.cityLabel}`}
              className="postcard-meta flex min-w-0 items-baseline justify-between gap-2"
            >
              <span className="postcard-meta--medium min-w-0 truncate">
                {place.cityLabel}
                {place.flagEmoji ? ` ${place.flagEmoji}` : ""}
              </span>
              <span className="shrink-0">{place.timeLabel}</span>
            </li>
          ))}
        </ul>
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
          ) : hasFriends ? (
            "We're still looking for a time that works for everyone."
          ) : (
            "Your postcard is ready to share. Times will appear once everyone adds their availability."
          )}
        </p>
      )}
    </div>
  );
}

const nameLinkClass =
  "font-normal underline underline-offset-2 transition-colors hover:text-ocean-deep";

function ParticipantNameButton({
  participant,
  onEdit,
}: {
  participant: Participant;
  onEdit?: (participant: Participant) => void;
}) {
  const label = participant.name;
  if (!onEdit) {
    return <span className="font-normal">{label}</span>;
  }
  return (
    <button
      type="button"
      className={nameLinkClass}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(participant);
      }}
    >
      {label}
    </button>
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
    <div className="flex h-full flex-col">
      <div className="min-h-0 w-full flex-1">
        <CitiesFront photo={catchUp.photo} />
      </div>
      <div className="postcard-layer-text shrink-0 space-y-0.5 px-3.5 py-2.5 text-left sm:space-y-1 sm:px-5 sm:py-3.5">
        {title ? (
          <h2 className="font-display text-lg tracking-tight text-ink sm:text-2xl lg:text-3xl">
            {title}
          </h2>
        ) : isDraft ? (
          <PostcardWriteLine
            className="postcard-write-line--title"
            label="Postcard title"
          />
        ) : (
          <h2 className="font-display text-lg tracking-tight text-ink sm:text-2xl lg:text-3xl">
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
    </div>
  );
}

export function PostcardBackContent({
  catchUp,
  bestSlot,
  moreCount = 0,
  onViewMore,
  onEditParticipant,
  canEditParticipant,
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
  const message = resolvePostcardMessage(catchUp.message);
  const isDraft = catchUp.id === "draft";
  const title = catchUp.title?.trim() ?? "";
  const showDetailsHint =
    isDraft && !message && !title && !showFrom;

  const recipients = catchUp.participants
    .filter((p) => !p.isCreator)
    .filter((p) => {
      const name = p.name?.trim();
      if (!name) return false;
      // Hide draft placeholder "You"; keep real recipients named You (e.g. landing demo).
      if (name === "You" && (!creatorName || creatorName === "You")) return false;
      return true;
    });

  // During create/preview with a single named person, treat them as sender only.
  // If somehow no isCreator flags, show non-first participants as recipients.
  const recipientPeople =
    recipients.length > 0
      ? recipients
      : catchUp.participants.length > 1
        ? catchUp.participants.slice(1)
        : [];

  function editHandler(person: Participant) {
    if (!onEditParticipant) return undefined;
    if (canEditParticipant && !canEditParticipant(person)) return undefined;
    return onEditParticipant;
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden p-3.5 pb-8 sm:p-5 sm:pb-10">
      <div className="postcard-back-invite flex min-h-0 flex-col">
        {/* Eyebrow rule */}
        <div className="flex shrink-0 items-center gap-3">
          <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
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
            {showFrom && creator ? (
              <p className="postcard-meta mt-3 font-normal">
                from{" "}
                <ParticipantNameButton
                  participant={creator}
                  onEdit={editHandler(creator)}
                />
              </p>
            ) : isDraft ? (
              <p className="postcard-meta mt-3 font-normal">
                from
                <PostcardWriteLine inline label="Your name" />
              </p>
            ) : null}
            {recipientPeople.length > 0 ? (
              <p
                className={`postcard-meta font-normal ${showFrom || isDraft ? "mt-1.5" : "mt-3"}`}
              >
                to{" "}
                <span>
                  {recipientPeople.map((person, i) => (
                    <span key={person.id}>
                      {i > 0 ? ", " : ""}
                      <ParticipantNameButton
                        participant={person}
                        onEdit={editHandler(person)}
                      />
                    </span>
                  ))}
                </span>
              </p>
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
              fontFamily={messageFontFamily(catchUp.messageFont)}
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
              fontFamily={messageFontFamily(catchUp.messageFont)}
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
