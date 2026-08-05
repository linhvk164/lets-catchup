"use client";

import { useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { FlippablePostcard } from "@/components/postcard";
import {
  draftToParticipant,
  ParticipantEditorSheet,
  type ParticipantDraft,
} from "@/components/ParticipantForm";
import { TimeSlotCard } from "@/components/TimeSlotCard";
import { AvailabilityTimelineSheet } from "@/components/AvailabilityTimeline";
import { Button } from "@/components/ui";
import { useCatchUp } from "@/hooks/useCatchUp";
import type { MeetingSlot, Participant } from "@/lib/types";

export default function CatchUpInvitationPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const encoded = searchParams.get("p");

  const {
    catchUp,
    loading,
    slots,
    bestSlot,
    selectedSlot,
    moreCount,
    shareUrl,
    addParticipant,
    updateParticipant,
    removeParticipant,
    selectSlot,
  } = useCatchUp(id, encoded);

  const [copied, setCopied] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"add" | "edit" | "join" | null>(null);
  const [editing, setEditing] = useState<Participant | null>(null);
  const recommendationsRef = useRef<HTMLElement>(null);
  const postcardRef = useRef<HTMLDivElement>(null);

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (!shareUrl || !catchUp) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: catchUp.title,
          text: `${catchUp.participants[0]?.name ?? "A friend"} invited you to catch up.`,
          url: shareUrl,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyLink();
  }

  function scrollToRecommendations() {
    recommendationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToPostcard() {
    postcardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSelectSlot(slot: MeetingSlot) {
    selectSlot(slot);
    window.setTimeout(() => scrollToPostcard(), 80);
  }

  function handleSaveDraft(draft: ParticipantDraft) {
    if (editorMode === "edit" && editing) {
      updateParticipant(editing.id, draftToParticipant(draft, { id: editing.id, isCreator: editing.isCreator }));
      return;
    }
    addParticipant(draftToParticipant(draft));
  }

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
            Ask your friend to share the full postcard link.
          </p>
          <Button className="mt-8" onClick={() => router.push("/create")}>
            Create a postcard invite
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-[36rem] flex-1 px-5 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-5 lg:max-w-4xl">
        <div className="animate-fade-rise text-center">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            Your invitation is ready
          </h1>
        </div>

        <div ref={postcardRef} className="mx-auto mt-5 flex max-w-[42rem] scroll-mt-4 justify-center">
          <FlippablePostcard
            catchUp={catchUp}
            bestSlot={bestSlot}
            isConfirmed={Boolean(selectedSlot)}
            moreCount={moreCount}
            initialSide="back"
            large
            onViewMore={scrollToRecommendations}
            onAddParticipant={() => {
              setEditing(null);
              setEditorMode("add");
            }}
            onEditParticipant={(p) => {
              setEditing(p);
              setEditorMode("edit");
            }}
            onViewAvailability={() => setTimelineOpen(true)}
            onCopyLink={copyLink}
            onShare={shareLink}
            onJoin={() => {
              setEditing(null);
              setEditorMode("join");
            }}
            onEdit={() => {
              const p = searchParams.get("p");
              router.push(
                p
                  ? `/catchup/${catchUp.id}/edit?p=${p}`
                  : `/catchup/${catchUp.id}/edit`
              );
            }}
            copied={copied}
          />
        </div>

        <section className="mx-auto mt-6 max-w-[36rem] space-y-3 lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">Who&apos;s joining</p>
            <button
              type="button"
              className="text-sm text-ocean hover:underline"
              onClick={() => {
                setEditing(null);
                setEditorMode("add");
              }}
            >
              + Add
            </button>
          </div>
          <ul className="space-y-2">
            {catchUp.participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-ink/10 bg-white/70 px-3 py-2 text-sm"
              >
                <span>
                  {p.name} · {p.cityLabel}
                </span>
                <button
                  type="button"
                  className="text-ocean hover:underline"
                  onClick={() => {
                    setEditing(p);
                    setEditorMode("edit");
                  }}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section ref={recommendationsRef} className="mt-8 scroll-mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">
                {catchUp.participants.length < 2
                  ? "Waiting for everyone to add their availability."
                  : slots.length === 0
                    ? "Waiting for everyone to add their availability."
                    : "Available times"}
              </h2>
            </div>
          </div>

          {catchUp.participants.length < 2 ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-6 text-center">
              <p className="text-sm text-ink-soft">
                Share this postcard with friends to find a time together.
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-6 text-center">
              <p className="text-sm text-ink-soft">
                We couldn&apos;t find a time that works yet. Try updating availability,
                then check again.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 lg:grid-cols-2">
              {slots.map((slot, index) => (
                <li key={slot.id}>
                  <TimeSlotCard
                    slot={slot}
                    featured={index === 0}
                    selected={selectedSlot?.id === slot.id}
                    onSelect={() => handleSelectSlot(slot)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <AvailabilityTimelineSheet
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        participants={catchUp.participants}
        slots={slots}
        initialSlotId={bestSlot?.id}
        onSelectSlot={handleSelectSlot}
      />

      <ParticipantEditorSheet
        open={editorMode !== null}
        mode={editorMode ?? "join"}
        participant={editing}
        onClose={() => {
          setEditorMode(null);
          setEditing(null);
        }}
        onSave={handleSaveDraft}
        onRemove={
          editing
            ? () => removeParticipant(editing.id)
            : undefined
        }
      />
    </div>
  );
}
