"use client";

import { useCallback, useRef, useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";
import { MobileCreateStudio } from "@/components/MobileCreateStudio";
import { FlippablePostcard } from "@/components/postcard";
import { usePostcardInviteForm } from "@/components/PostcardInviteForm";
import { SiteHeader } from "@/components/SiteHeader";
import { parseAvailabilityInput } from "@/lib/availability";
import {
  buildSharePath,
  createCatchUpId,
  markAsCreator,
  saveCatchUp,
} from "@/lib/storage";
import { apiCreateCatchUp } from "@/lib/catchup-api";
import { markPostcardCelebrate } from "@/components/ConfettiBurst";
import type { CatchUp } from "@/lib/types";

const participantId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export default function CreatePage() {
  const router = useRouter();
  const savedIdRef = useRef<string | null>(null);
  const [flipped, setFlipped] = useState(false);

  const revealSide = useCallback((side: "front" | "back") => {
    setFlipped(side === "back");
  }, []);

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

  async function persistCreated(catchUp: CatchUp) {
    saveCatchUp(catchUp);
    const creator =
      catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0];
    if (creator) markAsCreator(catchUp.id, creator.id);
    const { catchUp: saved } = await apiCreateCatchUp(catchUp);
    saveCatchUp(saved);
    return saved;
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
    onRevealSide: revealSide,
    onSubmit: (formValues) => {
      void (async () => {
        const catchUp = buildCatchUp(formValues);
        try {
          const saved = await persistCreated(catchUp);
          markPostcardCelebrate(saved.id);
          router.push(buildSharePath(saved));
        } catch (err) {
          console.error(err);
          // Still navigate with local copy so create isn't blocked offline
          markPostcardCelebrate(catchUp.id);
          router.push(buildSharePath(catchUp));
        }
      })();
    },
  });

  async function finishMobile() {
    if (!validateStep(2)) return null;
    const catchUp = buildCatchUp(values);
    let saved = catchUp;
    try {
      saved = await persistCreated(catchUp);
    } catch (err) {
      console.error(err);
      saveCatchUp(catchUp);
      const creator =
        catchUp.participants.find((p) => p.isCreator) ??
        catchUp.participants[0];
      if (creator) markAsCreator(catchUp.id, creator.id);
    }
    markPostcardCelebrate(saved.id);
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${buildSharePath(saved)}`
        : buildSharePath(saved);
    return { catchUp: saved, shareUrl };
  }

  return (
    <>
      <SiteHeader compact />

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
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-5">
          <div className="animate-fade-rise max-w-xl">
            <h1 className="font-display text-3xl text-ink sm:text-4xl">
              Create a postcard invite
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Fill in a few details. Invite people by sharing this postcard.
            </p>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
            <aside className="flex justify-center">
              <div className="sticky top-6 z-30 w-full max-w-none self-start overflow-visible">
                <ViewTransition name="opa-postcard" share="morph" default="none">
                  <FlippablePostcard
                    catchUp={previewCatchUp}
                    large
                    flipped={flipped}
                    onFlipChange={setFlipped}
                  />
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
