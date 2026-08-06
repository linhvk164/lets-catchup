"use client";

import { useCallback, useRef, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";
import { MobileCreateStudio } from "@/components/MobileCreateStudio";
import { SiteHeader } from "@/components/SiteHeader";
import { FlippablePostcard } from "@/components/postcard";
import { usePostcardInviteForm } from "@/components/PostcardInviteForm";
import { parseAvailabilityInput } from "@/lib/availability";
import {
  buildSharePath,
  createCatchUpId,
  markAsCreator,
  saveCatchUp,
} from "@/lib/storage";
import type { CatchUp } from "@/lib/types";

const participantId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export default function CreatePage() {
  const router = useRouter();
  const savedIdRef = useRef<string | null>(null);

  const buildCatchUp = useCallback(
    (values: {
      name: string;
      title: string;
      message: string;
      messageFont: string;
      photo: CatchUp["photo"];
      timezone: {
        timezone: string;
        cityLabel: string;
        countryCode?: string;
        countryLabel?: string;
        flagEmoji?: string;
      };
      availability: string;
    }): CatchUp => {
      const parsedAvailability = parseAvailabilityInput(values.availability);
      const trimmedMessage = values.message.trim();
      const id = savedIdRef.current ?? createCatchUpId();
      savedIdRef.current = id;
      const creatorId = participantId();
      return {
        id,
        title: values.title.trim(),
        message: trimmedMessage || undefined,
        messageFont: values.messageFont,
        duration: 30,
        createdAt: new Date().toISOString(),
        photo: values.photo,
        participants: [
          {
            id: creatorId,
            name: values.name.trim(),
            timezone: values.timezone.timezone,
            cityLabel: values.timezone.cityLabel,
            countryCode: values.timezone.countryCode,
            countryLabel: values.timezone.countryLabel,
            flagEmoji: values.timezone.flagEmoji,
            availabilityText: values.availability.trim(),
            rules: parsedAvailability.rules,
            preferences: parsedAvailability.preferences,
            flexibility: parsedAvailability.flexibility,
            exceptions: parsedAvailability.exceptions,
            isCreator: true,
          },
        ],
      };
    },
    []
  );

  function persistCreated(catchUp: CatchUp) {
    saveCatchUp(catchUp);
    const creator = catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0];
    if (creator) markAsCreator(catchUp.id, creator.id);
  }

  const {
    values,
    previewCatchUp,
    form,
    parsed,
    errors,
    submitted,
    fields,
    validateStep,
  } = usePostcardInviteForm({
    mode: "create",
    formId: "create-postcard-form",
    mobileStickySubmit: true,
    submitLabel: "Ready to share",
    onSubmit: (formValues) => {
      const catchUp = buildCatchUp(formValues);
      persistCreated(catchUp);
      router.push(buildSharePath(catchUp));
    },
  });

  function finishMobile() {
    if (!validateStep(2)) return null;
    const catchUp = buildCatchUp(values);
    persistCreated(catchUp);
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${buildSharePath(catchUp)}`
        : buildSharePath(catchUp);
    return { catchUp, shareUrl };
  }

  return (
    <>
      {/* Mobile: simple stepped form */}
      <div className="lg:hidden">
        <MobileCreateStudio
          catchUp={previewCatchUp}
          parsed={parsed}
          errors={errors}
          submitted={submitted}
          fields={fields}
          validateStep={validateStep}
          onFinish={finishMobile}
        />
      </div>

      {/* Desktop: classic two-column create */}
      <div className="hidden min-h-full flex-col lg:flex">
        <SiteHeader compact />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
          <div className="animate-fade-rise max-w-xl">
            <h1 className="font-display text-3xl text-ink sm:text-4xl">
              Create a postcard invite
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Fill in a few details. Invite people by sharing this postcard.
            </p>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <aside>
              <div className="sticky top-6 z-10 self-start">
                <ViewTransition name="opa-postcard" share="morph" default="none">
                  <FlippablePostcard catchUp={previewCatchUp} large />
                </ViewTransition>
              </div>
            </aside>
            <div className="min-w-0">{form}</div>
          </div>
        </main>
      </div>
    </>
  );
}
