"use client";

import { DateTime } from "luxon";
import type { CatchUp, LocalTimeDisplay, MeetingSlot, Participant } from "@/lib/types";
import {
  getPostcardMapLayout,
  travelCurve,
} from "@/lib/postcard-map";

/** Front visual: cities on a designed postcard map with travel-route threads. */
export function CitiesFront({ participants }: { participants: Participant[] }) {
  const source =
    participants.length > 0
      ? participants
      : ([
          {
            id: "placeholder-a",
            cityLabel: "Toronto",
            flagEmoji: "🇨🇦",
          },
          {
            id: "placeholder-b",
            cityLabel: "Berlin",
            flagEmoji: "🇩🇪",
          },
        ] as Participant[]);

  const { positions, threads, compact, shownCount } = getPostcardMapLayout(
    source.length
  );
  const shown = source.slice(0, shownCount);

  const pathD = threads
    .map(([from, to]) => {
      const a = positions[from];
      const b = positions[to];
      if (!a || !b) return "";
      return travelCurve(a, b);
    })
    .filter(Boolean)
    .join(" ");

  const dotOuter = compact ? "h-3 w-3" : "h-3.5 w-3.5";
  const dotInner = compact ? "h-1.5 w-1.5" : "h-2 w-2";
  const labelClass = compact
    ? "mt-2 max-w-[5.25rem] text-[10px]"
    : "mt-2.5 max-w-[6.5rem] text-[11px]";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-[radial-gradient(circle_at_18%_22%,#d7e8f0,transparent_42%),radial-gradient(circle_at_82%_28%,#e8dcc8,transparent_40%),linear-gradient(165deg,#8fb6c9_0%,#2f6f7e_52%,#1e3340_100%)]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2.4 2.8"
            vectorEffect="non-scaling-stroke"
            className="animate-thread"
          />
        ) : null}
      </svg>

      {shown.map((p, i) => {
        const pos = positions[i];
        if (!pos) return null;
        return (
          <div
            key={p.id}
            className="animate-pin pointer-events-none absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              animationDelay: `${0.12 + i * 0.08}s`,
            }}
          >
            <span
              className={`absolute left-0 top-0 flex ${dotOuter} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm`}
            >
              <span className={`${dotInner} rounded-full bg-stamp`} />
            </span>
            <p
              className={`absolute left-0 top-0 -translate-x-1/2 truncate text-center font-medium leading-tight text-white/95 drop-shadow-sm ${labelClass}`}
            >
              {p.cityLabel}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function ParticipantNames({
  participants,
  onEdit,
  onViewAvailability,
}: {
  participants: Participant[];
  onEdit?: (participant: Participant) => void;
  onViewAvailability?: () => void;
}) {
  return (
    <div className="space-y-2.5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
          Who&apos;s joining
        </p>
        {onViewAvailability && participants.length > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewAvailability();
            }}
            className="text-[11px] text-ocean hover:underline"
          >
            View availability
          </button>
        ) : null}
      </div>
      {participants.length === 0 ? (
        <p className="text-sm text-ink-soft">Your invitation starts here</p>
      ) : (
        <>
          <ul className="flex flex-wrap justify-start gap-2">
            {participants.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(p);
                  }}
                  className="rounded-full border border-ink/10 bg-white px-3 py-1 text-sm text-ink transition hover:border-ocean/40"
                  title={onEdit ? "Edit" : undefined}
                >
                  {p.name} {p.flagEmoji ?? ""}
                </button>
              </li>
            ))}
          </ul>
          {onEdit ? (
            <p className="text-[10px] text-ink-soft/70">click on name to edit</p>
          ) : null}
        </>
      )}
    </div>
  );
}

function groupLocalTimesByClock(
  localTimes: LocalTimeDisplay[]
): { timeLabel: string; hour: number; places: LocalTimeDisplay[] }[] {
  const sorted = [...localTimes].sort((a, b) => {
    const byHour = a.hour - b.hour;
    if (byHour !== 0) return byHour;
    return a.cityLabel.localeCompare(b.cityLabel);
  });

  const groups: { timeLabel: string; hour: number; places: LocalTimeDisplay[] }[] =
    [];
  for (const lt of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.timeLabel === lt.timeLabel && last.hour === lt.hour) {
      last.places.push(lt);
    } else {
      groups.push({
        timeLabel: lt.timeLabel,
        hour: lt.hour,
        places: [lt],
      });
    }
  }
  return groups;
}

function BestTimeBlock({
  catchUp,
  bestSlot,
  isConfirmed,
  moreCount,
  onViewMore,
}: {
  catchUp: CatchUp;
  bestSlot: MeetingSlot | null;
  isConfirmed: boolean;
  moreCount: number;
  onViewMore?: () => void;
}) {
  if (catchUp.participants.length < 2) {
    return (
      <div className="space-y-2.5 text-left">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
          Nearest available time
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          Waiting for friends to join…
        </p>
        <p className="text-xs leading-relaxed text-ink-soft/80">
          Share this postcard with friends to find a time together.
        </p>
      </div>
    );
  }

  if (!bestSlot) {
    return (
      <div className="space-y-2.5 text-left">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
          Nearest available time
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          We couldn&apos;t find a time that works yet. Try updating availability.
        </p>
      </div>
    );
  }

  const first = bestSlot.localTimes[0];
  const dateLabel = DateTime.fromISO(bestSlot.startUtc, { zone: "utc" })
    .setZone(first?.timezone ?? "UTC")
    .toFormat("ccc, LLL d");
  const timeGroups = groupLocalTimesByClock(bestSlot.localTimes);

  return (
    <div className="space-y-2.5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
          {isConfirmed ? "See you soon" : "Nearest available time"}
        </p>
        <p className="text-[11px] text-ink-soft">{dateLabel}</p>
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
        {timeGroups.map((group) => (
          <li
            key={`${group.hour}-${group.timeLabel}`}
            className="flex min-w-0 items-baseline justify-between gap-2 text-sm leading-snug"
          >
            <span className="min-w-0 truncate text-ink-soft">
              {group.places.map((p) => p.cityLabel).join(" · ")}
            </span>
            <span className="shrink-0 font-medium text-ink">
              {group.timeLabel}
            </span>
          </li>
        ))}
      </ul>
      {!isConfirmed && moreCount > 0 && onViewMore ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewMore();
          }}
          className="pt-0.5 text-left text-sm text-ocean hover:underline"
        >
          See {moreCount} more time{moreCount === 1 ? "" : "s"} that work
        </button>
      ) : null}
    </div>
  );
}

export function PostcardFrontContent({ catchUp }: { catchUp: CatchUp }) {
  const creator =
    catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0];
  const isDraft =
    catchUp.id === "draft" || !creator?.name || creator.name === "You";
  const subtitle = isDraft ? null : `${creator.name} wants to catch up`;

  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="min-h-0 w-full flex-1">
        <CitiesFront participants={catchUp.participants} />
      </div>
      <div className="mt-4 shrink-0 space-y-1 text-left">
        <h2 className="font-display text-xl tracking-tight text-ink sm:text-2xl">
          {catchUp.title}
        </h2>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-ink-soft">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function PostcardBackContent({
  catchUp,
  bestSlot,
  isConfirmed = false,
  moreCount = 0,
  onViewMore,
  onAddParticipant,
  onEditParticipant,
  onViewAvailability,
  onCopyLink,
  onShare,
  onJoin,
  copied,
}: {
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
  const creator =
    catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0];
  const isDraft =
    catchUp.id === "draft" || !creator?.name || creator.name === "You";
  const subtitle = isDraft ? null : `${creator.name} wants to catch up`;

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden p-5 sm:gap-6 sm:p-7">
      <div className="shrink-0 text-left">
        <p className="font-display text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
          {catchUp.title}
        </p>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-ink/8 pt-4 sm:pt-5">
        <ParticipantNames
          participants={catchUp.participants}
          onEdit={onEditParticipant}
          onViewAvailability={onViewAvailability}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden border-t border-ink/8 pt-4 sm:pt-5">
        <BestTimeBlock
          catchUp={catchUp}
          bestSlot={bestSlot ?? null}
          isConfirmed={isConfirmed}
          moreCount={moreCount}
          onViewMore={onViewMore}
        />
      </div>

      {(onCopyLink || onShare || onJoin) && (
        <div className="mt-auto flex shrink-0 items-center gap-2 border-t border-ink/8 pt-4 sm:pt-5">
          {onJoin ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="min-w-0 flex-1 rounded-xl bg-ocean-deep px-3 py-3 text-sm font-medium text-white"
            >
              Join
            </button>
          ) : null}
          {onCopyLink ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink();
              }}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/15 bg-white text-ink transition hover:border-ocean/40 hover:text-ocean-deep"
              aria-label={copied ? "Link copied" : "Copy link"}
              title={copied ? "Copied!" : "Copy link"}
            >
              {copied ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                  <rect
                    x="9"
                    y="9"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M5 15V7a2 2 0 0 1 2-2h8"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          ) : null}
          {onShare ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/15 bg-white text-ink transition hover:border-ocean/40 hover:text-ocean-deep"
              aria-label="Share"
              title="Share"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <circle cx="18" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.75" />
                <circle cx="6" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.75" />
                <circle cx="18" cy="19" r="2.25" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M8.1 10.9l7.8-4.3M8.1 13.1l7.8 4.3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function PostcardFront({ catchUp }: { catchUp: CatchUp; animate?: boolean }) {
  return (
    <article className="postcard-product">
      <div className="postcard-stage relative overflow-hidden rounded-2xl">
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
}) {
  return (
    <article className="postcard-product">
      <div className="postcard-stage relative overflow-hidden rounded-2xl">
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
}) {
  if (side === "back") {
    return <PostcardBack catchUp={catchUp} {...rest} />;
  }
  return <PostcardFront catchUp={catchUp} />;
}

