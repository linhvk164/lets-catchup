"use client";

import { useEffect, useMemo, useState } from "react";
import { AvailabilityInterpretation } from "@/components/AvailabilityInterpretation";
import { TimezonePicker } from "@/components/TimezonePicker";
import { Button, Field, TextArea } from "@/components/ui";
import { parseAvailabilityInput } from "@/lib/availability";
import { pickRandomParticipantTagColor } from "@/lib/participant-tag";
import { detectTimezone, getTimezoneInfo } from "@/lib/timezone";
import type { Participant, TimezoneInfo } from "@/lib/types";
import { createParticipantId } from "@/hooks/useCatchUp";

export type ParticipantDraft = {
  name: string;
  timezone: TimezoneInfo;
  availability: string;
};

export function participantToDraft(p: Participant): ParticipantDraft {
  return {
    name: p.name,
    timezone: getTimezoneInfo(p.timezone),
    availability: p.availabilityText,
  };
}

export function draftToParticipant(
  draft: ParticipantDraft,
  opts?: { id?: string; isCreator?: boolean; tagColor?: string }
): Participant {
  const parsed = parseAvailabilityInput(draft.availability.trim());
  return {
    id: opts?.id ?? createParticipantId(),
    name: draft.name.trim(),
    timezone: draft.timezone.timezone,
    cityLabel: draft.timezone.cityLabel,
    countryCode: draft.timezone.countryCode,
    countryLabel: draft.timezone.countryLabel,
    flagEmoji: draft.timezone.flagEmoji,
    tagColor: opts?.tagColor ?? pickRandomParticipantTagColor(),
    availabilityText: draft.availability.trim(),
    rules: parsed.rules,
    preferences: parsed.preferences,
    flexibility: parsed.flexibility,
    exceptions: parsed.exceptions,
    isCreator: opts?.isCreator,
  };
}

export function ParticipantForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  allowRemove,
  onRemove,
}: {
  initial?: ParticipantDraft;
  submitLabel: string;
  onSubmit: (draft: ParticipantDraft) => void;
  onCancel?: () => void;
  allowRemove?: boolean;
  onRemove?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [timezone, setTimezone] = useState<TimezoneInfo>(
    initial?.timezone ?? { timezone: "UTC", cityLabel: "UTC" }
  );
  const [availability, setAvailability] = useState(initial?.availability ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    timezone?: string;
    availability?: string;
  }>({});

  useEffect(() => {
    if (!initial) {
      setTimezone(detectTimezone());
    }
  }, [initial]);

  const parsed = useMemo(
    () => (availability.trim() ? parseAvailabilityInput(availability) : null),
    [availability]
  );

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please input your name";
    if (!timezone.timezone) next.timezone = "Please choose a timezone";
    if (!availability.trim()) next.availability = "Please share your availability";
    setErrors(next);
    return next;
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (Object.keys(validate()).length > 0) return;
        onSubmit({ name, timezone, availability });
      }}
    >
      <Field
        label="Name"
        name="participant-name"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        requiredMark
        error={submitted ? errors.name : undefined}
      />

      <TimezonePicker
        value={timezone}
        onChange={setTimezone}
        required
        error={submitted ? errors.timezone : undefined}
      />

      <div className="space-y-2">
        <TextArea
          label="Tell us when you're usually free"
          name="participant-availability"
          placeholder="Weekdays after work, weekends anytime, except August 20."
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          requiredMark
          error={submitted ? errors.availability : undefined}
          rows={2}
        />
        {parsed && parsed.debugLines.length > 0 ? (
          <AvailabilityInterpretation
            parsed={parsed}
            onChangeAvailability={setAvailability}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>

      {allowRemove && onRemove ? (
        <button
          type="button"
          className="w-full text-sm text-stamp hover:underline"
          onClick={onRemove}
        >
          Remove from postcard
        </button>
      ) : null}
    </form>
  );
}

export function ParticipantEditorSheet({
  open,
  mode,
  participant,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  mode: "add" | "edit" | "join";
  participant?: Participant | null;
  onClose: () => void;
  onSave: (draft: ParticipantDraft) => void;
  onRemove?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const titles = {
    add: "Add a friend",
    edit: "Update details",
    join: "Join this catch-up",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-hidden bg-ink/40 pt-3 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[calc(100dvh-0.75rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">{titles[mode]}</h2>
          <button type="button" className="text-ink-soft hover:text-ink" onClick={onClose}>
            ✕
          </button>
        </div>
        <ParticipantForm
          key={participant?.id ?? mode}
          initial={participant ? participantToDraft(participant) : undefined}
          submitLabel={mode === "edit" ? "Save" : mode === "join" ? "Join" : "Add"}
          onSubmit={(draft) => {
            onSave(draft);
            onClose();
          }}
          onCancel={onClose}
          allowRemove={mode === "edit" && !participant?.isCreator}
          onRemove={
            onRemove
              ? () => {
                  onRemove();
                  onClose();
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
