"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";
import { SiteHeader } from "@/components/SiteHeader";
import { TimezonePicker } from "@/components/TimezonePicker";
import { ExceptionEditor } from "@/components/ExceptionEditor";
import { FlippablePostcard } from "@/components/postcard";
import { PostcardPreviewModal } from "@/components/PostcardPreviewModal";
import { Button, Chip, Field, TextArea } from "@/components/ui";
import { parseAvailabilityInput } from "@/lib/availability";
import { buildSharePath, createCatchUpId, saveCatchUp } from "@/lib/storage";
import { detectTimezone } from "@/lib/timezone";
import type { CatchUp, DurationMinutes, ExceptionDate, TimezoneInfo } from "@/lib/types";

const participantId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);
const DURATIONS: DurationMinutes[] = [15, 30, 45, 60];
const EXAMPLES = [
  "Anytime",
  "I am free after work on weekdays.",
  "Weekends anytime.",
  "Usually free after 6 PM.",
];

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Let's Catch up");
  const [duration, setDuration] = useState<DurationMinutes>(30);
  const [timezone, setTimezone] = useState<TimezoneInfo>({
    timezone: "UTC",
    cityLabel: "UTC",
  });
  const [availability, setAvailability] = useState("");
  const [exceptionInput, setExceptionInput] = useState("");
  const [exceptions, setExceptions] = useState<ExceptionDate[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    title?: string;
    timezone?: string;
    availability?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  const parsed = useMemo(
    () => (availability.trim() ? parseAvailabilityInput(availability) : null),
    [availability]
  );

  const draftCatchUp: CatchUp = useMemo(() => {
    const parsedDraft = parseAvailabilityInput(
      availability || "Usually free after 6 PM."
    );
    return {
      id: "draft",
      title: title.trim() || "Let's Catch up",
      duration,
      createdAt: new Date().toISOString(),
      participants: [
        {
          id: "draft-creator",
          name: name.trim() || "You",
          timezone: timezone.timezone,
          cityLabel: timezone.cityLabel,
          countryCode: timezone.countryCode,
          countryLabel: timezone.countryLabel,
          flagEmoji: timezone.flagEmoji,
          availabilityText: availability,
          rules: parsedDraft.rules,
          preferences: parsedDraft.preferences,
          flexibility: parsedDraft.flexibility,
          exceptions,
          isCreator: true,
        },
      ],
    };
  }, [name, title, duration, timezone, availability, exceptions]);

  // Show city from detected timezone even before name is entered
  const previewCatchUp: CatchUp = useMemo(
    () => ({
      ...draftCatchUp,
      participants: name.trim()
        ? draftCatchUp.participants
        : [
            {
              id: "draft-creator",
              name: "You",
              timezone: timezone.timezone,
              cityLabel: timezone.cityLabel,
              countryCode: timezone.countryCode,
              countryLabel: timezone.countryLabel,
              flagEmoji: timezone.flagEmoji,
              availabilityText: availability,
              rules: [],
              exceptions: [],
              isCreator: true,
            },
          ],
    }),
    [draftCatchUp, name, timezone, availability]
  );

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please input your name";
    if (!title.trim()) next.title = "Please input a catchup title";
    if (!timezone.timezone) next.timezone = "Please choose a timezone";
    if (!availability.trim()) next.availability = "Please share your availability";
    setErrors(next);
    return next;
  }

  function createInvitation() {
    setSubmitted(true);
    const next = validate();
    if (Object.keys(next).length > 0) return;

    const parsedAvailability = parseAvailabilityInput(availability);
    const catchUp: CatchUp = {
      id: createCatchUpId(),
      title: title.trim(),
      duration,
      createdAt: new Date().toISOString(),
      participants: [
        {
          id: participantId(),
          name: name.trim(),
          timezone: timezone.timezone,
          cityLabel: timezone.cityLabel,
          countryCode: timezone.countryCode,
          countryLabel: timezone.countryLabel,
          flagEmoji: timezone.flagEmoji,
          availabilityText: availability.trim(),
          rules: parsedAvailability.rules,
          preferences: parsedAvailability.preferences,
          flexibility: parsedAvailability.flexibility,
          exceptions,
          isCreator: true,
        },
      ],
    };

    saveCatchUp(catchUp);
    router.push(buildSharePath(catchUp));
  }

  const form = (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        createInvitation();
      }}
    >
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

      <Field
        label="Catchup title"
        name="title"
        placeholder="Coffee catch-up"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (submitted) {
            setErrors((er) => ({
              ...er,
              title: e.target.value.trim()
                ? undefined
                : "Please input a catchup title",
            }));
          }
        }}
        requiredMark
        error={submitted ? errors.title : undefined}
        hint="Coffee catch-up · Family call · Game night"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Duration</p>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>
              {d} min
            </Chip>
          ))}
        </div>
      </div>

      <TimezonePicker
        value={timezone}
        onChange={setTimezone}
        required
        error={submitted ? errors.timezone : undefined}
      />

      <div className="space-y-2">
        <TextArea
          label="Availability"
          name="availability"
          placeholder="What does your usual availability look like?"
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
            <p className="text-sm text-ink">{parsed.summary}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {parsed.debugLines.map((line) => (
                <li key={line} className="text-sm text-ink">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ExceptionEditor
        exceptions={exceptions}
        onChange={setExceptions}
        input={exceptionInput}
        onInputChange={setExceptionInput}
      />

      <Button type="submit" className="w-full">
        Create invitation
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="animate-fade-rise max-w-xl">
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            Create an invitation
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Fill in a few details. Invite people by sharing this postcard.
          </p>
        </div>

        <div className="mt-6 lg:hidden">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setPreviewOpen(true)}
          >
            Preview postcard
          </Button>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
          <aside className="hidden self-start lg:block">
            <div className="sticky top-8">
              <FlippablePostcard
                catchUp={previewCatchUp}
                compact
                transitionName="opa-postcard"
              />
            </div>
          </aside>
          <div>{form}</div>
        </div>
      </main>

      <PostcardPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        catchUp={previewCatchUp}
      />
    </div>
  );
}
