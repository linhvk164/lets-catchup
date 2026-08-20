"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { FlippablePostcard } from "@/components/postcard";
import {
  draftToParticipant,
  ParticipantEditorSheet,
  type ParticipantDraft,
} from "@/components/ParticipantForm";
import { TimeSlotCard } from "@/components/TimeSlotCard";
import { AvailabilityTimelineSheet } from "@/components/AvailabilityTimeline";
import { Button } from "@/components/ui";
import { createParticipantId, useCatchUp } from "@/hooks/useCatchUp";
import {
  getCatchUpViewer,
  markAsInvitee,
  type CatchUpViewer,
} from "@/lib/storage";
import type { MeetingSlot, Participant } from "@/lib/types";
import {
  ConfettiBurst,
  consumePostcardCelebrate,
} from "@/components/ConfettiBurst";
import { SiteHeader } from "@/components/SiteHeader";
import { Toast } from "@/components/Toast";

export function CatchUpInvitationClient() {
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

  const [viewer, setViewer] = useState<CatchUpViewer | null>(null);
  const [copied, setCopied] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [postcardFlipped, setPostcardFlipped] = useState(false);
  const [editorMode, setEditorMode] = useState<"add" | "edit" | "join" | null>(
    null
  );
  const [editing, setEditing] = useState<Participant | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    title: string;
    message: string;
  } | null>(null);
  const recommendationsRef = useRef<HTMLElement>(null);
  const postcardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catchUp) return;
    const existing = getCatchUpViewer(catchUp.id);
    if (existing) {
      setViewer(existing);
      return;
    }
    // First open of a shared link in this browser → invitee + welcome confetti.
    markAsInvitee(catchUp.id);
    setViewer({ role: "invitee" });
    setCelebrate(true);
  }, [catchUp]);

  useEffect(() => {
    if (!catchUp) return;
    // Creator just finished writing — same confetti as invitees get on first open.
    if (consumePostcardCelebrate(catchUp.id)) {
      setCelebrate(true);
    }
  }, [catchUp]);

  const isCreator = viewer?.role === "creator";
  const myParticipantId = viewer?.participantId;
  const myParticipant =
    myParticipantId && catchUp
      ? (catchUp.participants.find((p) => p.id === myParticipantId) ?? null)
      : null;
  // Invitee has submitted details once we've stored their participant id locally.
  const hasJoinedAsInvitee = Boolean(!isCreator && myParticipantId);

  function openEditParticipant(p: Participant) {
    if (!isCreator && p.id !== myParticipantId) return;
    setEditing(p);
    setEditorMode("edit");
  }

  function openEditMyDetails() {
    if (myParticipant) {
      openEditParticipant(myParticipant);
      return;
    }
    // Joined id is known but not in payload yet — open join to re-enter.
    setEditing(null);
    setEditorMode("join");
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (!shareUrl || !catchUp) return;
    const creator =
      catchUp.participants.find((p) => p.isCreator) ?? catchUp.participants[0];
    const fromName = creator?.name?.trim() || "Someone special";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Catchup invite from ${fromName}`,
          text: `${fromName} sent you a postcard invite.`,
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
    recommendationsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function scrollToPostcard() {
    postcardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSelectSlot(slot: MeetingSlot) {
    selectSlot(slot);
    const first = slot.localTimes[0];
    const local = DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(
      first?.timezone ?? "UTC"
    );
    const dateLabel = local.toFormat("cccc, LLLL d");
    const timeLabel = first?.timeLabel ?? local.toFormat("h:mm a");
    setToast({
      id: Date.now(),
      title: "It's a date!",
      message: `${dateLabel} at ${timeLabel} is on the postcard.`,
    });
    window.setTimeout(() => scrollToPostcard(), 80);
  }

  function goToEditPostcard() {
    if (!catchUp) return;
    router.push(`/catchup/${catchUp.id}/edit`);
  }

  function handleSaveDraft(draft: ParticipantDraft) {
    if (editorMode === "edit" && editing) {
      updateParticipant(
        editing.id,
        draftToParticipant(draft, {
          id: editing.id,
          isCreator: editing.isCreator,
          tagColor: editing.tagColor,
        })
      );
      return;
    }
    const newId = createParticipantId();
    addParticipant(draftToParticipant(draft, { id: newId }));
    if (editorMode === "join" && catchUp) {
      markAsInvitee(catchUp.id, newId);
      setViewer({ role: "invitee", participantId: newId });
      setToast({
        id: Date.now(),
        title: "You're in!",
        message: "Your availability has been added to the invitation.",
      });
    }
  }

  const dismissToast = useCallback(() => setToast(null), []);

  if (loading || (catchUp && !viewer)) {
    return (
      <div className="flex min-h-full items-center justify-center px-5">
        <p className="text-ink-soft">Opening postcard…</p>
      </div>
    );
  }

  if (!catchUp) {
    return (
      <div className="flex min-h-full flex-col">
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
      {celebrate ? <ConfettiBurst active /> : null}
      {toast ? (
        <Toast
          key={toast.id}
          title={toast.title}
          message={toast.message}
          onDismiss={dismissToast}
        />
      ) : null}
      <main className="mx-auto w-full max-w-[36rem] flex-1 px-5 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-5 lg:max-w-4xl">
        <div className="animate-fade-rise text-center">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            {isCreator ? "Ready to share" : "You're invited 💌"}
          </h1>
          {isCreator ? (
            <p className="mt-2 text-sm text-ink-soft">
              Send this postcard to your friends.
            </p>
          ) : null}
          {!isCreator ? (
            <button
              type="button"
              onClick={() => setPostcardFlipped((v) => !v)}
              className="mt-1 text-sm text-ink-soft transition hover:text-ink"
              aria-label="Click on the postcard to flip it"
            >
              click on the postcard to flip it.
            </button>
          ) : null}
        </div>

        <div
          ref={postcardRef}
          className={`mx-auto mt-5 flex max-w-[42rem] scroll-mt-4 justify-center ${
            celebrate ? "postcard-celebrate-enter" : ""
          }`}
        >
          <FlippablePostcard
            catchUp={catchUp}
            bestSlot={bestSlot}
            isConfirmed={Boolean(selectedSlot)}
            moreCount={moreCount}
            autoFlipToBackAfterMs={1000}
            flipped={postcardFlipped}
            onFlipChange={setPostcardFlipped}
            showFlipButton={isCreator}
            large
            onViewMore={scrollToRecommendations}
            onEditParticipant={openEditParticipant}
            canEditParticipant={(p) =>
              isCreator || p.id === myParticipantId
            }
            onViewAvailability={() => setTimelineOpen(true)}
          />
        </div>

        {isCreator ? (
          <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-2.5">
            <Button type="button" className="w-full py-3.5 text-base" onClick={shareLink}>
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
              onClick={goToEditPostcard}
              className="mt-1 py-1 text-center text-sm text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
            >
              Edit postcard
            </button>
          </div>
        ) : (
          <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-center gap-3">
            {!hasJoinedAsInvitee ? (
              <Button
                type="button"
                className="w-full py-3.5 text-base"
                onClick={() => {
                  setEditing(null);
                  setEditorMode("join");
                }}
              >
                Join Invitation
              </Button>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
              <button
                type="button"
                onClick={shareLink}
                className="text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
              >
                Share
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
              >
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
            {hasJoinedAsInvitee ? (
              <button
                type="button"
                onClick={openEditMyDetails}
                className="py-1 text-center text-sm text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
              >
                Edit My Details
              </button>
            ) : null}
          </div>
        )}

        <section ref={recommendationsRef} className="mt-8 scroll-mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <h2 className="font-display text-2xl text-ink">
              {catchUp.participants.length < 2
                ? "Waiting for everyone to add their availability."
                : slots.length === 0
                  ? "No good times found"
                  : "Available times"}
            </h2>
            <button
              type="button"
              className="shrink-0 text-left text-sm font-medium text-ocean underline-offset-2 transition hover:text-ocean-deep hover:underline sm:pb-1 sm:text-right"
              onClick={() => {
                setEditing(null);
                setEditorMode("add");
              }}
            >
              Add friend manually
            </button>
          </div>

          {catchUp.participants.length < 2 ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-6 text-center">
              <p className="text-sm text-ink-soft">
                {isCreator
                  ? "Share this postcard with friends to find a time together."
                  : "Join the invitation to share your availability."}
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-6 text-center">
              <p className="text-sm text-ink-soft">
                We couldn&apos;t find a time that works for most of the group at
                reasonable hours. Try adjusting your availability.
              </p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-ocean underline underline-offset-2 transition hover:text-ocean-deep"
                onClick={() => setTimelineOpen(true)}
              >
                See everyone's schedule
              </button>
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
          editing && isCreator && !editing.isCreator
            ? () => removeParticipant(editing.id)
            : undefined
        }
      />
    </div>
  );
}
