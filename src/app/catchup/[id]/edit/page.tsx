"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { FlippablePostcard } from "@/components/postcard";
import { PostcardPreviewModal } from "@/components/PostcardPreviewModal";
import {
  buildDraftCatchUp,
  usePostcardInviteForm,
} from "@/components/PostcardInviteForm";
import { Button } from "@/components/ui";
import {
  buildSharePath,
  resolveCatchUp,
  saveCatchUp,
} from "@/lib/storage";
import type { CatchUp } from "@/lib/types";

export default function EditPostcardPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const encoded = searchParams.get("p");

  const [catchUp, setCatchUp] = useState<CatchUp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = resolveCatchUp(id, encoded);
    setCatchUp(data);
    setLoading(false);
  }, [id, encoded]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center px-5">
        <p className="text-ink-soft">Opening postcard…</p>
      </div>
    );
  }

  if (!catchUp) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader compact />
        <main className="mx-auto w-full max-w-lg flex-1 px-5 py-16 text-center">
          <h1 className="font-display text-3xl text-ink">Invitation not found</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Open this page from your shared postcard link to edit it.
          </p>
          <Button className="mt-8" onClick={() => router.push("/create")}>
            Create a postcard invite
          </Button>
        </main>
      </div>
    );
  }

  return (
    <EditPostcardForm
      key={catchUp.id}
      initialCatchUp={catchUp}
      onCancel={() => router.push(buildSharePath(catchUp))}
    />
  );
}

function EditPostcardForm({
  initialCatchUp,
  onCancel,
}: {
  initialCatchUp: CatchUp;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);

  const { previewCatchUp, form } = usePostcardInviteForm({
    mode: "edit",
    initialCatchUp,
    submitLabel: "Save postcard invite",
    onCancel,
    onSubmit: (values) => {
      const next = buildDraftCatchUp(values, {
        id: initialCatchUp.id,
        existing: initialCatchUp,
      });
      // Clear confirmed slot if creator details changed enough to invalidate it
      const updated: CatchUp = {
        ...next,
        selectedSlotId: undefined,
      };
      saveCatchUp(updated);
      // Rebuild share URL so ?p= carries the latest postcard fields
      router.push(buildSharePath(updated));
    },
  });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="animate-fade-rise max-w-xl">
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            Edit Postcard Invite
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Update your postcard. Friends will see the changes when you share
            the updated link.
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

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <aside className="hidden lg:block">
            <div className="sticky top-6 z-10 self-start">
              <FlippablePostcard catchUp={previewCatchUp} large />
            </div>
          </aside>
          <div className="min-w-0">{form}</div>
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
