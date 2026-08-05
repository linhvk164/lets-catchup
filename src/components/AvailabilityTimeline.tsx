"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui";
import { buildAvailabilityTimeline } from "@/lib/timeline";
import type { MeetingSlot, Participant } from "@/lib/types";

export function AvailabilityTimeline({
  participants,
  slots,
  activeSlotId,
  onActiveSlotChange,
  onSelectSlot,
}: {
  participants: Participant[];
  slots: MeetingSlot[];
  activeSlotId?: string | null;
  onActiveSlotChange?: (slotId: string) => void;
  onSelectSlot?: (slot: MeetingSlot) => void;
}) {
  const activeSlot =
    slots.find((s) => s.id === activeSlotId) ?? slots[0] ?? null;

  const model = useMemo(
    () => buildAvailabilityTimeline(participants, activeSlot),
    [participants, activeSlot]
  );

  const localTimeByParticipant = useMemo(() => {
    const map = new Map<string, string>();
    for (const lt of activeSlot?.localTimes ?? []) {
      map.set(lt.participantId, lt.timeLabel);
    }
    return map;
  }, [activeSlot]);

  if (participants.length < 2) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
        <p className="text-sm text-ink-soft">
          Invite at least one more person to see how schedules line up.
        </p>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center">
        <p className="text-sm text-ink-soft">
          Add availability to see everyone&apos;s day across time zones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">
            Recommended
          </p>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {slots.slice(0, 6).map((slot, index) => {
              const first = slot.localTimes[0];
              const local = DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(
                first?.timezone ?? "UTC"
              );
              const dateLabel = local.toFormat("ccc, LLL d");
              const timeLabel = local.toFormat("h:mm a");
              const selected = slot.id === activeSlot?.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onActiveSlotChange?.(slot.id)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left transition ${
                    selected
                      ? "border-ocean/40 bg-ocean/10 text-ocean-deep"
                      : "border-ink/10 bg-white text-ink hover:border-ocean/25"
                  }`}
                >
                  <span className="block text-[11px] font-medium">
                    {selected ? "⭐ " : ""}
                    Option {index + 1}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-soft">{dateLabel}</span>
                  <span className="block text-xs font-medium text-ink">{timeLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Horizontal scroll only; height hugs rows + compact best-time line. */}
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="min-w-[36rem]">
          <div className="mb-1.5 flex items-end gap-0">
            <div className="sticky left-0 z-20 w-36 shrink-0 bg-white sm:w-40" aria-hidden />
            <div className="relative h-4 min-w-0 flex-1">
              {model.hours.map((h) => (
                <span
                  key={`${h.label}-${h.pct}`}
                  className="absolute top-0 -translate-x-1/2 text-[10px] text-ink-soft"
                  style={{ left: `${h.pct}%` }}
                >
                  {h.label}
                </span>
              ))}
            </div>
          </div>

          <ul className="space-y-2">
            {model.rows.map(({ participant, segments }) => {
              const meetingTime = localTimeByParticipant.get(participant.id);
              return (
                <li key={participant.id} className="flex items-center gap-0">
                  <div className="sticky left-0 z-20 w-36 shrink-0 bg-white pr-2 sm:w-40">
                    <p className="truncate text-sm font-medium text-ink">
                      {participant.name}
                    </p>
                    <p className="truncate text-[11px] text-ink-soft">
                      {participant.cityLabel}
                      {meetingTime ? (
                        <span className="font-medium text-ocean-deep">
                          {" "}
                          · {meetingTime}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="relative h-7 min-w-0 flex-1 overflow-hidden rounded-md bg-[#eef4f7]">
                    {segments.map((seg, i) => (
                      <div
                        key={`${participant.id}-${i}`}
                        className="absolute inset-y-0.5 rounded-sm bg-ocean/55"
                        style={{
                          left: `${seg.startPct}%`,
                          width: `${seg.widthPct}%`,
                        }}
                      />
                    ))}
                    {model.highlight ? (
                      <div
                        className="pointer-events-none absolute inset-y-0 border-x-2 border-ocean-deep/70 bg-ocean-deep/15"
                        style={{
                          left: `${model.highlight.startPct}%`,
                          width: `${model.highlight.widthPct}%`,
                        }}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {model.highlight ? (
            <div className="mt-1.5 flex gap-0">
              <div className="sticky left-0 z-20 w-36 shrink-0 bg-white sm:w-40" aria-hidden />
              <div className="relative h-5 min-w-0 flex-1">
                <div
                  className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-ocean-deep"
                  style={{
                    left: `${model.highlight.startPct + model.highlight.widthPct / 2}%`,
                  }}
                >
                  ⭐ Best time · {model.highlightLabel}
                </div>
              </div>
            </div>
          ) : slots.length === 0 ? (
            <p className="mt-2 text-center text-sm text-ink-soft">
              No overlapping times yet. Try updating availability.
            </p>
          ) : null}
        </div>
      </div>

      {activeSlot && onSelectSlot ? (
        <Button className="w-full" onClick={() => onSelectSlot(activeSlot)}>
          Let&apos;s catch up then
        </Button>
      ) : null}
    </div>
  );
}

export function AvailabilityTimelineSheet({
  open,
  onClose,
  participants,
  slots,
  initialSlotId,
  onSelectSlot,
}: {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
  slots: MeetingSlot[];
  initialSlotId?: string | null;
  onSelectSlot?: (slot: MeetingSlot) => void;
}) {
  const [activeSlotId, setActiveSlotId] = useState<string | null>(
    initialSlotId ?? slots[0]?.id ?? null
  );

  useEffect(() => {
    if (!open) return;
    setActiveSlotId(initialSlotId ?? slots[0]?.id ?? null);
  }, [open, initialSlotId, slots]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-ink/40 pt-1.5 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">See everyone&apos;s schedule</h2>
          <button
            type="button"
            className="text-ink-soft hover:text-ink"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <AvailabilityTimeline
          participants={participants}
          slots={slots}
          activeSlotId={activeSlotId}
          onActiveSlotChange={setActiveSlotId}
          onSelectSlot={
            onSelectSlot
              ? (slot) => {
                  onSelectSlot(slot);
                  onClose();
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
