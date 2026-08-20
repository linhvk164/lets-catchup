"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui";
import {
  ParticipantForm,
  participantToDraft,
  type ParticipantDraft,
} from "@/components/ParticipantForm";
import { parseAvailabilityInput } from "@/lib/availability";
import { buildAvailabilityTimeline } from "@/lib/timeline";
import type { MeetingSlot, Participant } from "@/lib/types";

function EditIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M11.5 2.5l2 2L5.75 12.25 3 13l.75-2.75L11.5 2.5z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M10.25 3.75l2 2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Everyone's availability in words. The timeline only draws a single day, so
 * this is what makes a missing overlap explainable and actionable.
 */
function AvailabilitySummaryList({
  participants,
  onEditParticipant,
  canEditParticipant,
}: {
  participants: Participant[];
  onEditParticipant?: (participant: Participant) => void;
  canEditParticipant?: (participant: Participant) => boolean;
}) {
  const rows = useMemo(
    () =>
      participants.map((participant) => {
        const text = participant.availabilityText?.trim() ?? "";
        const parsed = text ? parseAvailabilityInput(text) : null;
        const lines =
          parsed && parsed.understood && parsed.debugLines.length > 0
            ? parsed.debugLines
            : text
              ? [text]
              : ["No availability added yet"];
        return { participant, lines };
      }),
    [participants]
  );

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">
        Everyone&apos;s availability
      </p>
      <ul className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ participant, lines }) => {
          const canEdit =
            onEditParticipant &&
            (!canEditParticipant || canEditParticipant(participant));
          const body = (
            <>
              <span className="flex w-full items-start justify-between gap-2">
                <span className="min-w-0 text-sm font-medium text-ink">
                  {participant.name}
                  {participant.flagEmoji ? ` ${participant.flagEmoji}` : ""}
                </span>
                {canEdit ? (
                  <span
                    className="shrink-0 rounded-md bg-ink/[0.04] p-1 text-ocean-deep"
                    aria-hidden
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </span>
              {lines.map((line) => (
                <span
                  key={line}
                  className="mt-0.5 block text-xs leading-relaxed text-ink-soft"
                >
                  {line}
                </span>
              ))}
            </>
          );
          return (
            <li key={participant.id} className="flex min-h-0 min-w-0">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => onEditParticipant(participant)}
                  className="flex h-full w-full flex-col items-stretch rounded-xl border border-ink/15 px-3 py-2.5 text-left transition hover:border-ocean/35"
                  aria-label={`Edit ${participant.name}`}
                >
                  {body}
                </button>
              ) : (
                <div className="flex h-full w-full flex-col items-stretch rounded-xl border border-ink/15 px-3 py-2.5 text-left">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AvailabilityTimeline({
  participants,
  slots,
  activeSlotId,
  onActiveSlotChange,
  onSelectSlot,
  onEditParticipant,
  canEditParticipant,
}: {
  participants: Participant[];
  slots: MeetingSlot[];
  activeSlotId?: string | null;
  onActiveSlotChange?: (slotId: string) => void;
  onSelectSlot?: (slot: MeetingSlot) => void;
  onEditParticipant?: (participant: Participant) => void;
  canEditParticipant?: (participant: Participant) => boolean;
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
            <div className="sticky left-0 z-20 w-28 shrink-0 bg-white sm:w-32" aria-hidden />
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
              const canEdit =
                onEditParticipant &&
                (!canEditParticipant || canEditParticipant(participant));
              const nameBlock = (
                <>
                  <span className="block truncate text-sm font-medium text-ink">
                    {participant.name}
                  </span>
                  <span className="block truncate text-[11px] text-ink-soft">
                    {participant.cityLabel}
                    {meetingTime ? (
                      <span className="font-medium text-ocean-deep">
                        {" "}
                        · {meetingTime}
                      </span>
                    ) : null}
                  </span>
                </>
              );
              return (
                <li key={participant.id} className="flex items-center gap-0">
                  <div className="sticky left-0 z-20 w-28 shrink-0 bg-white pr-1 sm:w-32">
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => onEditParticipant(participant)}
                        className="w-full truncate text-left transition hover:text-ocean-deep"
                        aria-label={`Edit ${participant.name}`}
                      >
                        {nameBlock}
                      </button>
                    ) : (
                      <div className="w-full truncate text-left">{nameBlock}</div>
                    )}
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
              <div className="sticky left-0 z-20 w-28 shrink-0 bg-white sm:w-32" aria-hidden />
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
              No good compromise yet. Try adjusting your availability.
            </p>
          ) : null}
        </div>
      </div>

      <AvailabilitySummaryList
        participants={participants}
        onEditParticipant={onEditParticipant}
        canEditParticipant={canEditParticipant}
      />

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
  canEditParticipant,
  onSaveParticipant,
  onRemoveParticipant,
}: {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
  slots: MeetingSlot[];
  initialSlotId?: string | null;
  onSelectSlot?: (slot: MeetingSlot) => void;
  canEditParticipant?: (participant: Participant) => boolean;
  onSaveParticipant?: (
    participant: Participant,
    draft: ParticipantDraft
  ) => void;
  onRemoveParticipant?: (participant: Participant) => void;
}) {
  const [activeSlotId, setActiveSlotId] = useState<string | null>(
    initialSlotId ?? slots[0]?.id ?? null
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingParticipant =
    editingId == null
      ? null
      : (participants.find((p) => p.id === editingId) ?? null);

  useEffect(() => {
    if (!open) return;
    setActiveSlotId(initialSlotId ?? slots[0]?.id ?? null);
  }, [open, initialSlotId, slots]);

  useEffect(() => {
    if (!open) setEditingId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const showEdit = Boolean(editingParticipant && onSaveParticipant);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-ink/40 pt-1.5 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-h-[85vh] sm:rounded-2xl sm:p-6 ${
          showEdit ? "max-w-lg" : "max-w-3xl"
        }`}
      >
        {showEdit && editingParticipant ? (
          <>
            <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="mb-2 inline-flex items-center gap-1 text-sm text-ink-soft transition hover:text-ink"
                >
                  <BackIcon />
                  <span>View and Edit Schedule</span>
                </button>
                <h2 className="font-display text-2xl text-ink">
                  Update details
                </h2>
              </div>
              <button
                type="button"
                className="shrink-0 text-ink-soft hover:text-ink"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
            <ParticipantForm
              key={editingParticipant.id}
              initial={participantToDraft(editingParticipant)}
              submitLabel="Save"
              onSubmit={(draft) => {
                onSaveParticipant?.(editingParticipant, draft);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
              allowRemove={
                Boolean(onRemoveParticipant) && !editingParticipant.isCreator
              }
              onRemove={
                onRemoveParticipant
                  ? () => {
                      onRemoveParticipant(editingParticipant);
                      setEditingId(null);
                    }
                  : undefined
              }
            />
          </>
        ) : (
          <>
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-ink">
                View and Edit Schedule
              </h2>
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
              onEditParticipant={
                onSaveParticipant ? (p) => setEditingId(p.id) : undefined
              }
              canEditParticipant={
                onSaveParticipant
                  ? (p) => !canEditParticipant || canEditParticipant(p)
                  : undefined
              }
              onSelectSlot={
                onSelectSlot
                  ? (slot) => {
                      onSelectSlot(slot);
                      onClose();
                    }
                  : undefined
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
