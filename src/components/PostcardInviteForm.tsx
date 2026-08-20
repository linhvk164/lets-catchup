"use client";

import { useEffect, useMemo, useState } from "react";
import { AvailabilityInterpretation } from "@/components/AvailabilityInterpretation";
import { PhotoPicker } from "@/components/PhotoPicker";
import { TimezonePicker } from "@/components/TimezonePicker";
import { Button, Field, FieldActionButton, TextArea } from "@/components/ui";
import { parseAvailabilityInput } from "@/lib/availability";
import {
  getMessageFont,
  messageFontFamily,
  messageFontSizePx,
  nextMessageFontId,
  resolveMessageFontId,
  type MessageFontId,
} from "@/lib/message-fonts";
import { getDefaultPhoto } from "@/lib/photos";
import {
  isPostcardMessageTooLong,
  MESSAGE_TOO_LONG_HINT,
} from "@/lib/postcard-copy";
import { detectTimezone } from "@/lib/timezone";
import { participantTagColorFromSeed } from "@/lib/participant-tag";
import type {
  CatchUp,
  Participant,
  PostcardPhoto,
  TimezoneInfo,
} from "@/lib/types";

export const INVITE_TITLE_PLACEHOLDER = "Coffee catch-up";
export const DEFAULT_DURATION = 30;

export type InviteFormValues = {
  name: string;
  title: string;
  message: string;
  messageFont: MessageFontId;
  photo: PostcardPhoto;
  timezone: TimezoneInfo;
  availability: string;
};

function creatorFromCatchUp(catchUp: CatchUp): Participant | undefined {
  return (
    catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0]
  );
}

export function buildDraftCatchUp(
  values: InviteFormValues,
  options?: { id?: string; existing?: CatchUp }
): CatchUp {
  const parsed = parseAvailabilityInput(
    values.availability || "Usually free after 6 PM."
  );
  const existingCreator = options?.existing
    ? creatorFromCatchUp(options.existing)
    : undefined;
  const creatorId = existingCreator?.id ?? "draft-creator";

  const creator: Participant = {
    id: creatorId,
    name: values.name.trim() || "You",
    timezone: values.timezone.timezone,
    cityLabel: values.timezone.cityLabel,
    countryCode: values.timezone.countryCode,
    countryLabel: values.timezone.countryLabel,
    flagEmoji: values.timezone.flagEmoji,
    tagColor:
      existingCreator?.tagColor ?? participantTagColorFromSeed(creatorId),
    availabilityText: values.availability,
    rules: parsed.rules,
    preferences: parsed.preferences,
    flexibility: parsed.flexibility,
    exceptions: parsed.exceptions,
    isCreator: true,
  };

  const others =
    options?.existing?.participants.filter((p) => p.id !== creatorId) ?? [];

  const trimmedMessage = values.message.trim();

  return {
    id: options?.id ?? options?.existing?.id ?? "draft",
    title: values.title.trim(),
    message: trimmedMessage || undefined,
    messageFont: values.messageFont,
    duration: options?.existing?.duration ?? DEFAULT_DURATION,
    createdAt: options?.existing?.createdAt ?? new Date().toISOString(),
    photo: values.photo,
    selectedSlotId: options?.existing?.selectedSlotId,
    participants: [creator, ...others],
  };
}

export function usePostcardInviteForm({
  mode,
  initialCatchUp,
  onSubmit,
  onCancel,
  submitLabel,
  formId = "postcard-invite-form",
  mobileStickySubmit = false,
  onRevealSide,
}: {
  mode: "create" | "edit";
  initialCatchUp?: CatchUp;
  onSubmit: (values: InviteFormValues) => void;
  onCancel?: () => void;
  submitLabel: string;
  formId?: string;
  /** When true, in-form submit is desktop-only; page renders a mobile sticky bar. */
  mobileStickySubmit?: boolean;
  /** Flip the live postcard preview to the face that shows this field. */
  onRevealSide?: (side: "front" | "back") => void;
}) {
  const creator = initialCatchUp ? creatorFromCatchUp(initialCatchUp) : undefined;

  const [name, setName] = useState(
    () => (creator?.name && creator.name !== "You" ? creator.name : "") || ""
  );
  const [title, setTitle] = useState(() => initialCatchUp?.title ?? "");
  const [message, setMessage] = useState(() => initialCatchUp?.message ?? "");
  const [messageFont, setMessageFont] = useState<MessageFontId>(() =>
    resolveMessageFontId(initialCatchUp?.messageFont)
  );
  const [photo, setPhoto] = useState<PostcardPhoto>(
    () => initialCatchUp?.photo ?? getDefaultPhoto()
  );
  const [timezone, setTimezone] = useState<TimezoneInfo>(() =>
    creator
      ? {
          timezone: creator.timezone,
          cityLabel: creator.cityLabel,
          countryCode: creator.countryCode,
          countryLabel: creator.countryLabel,
          flagEmoji: creator.flagEmoji,
        }
      : { timezone: "UTC", cityLabel: "UTC" }
  );
  const [availability, setAvailability] = useState(
    () => creator?.availabilityText ?? ""
  );
  const [errors, setErrors] = useState<{
    name?: string;
    title?: string;
    timezone?: string;
    availability?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (mode === "create") {
      setTimezone(detectTimezone());
    }
  }, [mode]);

  const values: InviteFormValues = useMemo(
    () => ({
      name,
      title,
      message,
      messageFont,
      photo,
      timezone,
      availability,
    }),
    [name, title, message, messageFont, photo, timezone, availability]
  );

  const draftCatchUp = useMemo(
    () =>
      buildDraftCatchUp(values, {
        id: mode === "edit" ? initialCatchUp?.id : "draft",
        existing: initialCatchUp,
      }),
    [values, mode, initialCatchUp]
  );

  const previewCatchUp = useMemo((): CatchUp => {
    if (name.trim()) return draftCatchUp;
    return {
      ...draftCatchUp,
      participants: draftCatchUp.participants.map((p, i) =>
        i === 0 || p.isCreator
          ? {
              ...p,
              name: "You",
              availabilityText: availability,
              // Keep parsed availability visible on the live canvas while drafting.
              rules: availability.trim() ? p.rules : [],
              exceptions: availability.trim() ? p.exceptions : [],
              preferences: availability.trim() ? p.preferences : undefined,
            }
          : p
      ),
    };
  }, [draftCatchUp, name, availability]);

  const parsed = useMemo(
    () => (availability.trim() ? parseAvailabilityInput(availability) : null),
    [availability]
  );

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please input your name";
    if (!title.trim()) next.title = "Please input a postcard title";
    if (!timezone.timezone) next.timezone = "Please choose a timezone";
    if (!availability.trim()) next.availability = "Please share your availability";
    setErrors(next);
    return next;
  }

  function validateStep(step: 1 | 2 | 3) {
    setSubmitted(true);
    if (step === 1) {
      const next = {
        name: name.trim() ? undefined : "Please input your name",
        title: title.trim() ? undefined : "Please input a postcard title",
        timezone: timezone.timezone ? undefined : "Please choose a timezone",
        availability: availability.trim()
          ? undefined
          : "Please share your availability",
      };
      setErrors(next);
      return !next.name && !next.title && !next.timezone && !next.availability;
    }
    // Photo step always allowed (default featured photo is fine).
    return true;
  }

  function submit() {
    setSubmitted(true);
    const next = validate();
    if (Object.keys(next).length > 0) return false;
    onSubmit(values);
    return true;
  }

  const form = (
    <form
      id={formId}
      className={
        mobileStickySubmit ? "space-y-6 pb-24 lg:pb-0" : "space-y-6"
      }
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        const next = validate();
        if (Object.keys(next).length > 0) return;
        onSubmit(values);
      }}
    >
      <Field
        label="Postcard title"
        name="title"
        placeholder={INVITE_TITLE_PLACEHOLDER}
        value={title}
        onFocus={() => onRevealSide?.("front")}
        onChange={(e) => {
          setTitle(e.target.value);
          if (submitted) {
            setErrors((er) => ({
              ...er,
              title: e.target.value.trim()
                ? undefined
                : "Please input a postcard title",
            }));
          }
        }}
        requiredMark
        error={submitted ? errors.title : undefined}
        hint="Coffee catch-up · Family call · Game night"
      />

      <Field
        label="Name"
        name="name"
        placeholder="Your name"
        value={name}
        onFocus={() => onRevealSide?.("front")}
        onChange={(e) => {
          setName(e.target.value);
          if (submitted) {
            setErrors((er) => ({
              ...er,
              name: e.target.value.trim() ? undefined : "Please input your name",
            }));
          }
        }}
        requiredMark
        error={submitted ? errors.name : undefined}
        autoComplete="given-name"
      />

      <TextArea
        label="Postcard message"
        name="message"
        placeholder="Optional note for the back of the postcard"
        value={message}
        onFocus={() => onRevealSide?.("back")}
        onChange={(e) => setMessage(e.target.value)}
        hint={
          isPostcardMessageTooLong(message)
            ? MESSAGE_TOO_LONG_HINT
            : "Leave blank to skip a handwritten note"
        }
        rows={1}
        className="!min-h-0 resize-none py-3"
        style={{
          fontFamily: messageFontFamily(messageFont),
          fontSize: `${messageFontSizePx(16, messageFont)}px`,
        }}
        labelAction={
          <FieldActionButton
            title={`Font: ${getMessageFont(messageFont).label}. Click to switch.`}
            aria-label={`Switch handwriting font. Current: ${getMessageFont(messageFont).label}`}
            onClick={() => {
              onRevealSide?.("back");
              setMessageFont((current) => nextMessageFontId(current));
            }}
          >
            <span aria-hidden>↻</span>
            Font:{" "}
            <span className="text-ink">{getMessageFont(messageFont).label}</span>
          </FieldActionButton>
        }
      />

      <TimezonePicker
        value={timezone}
        onChange={setTimezone}
        required
        error={submitted ? errors.timezone : undefined}
        onFocus={() => onRevealSide?.("back")}
      />

      <div className="space-y-2">
        <TextArea
          label="Tell us when you're usually free"
          name="availability"
          placeholder="Weekdays after work, weekends anytime, except August 20."
          value={availability}
          onFocus={() => onRevealSide?.("back")}
          onChange={(e) => {
            setAvailability(e.target.value);
            if (submitted) {
              setErrors((er) => ({
                ...er,
                availability: e.target.value.trim()
                  ? undefined
                  : "Please share your availability",
              }));
            }
          }}
          requiredMark
          error={submitted ? errors.availability : undefined}
          rows={2}
        />
        {parsed && parsed.debugLines.length > 0 ? (
          <div
            onFocusCapture={() => onRevealSide?.("back")}
            onPointerDown={() => onRevealSide?.("back")}
          >
            <AvailabilityInterpretation
              parsed={parsed}
              onChangeAvailability={(value) => {
                setAvailability(value);
                if (submitted) {
                  setErrors((er) => ({ ...er, availability: undefined }));
                }
              }}
            />
          </div>
        ) : null}
      </div>

      <PhotoPicker
        value={photo}
        onChange={(next) => {
          onRevealSide?.("front");
          setPhoto(next);
        }}
        onInteract={() => onRevealSide?.("front")}
      />

      <div
        className={
          mobileStickySubmit
            ? "hidden gap-2 lg:flex"
            : "flex items-center gap-2"
        }
      >
        <Button
          type="submit"
          className={onCancel ? "min-w-0 flex-1" : "w-full"}
        >
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );

  return {
    values,
    draftCatchUp,
    previewCatchUp,
    form,
    formId,
    submitLabel,
    parsed,
    errors,
    submitted,
    fields: {
      name,
      setName,
      title,
      setTitle,
      message,
      setMessage,
      messageFont,
      setMessageFont,
      photo,
      setPhoto,
      timezone,
      setTimezone,
      availability,
      setAvailability,
    },
    validate,
    validateStep,
    submit,
    setErrors,
    setSubmitted,
  };
}
