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
import { resolvePostcardMessage } from "@/lib/postcard-copy";
import {
  EditableTitle,
  MessageArea,
  PostcardDivider,
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
        <div className="postcard-layer-credit absolute inset-x-3 top-3 flex items-center gap-3 sm:inset-x-4 sm:top-4">
          <p className="shrink-0 text-[10px] tracking-[0.06em] text-white/90">
            {photo.credit}
          </p>
          <div className="h-px min-w-0 flex-1 bg-white/40" aria-hidden />
        </div>
      ) : null}
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
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
        {hasBestTime ? "Best time" : "Availability"}
      </p>
      {onViewAvailability && !isCreating && catchUp.participants.length > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewAvailability();
          }}
          className="shrink-0 text-xs text-ocean underline underline-offset-2 transition-colors hover:text-ocean-deep"
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
      <div className="postcard-back-availability space-y-2.5 text-left">
        {availabilityHeading}
        <h3 className="font-display text-xl text-ink sm:text-2xl">
          {dateLabel}
        </h3>
        <ul className="space-y-2 border-t border-ink/8 pt-3">
          {places.map((place) => (
            <li
              key={`${place.participantId}-${place.hour}-${place.cityLabel}`}
              className="flex min-w-0 items-baseline justify-between gap-2 text-sm leading-snug"
            >
              <span className="min-w-0 truncate font-medium text-ink">
                {place.cityLabel}
                {place.flagEmoji ? ` ${place.flagEmoji}` : ""}
              </span>
              <span className="shrink-0 text-ink-soft">{place.timeLabel}</span>
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
            className="inline-flex items-center rounded-full border border-ink/10 bg-ink/[0.03] px-2.5 py-0.5 text-xs font-medium text-ink-soft transition hover:border-ocean/30 hover:text-ocean-deep"
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
      <p className="text-sm leading-relaxed text-ink-soft">
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
    </div>
  );
}

const nameLinkClass =
  "text-ink underline underline-offset-2 transition-colors hover:text-ocean-deep";

function ParticipantNameButton({
  participant,
  onEdit,
}: {
  participant: Participant;
  onEdit?: (participant: Participant) => void;
}) {
  const label = participant.name;
  if (!onEdit) return <>{label}</>;
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

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 w-full flex-1">
        <CitiesFront photo={catchUp.photo} />
      </div>
      <div className="postcard-layer-text shrink-0 space-y-1 px-4 py-3 text-left sm:px-5 sm:py-3.5">
        <h2 className="font-display text-xl tracking-tight text-ink sm:text-2xl">
          {catchUp.title}
        </h2>
        {showFrom ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            from {creatorName}
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

  const recipients = catchUp.participants
    .filter((p) => !p.isCreator)
    .filter((p) => p.name?.trim() && p.name.trim() !== "You");

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
    <div className="flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <div className="postcard-back-invite flex min-h-0 flex-col">
        {/* Eyebrow rule */}
        <div className="flex shrink-0 items-center gap-3">
          <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
            Postcard
          </p>
          <div className="h-px min-w-0 flex-1 bg-ink/20" aria-hidden />
        </div>

        {/* Title + stamp */}
        <div className="mt-3 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-left">
            <EditableTitle
              value={catchUp.title}
              editable={Boolean(onUpdateTitle)}
              onChange={onUpdateTitle}
            />
            {showFrom && creator ? (
              <p className="mt-1 text-sm text-ink-soft">
                from{" "}
                <ParticipantNameButton
                  participant={creator}
                  onEdit={editHandler(creator)}
                />
              </p>
            ) : null}
            {recipientPeople.length > 0 ? (
              <p
                className={`${showFrom ? "mt-0.5" : "mt-1"} text-sm text-ink-soft`}
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
          <div className="mt-4 min-h-0 shrink-0">
            <MessageArea
              value={message}
              editable={Boolean(onUpdateMessage)}
              onChange={onUpdateMessage}
              fontFamily={messageFontFamily(catchUp.messageFont)}
            />
          </div>
        ) : !showFrom ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft/70">
            Enter details to see them appear here
          </p>
        ) : null}
      </div>

      <div className="my-4 shrink-0">
        <PostcardDivider />
      </div>

      {/* Availability */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AvailabilitySection
          catchUp={catchUp}
          bestSlot={bestSlot ?? null}
          moreCount={moreCount}
          onViewMore={onViewMore}
          onViewAvailability={onViewAvailability}
        />
      </div>
    </div>
  );
}

export function PostcardFront({ catchUp }: { catchUp: CatchUp; animate?: boolean }) {
  return (
    <article className="postcard-product">
      <div className="postcard-stage relative overflow-hidden">
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
      <div className="postcard-stage relative overflow-hidden">
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
