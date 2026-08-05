"use client";

import { useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";
import { SiteHeader } from "@/components/SiteHeader";
import { FlippablePostcard } from "@/components/postcard";
import { PostcardPreviewModal } from "@/components/PostcardPreviewModal";
import { usePostcardInviteForm } from "@/components/PostcardInviteForm";
import { Button } from "@/components/ui";
import { parseAvailabilityInput } from "@/lib/availability";
import { buildSharePath, createCatchUpId, saveCatchUp } from "@/lib/storage";
import type { CatchUp } from "@/lib/types";

const participantId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export default function CreatePage() {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);

  const { previewCatchUp, form, formId, submitLabel } = usePostcardInviteForm({
    mode: "create",
    formId: "create-postcard-form",
    mobileStickySubmit: true,
    submitLabel: "Ready to share",
    onSubmit: (values) => {
      const parsedAvailability = parseAvailabilityInput(values.availability);
      const trimmedMessage = values.message.trim();
      const catchUp: CatchUp = {
        id: createCatchUpId(),
        title: values.title.trim(),
        message: trimmedMessage || undefined,
        messageFont: values.messageFont,
        duration: 30,
        createdAt: new Date().toISOString(),
        photo: values.photo,
        participants: [
          {
            id: participantId(),
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

      saveCatchUp(catchUp);
      router.push(buildSharePath(catchUp));
    },
  });

  return (
    <div className="flex min-h-full flex-col">
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
          <aside className="order-first lg:order-none">
            <div className="lg:sticky lg:top-6 lg:z-10 lg:self-start">
              <ViewTransition name="opa-postcard" share="morph" default="none">
                <FlippablePostcard catchUp={previewCatchUp} large />
              </ViewTransition>
            </div>
          </aside>
          <div className="min-w-0">{form}</div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Button type="submit" form={formId} className="min-w-0 flex-1">
            {submitLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 px-4"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
        </div>
      </div>

      <PostcardPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        catchUp={previewCatchUp}
      />
    </div>
  );
}
