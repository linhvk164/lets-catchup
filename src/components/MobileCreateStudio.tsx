"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityInterpretation } from "@/components/AvailabilityInterpretation";
import { PhotoPicker } from "@/components/PhotoPicker";
import { PostcardPreviewModal } from "@/components/PostcardPreviewModal";
import { TimezonePicker } from "@/components/TimezonePicker";
import { FlippablePostcard } from "@/components/postcard";
import { INVITE_TITLE_PLACEHOLDER } from "@/components/PostcardInviteForm";
import { Button, Field, FieldActionButton, TextArea } from "@/components/ui";
import {
  getMessageFont,
  messageFontFamily,
  nextMessageFontId,
  type MessageFontId,
} from "@/lib/message-fonts";
import {
  isPostcardMessageTooLong,
  MESSAGE_TOO_LONG_HINT,
} from "@/lib/postcard-copy";
import type { ParsedAvailability } from "@/lib/availability";
import type { CatchUp, PostcardPhoto, TimezoneInfo } from "@/lib/types";
import { ConfettiBurst } from "@/components/ConfettiBurst";

export type CreateFlowStep = 1 | 2 | 3;

const STEPS: { id: CreateFlowStep; label: string }[] = [
  { id: 1, label: "Details" },
  { id: 2, label: "Photo" },
  { id: 3, label: "Share" },
];

type MobileCreateFlowProps = {
  catchUp: CatchUp;
  parsed: ParsedAvailability | null;
  errors: {
    name?: string;
    title?: string;
    timezone?: string;
    availability?: string;
  };
  submitted: boolean;
  fields: {
    name: string;
    setName: (value: string) => void;
    title: string;
    setTitle: (value: string) => void;
    message: string;
    setMessage: (value: string) => void;
    messageFont: MessageFontId;
    setMessageFont: (
      value: MessageFontId | ((current: MessageFontId) => MessageFontId)
    ) => void;
    photo: PostcardPhoto;
    setPhoto: (photo: PostcardPhoto) => void;
    timezone: TimezoneInfo;
    setTimezone: (timezone: TimezoneInfo) => void;
    availability: string;
    setAvailability: (value: string) => void;
  };
  validateStep: (step: CreateFlowStep) => boolean;
  /** Persist catch-up and return the share URL for step 3. */
  onFinish: () =>
    | { catchUp: CatchUp; shareUrl: string }
    | null
    | Promise<{ catchUp: CatchUp; shareUrl: string } | null>;
};

function CreateStepHeader({ step }: { step: CreateFlowStep }) {
  return (
    <nav
      aria-label="Creation progress"
      className="border-b border-ink/8 px-5 py-3"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <p className="shrink-0 text-sm font-medium text-ink">
          Step {step} of {STEPS.length}
        </p>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5" aria-hidden>
          {STEPS.map((item) => (
            <span
              key={item.id}
              className={`h-1 w-6 shrink-0 rounded-full ${
                item.id <= step ? "bg-ocean-deep" : "bg-ink/15"
              }`}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function FontCycleControl({
  messageFont,
  onCycle,
}: {
  messageFont: MessageFontId;
  onCycle: () => void;
}) {
  const font = getMessageFont(messageFont);
  return (
    <FieldActionButton
      onClick={onCycle}
      aria-label={`Switch font. Current: ${font.label}`}
    >
      <span aria-hidden>↻</span>
      Font: <span className="text-ink">{font.label}</span>
    </FieldActionButton>
  );
}

/**
 * Simple mobile create flow: form → photo → share.
 * Postcard is preview-only, not an editing surface.
 */
export function MobileCreateStudio({
  catchUp,
  parsed,
  errors,
  submitted,
  fields,
  validateStep,
  onFinish,
}: MobileCreateFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<CreateFlowStep>(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [finished, setFinished] = useState<{
    catchUp: CatchUp;
    shareUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const liveFontStyle = useMemo(
    () => ({ fontFamily: messageFontFamily(fields.messageFont) }),
    [fields.messageFont]
  );

  function openPreview() {
    setScrollY(window.scrollY);
    setPreviewOpen(true);
  }

  function closePreview() {
    setPreviewOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  }

  function goNext() {
    if (step === 1) {
      if (!validateStep(1)) return;
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === 2) {
      if (!validateStep(2)) return;
      void (async () => {
        const result = await onFinish();
        if (!result) return;
        setFinished(result);
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      })();
    }
  }

  function goBack() {
    if (step === 2) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function copyLink() {
    if (!finished?.shareUrl) return;
    await navigator.clipboard.writeText(finished.shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (!finished) return;
    const creator =
      finished.catchUp.participants.find((p) => p.isCreator) ??
      finished.catchUp.participants[0];
    const fromName = creator?.name?.trim() || "Someone special";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Catchup invite from ${fromName}`,
          text: `${fromName} sent you a postcard invite.`,
          url: finished.shareUrl,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyLink();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col lg:hidden">
      <CreateStepHeader step={step} />

      {step === 1 ? (
        <>
          <div ref={formScrollRef} className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-5">
            <div className="mb-6">
              <h1 className="font-display text-3xl text-ink">
                Create a postcard invite
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                Fill in a few details. Invite people by sharing this postcard.
              </p>
            </div>

            <div className="space-y-5">
              <Field
                label="Postcard title"
                name="title"
                placeholder={INVITE_TITLE_PLACEHOLDER}
                value={fields.title}
                onChange={(e) => fields.setTitle(e.target.value)}
                requiredMark
                error={submitted ? errors.title : undefined}
                hint="Coffee catch-up · Family call · Game night"
              />

              <Field
                label="Your name"
                name="name"
                placeholder="Your name"
                value={fields.name}
                onChange={(e) => fields.setName(e.target.value)}
                requiredMark
                error={submitted ? errors.name : undefined}
                autoComplete="given-name"
              />

              <TextArea
                label="Personal message"
                name="message"
                placeholder="Can't wait to catch up!"
                value={fields.message}
                onChange={(e) => fields.setMessage(e.target.value)}
                hint={
                  isPostcardMessageTooLong(fields.message)
                    ? MESSAGE_TOO_LONG_HINT
                    : "Optional note on the back of the postcard"
                }
                rows={1}
                className="!min-h-0 resize-none py-3"
                style={liveFontStyle}
                labelAction={
                  <FontCycleControl
                    messageFont={fields.messageFont}
                    onCycle={() =>
                      fields.setMessageFont((current) =>
                        nextMessageFontId(current)
                      )
                    }
                  />
                }
              />

              <TimezonePicker
                value={fields.timezone}
                onChange={fields.setTimezone}
                required
                error={submitted ? errors.timezone : undefined}
              />

              <div className="space-y-2">
                <TextArea
                  label="Availability"
                  name="availability"
                  placeholder="Weekdays after work, weekends anytime"
                  value={fields.availability}
                  onChange={(e) => fields.setAvailability(e.target.value)}
                  requiredMark
                  error={submitted ? errors.availability : undefined}
                  rows={2}
                />
                {parsed && parsed.debugLines.length > 0 ? (
                  <AvailabilityInterpretation
                    parsed={parsed}
                    onChangeAvailability={fields.setAvailability}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/8 bg-paper/95 px-4 py-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-lg items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-4"
                onClick={openPreview}
              >
                Preview postcard
              </Button>
              <Button type="button" className="min-w-0 flex-1" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-5">
            <div className="mb-6">
              <h1 className="font-display text-3xl text-ink">Choose postcard</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Upload your own or pick a featured photo.
              </p>
            </div>

            <div className="mx-auto mb-6 flex w-full justify-center">
              <FlippablePostcard catchUp={catchUp} large />
            </div>

            <PhotoPicker
              value={fields.photo}
              onChange={fields.setPhoto}
              focused
            />
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/8 bg-paper/95 px-4 py-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-lg items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-4"
                onClick={goBack}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-4"
                onClick={openPreview}
              >
                Preview
              </Button>
              <Button type="button" className="min-w-0 flex-1" onClick={goNext}>
                Continue
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {step === 3 && finished ? (
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-5">
          <ConfettiBurst active />
          <div className="mb-6 animate-fade-rise text-center">
            <h1 className="font-display text-3xl text-ink">Ready to share</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Send this postcard to your friends.
            </p>
          </div>

          <div className="postcard-celebrate-enter mx-auto flex w-full justify-center">
            <FlippablePostcard
              catchUp={finished.catchUp}
              large
              autoFlipToBackAfterMs={1000}
            />
          </div>

          <div className="mt-6 flex flex-col gap-2.5 animate-fade-rise">
            <Button
              type="button"
              className="w-full py-3.5 text-base"
              onClick={shareLink}
            >
              Share Postcard
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full py-3.5 text-base"
              onClick={copyLink}
            >
              {copied ? "Copied" : "Copy Link"}
            </Button>
            <button
              type="button"
              onClick={() => {
                router.push(`/catchup/${finished.catchUp.id}/edit`);
              }}
              className="mt-1 py-1 text-center text-sm text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
            >
              Edit postcard
            </button>
          </div>
        </div>
      ) : null}

      <PostcardPreviewModal
        open={previewOpen}
        onClose={closePreview}
        catchUp={catchUp}
      />
    </div>
  );
}
