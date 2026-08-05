"use client";

import { useEffect, useMemo, useState } from "react";
import { PhotoPicker } from "@/components/PhotoPicker";
import { TimezonePicker } from "@/components/TimezonePicker";
import { Button, Field, TextArea } from "@/components/ui";
import { parseAvailabilityInput } from "@/lib/availability";
import {
  getMessageFont,
  nextMessageFontId,
  resolveMessageFontId,
  type MessageFontId,
} from "@/lib/message-fonts";
import { getDefaultPhoto } from "@/lib/photos";
import { detectTimezone } from "@/lib/timezone";
import type {
  CatchUp,
  Participant,
  PostcardPhoto,
  TimezoneInfo,
} from "@/lib/types";

export const DEFAULT_INVITE_TITLE = "Let's Catch-up ᯓ 💌";
export const DEFAULT_DURATION = 30;

const EXAMPLES = [
  "Weekdays 10am–5pm",
  "Evenings, not tomorrow",
  "Weekends anytime",
];

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
    title: values.title.trim() || DEFAULT_INVITE_TITLE,
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
}: {
  mode: "create" | "edit";
  initialCatchUp?: CatchUp;
  onSubmit: (values: InviteFormValues) => void;
  onCancel?: () => void;
  submitLabel: string;
  formId?: string;
  /** When true, in-form submit is desktop-only; page renders a mobile sticky bar. */
  mobileStickySubmit?: boolean;
}) {
  const creator = initialCatchUp ? creatorFromCatchUp(initialCatchUp) : undefined;

  const [name, setName] = useState(
    () => (creator?.name && creator.name !== "You" ? creator.name : "") || ""
  );
  const [title, setTitle] = useState(
    () => initialCatchUp?.title ?? DEFAULT_INVITE_TITLE
  );
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
              rules: [],
              exceptions: [],
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
        placeholder="Let's Catch-up ᯓ 💌"
        value={title}
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
        onChange={(e) => setMessage(e.target.value)}
        hint="Leave blank to skip a handwritten note"
        labelAction={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white/70 px-2 py-1 text-xs font-medium text-ink-soft transition hover:border-ocean/30 hover:text-ink"
            title={`Font: ${getMessageFont(messageFont).label}. Click to switch.`}
            aria-label={`Switch handwriting font. Current: ${getMessageFont(messageFont).label}`}
            onClick={() => setMessageFont((current) => nextMessageFontId(current))}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 20h5" />
              <path d="M15 20h5" />
              <path d="M6.5 20 12 4l5.5 16" />
              <path d="M8.5 14h7" />
            </svg>
            Switch font
          </button>
        }
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
          name="availability"
          placeholder="Weekdays after work, weekends anytime, except August 20."
          value={availability}
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
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="rounded-lg border border-ink/10 bg-white px-2.5 py-1 text-left text-xs text-ink-soft hover:bg-white/70"
              onClick={() => {
                setAvailability(ex);
                if (submitted) {
                  setErrors((er) => ({ ...er, availability: undefined }));
                }
              }}
            >
              {ex}
            </button>
          ))}
        </div>
        {parsed && parsed.debugLines.length > 0 ? (
          <div className="rounded-xl border border-ocean/20 bg-ocean/5 px-3 py-2.5">
            <p className="text-sm font-medium text-ink">{parsed.summary}</p>
            <ul className="mt-1.5 space-y-1">
              {parsed.debugLines.map((line) => (
                <li key={line} className="text-sm text-ink">
                  <span className="text-ocean" aria-hidden>
                    ✓{" "}
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <PhotoPicker value={photo} onChange={setPhoto} />

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

  return { values, draftCatchUp, previewCatchUp, form, formId, submitLabel };
}
