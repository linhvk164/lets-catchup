"use client";

import { DateTime } from "luxon";
import { Button } from "@/components/ui";
import type { MeetingSlot } from "@/lib/types";

export function TimeSlotCard({
  slot,
  onSelect,
  featured,
}: {
  slot: MeetingSlot;
  onSelect?: () => void;
  featured?: boolean;
}) {
  const first = slot.localTimes[0];
  const dateLabel = DateTime.fromISO(slot.startUtc, { zone: "utc" })
    .setZone(first?.timezone ?? "UTC")
    .toFormat("cccc, LLLL d");

  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_12px_32px_rgba(31,79,92,0.08)] ${
        featured ? "ring-1 ring-ocean/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-ocean">
            {featured ? "Nearest available time" : "Also works"}
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">{dateLabel}</h2>
        </div>
        {slot.worksWell && (
          <span className="inline-flex w-fit shrink-0 items-center justify-center self-start rounded-lg bg-ocean/10 px-2.5 py-1 text-center text-[11px] font-medium leading-snug text-ocean-deep">
            Works well for everyone
          </span>
        )}
      </div>

      <ul className="mt-4 space-y-2 border-t border-ink/8 pt-4">
        {[...slot.localTimes]
          .sort((a, b) => a.hour - b.hour || a.cityLabel.localeCompare(b.cityLabel))
          .reduce<
            {
              timeLabel: string;
              hour: number;
              places: typeof slot.localTimes;
            }[]
          >((groups, lt) => {
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
            return groups;
          }, [])
          .map((group) => (
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

      {onSelect ? (
        <Button className="mt-5 w-full" onClick={onSelect}>
          Select this time
        </Button>
      ) : null}
    </div>
  );
}

export function AllTimesSheet({
  open,
  slots,
  onClose,
  onSelect,
}: {
  open: boolean;
  slots: MeetingSlot[];
  onClose: () => void;
  onSelect: (slot: MeetingSlot) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 pt-3 sm:items-center sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[calc(100dvh-0.75rem)] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[85vh] sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">More times that work</h2>
          <button type="button" className="text-ink-soft hover:text-ink" onClick={onClose}>
            ✕
          </button>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {slots.map((slot, i) => (
            <li key={slot.id}>
              <TimeSlotCard
                slot={slot}
                featured={i === 0}
                onSelect={() => onSelect(slot)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
