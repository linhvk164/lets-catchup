"use client";

import { DateTime } from "luxon";
import { Button } from "@/components/ui";
import { uniqueLocalTimesByCity } from "@/lib/local-times";
import { formatAvailableCountPrompt } from "@/lib/meeting-copy";
import { isPerfectOverlap } from "@/lib/scheduler";
import type { MeetingSlot } from "@/lib/types";

export function TimeSlotCard({
  slot,
  onSelect,
  featured,
  selected = false,
  focused = false,
  cardRef,
}: {
  slot: MeetingSlot;
  onSelect?: () => void;
  featured?: boolean;
  selected?: boolean;
  /** Preview highlight from calendar (not a confirmed pick). */
  focused?: boolean;
  cardRef?: (node: HTMLElement | null) => void;
}) {
  const first = slot.localTimes[0];
  const dateLabel = DateTime.fromISO(slot.startUtc, { zone: "utc" })
    .setZone(first?.timezone ?? "UTC")
    .toFormat("cccc, LLLL d");

  const places = uniqueLocalTimesByCity(slot.localTimes);
  const perfect = isPerfectOverlap(slot);
  const unavailablePrompt = perfect
    ? null
    : formatAvailableCountPrompt(slot);

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_12px_32px_rgba(31,79,92,0.08)] ${
        selected
          ? "ring-2 ring-ocean/50"
          : focused
            ? "ring-1 ring-ocean/35"
            : featured
              ? "ring-1 ring-ocean/30"
              : ""
      }`}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-ocean">
          {selected
            ? "Selected"
            : featured
              ? perfect
                ? "Best time"
                : "Best available"
              : "Also works"}
        </p>
        <h2 className="mt-1 font-display text-2xl text-ink">{dateLabel}</h2>
      </div>

      <ul className="mt-4 space-y-2 border-t border-ink/8 pt-4">
        {places.map((place) => (
          <li
            key={`${place.cityLabel}-${place.hour}-${place.timeLabel}`}
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

      {unavailablePrompt ? (
        <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
          {unavailablePrompt}
        </p>
      ) : null}

      {onSelect ? (
        <Button
          className="mt-5 w-full"
          onClick={onSelect}
          disabled={selected}
        >
          {selected ? "Time selected" : "Select this time"}
        </Button>
      ) : null}
    </div>
  );
}
