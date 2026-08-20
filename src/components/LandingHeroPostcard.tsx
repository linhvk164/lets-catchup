"use client";

import { useEffect, useState, ViewTransition } from "react";
import { InteractivePostcard } from "@/components/postcard/InteractivePostcard";
import {
  PostcardBackContent,
  PostcardFrontContent,
} from "@/components/postcard/PostcardFaces";
import { getDefaultPhoto } from "@/lib/photos";
import type { CatchUp, MeetingSlot } from "@/lib/types";

const demoCatchUp: CatchUp = {
  id: "landing",
  title: "Let's Catch-up ᯓ 💌",
  message:
    "This might make it easier to find a time that works! See you soon~",
  duration: 30,
  createdAt: new Date().toISOString(),
  photo: getDefaultPhoto(),
  participants: [
    {
      id: "me",
      name: "me",
      timezone: "America/Toronto",
      cityLabel: "Toronto",
      flagEmoji: "🇨🇦",
      availabilityText: "",
      rules: [],
      exceptions: [],
      isCreator: true,
    },
    {
      id: "you",
      name: "the people i love",
      timezone: "Australia/Melbourne",
      cityLabel: "Melbourne",
      flagEmoji: "🇦🇺",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
  ],
};

/**
 * Saturday, August 8, 2026 · 12:00 UTC
 * Toronto 8 AM · Ho Chi Minh City 7 PM · Melbourne 10 PM
 */
const demoSlot: MeetingSlot = {
  id: "landing-demo-slot",
  startUtc: "2026-08-08T12:00:00.000Z",
  endUtc: "2026-08-08T12:30:00.000Z",
  score: 1,
  label: "Saturday morning",
  availableCount: 2,
  totalCount: 2,
  unavailableNames: [],
  localTimes: [
    {
      participantId: "me",
      name: "me",
      timezone: "America/Toronto",
      cityLabel: "Toronto",
      flagEmoji: "🇨🇦",
      timeLabel: "8:00 AM",
      hour: 8,
      available: true,
    },
    {
      participantId: "you",
      name: "the people i love",
      timezone: "Australia/Melbourne",
      cityLabel: "Melbourne",
      flagEmoji: "🇦🇺",
      timeLabel: "10:00 PM",
      hour: 22,
      available: true,
    },
  ],
};

/**
 * Landing postcard preview with gentle physical 3D tilt.
 * Click flips the card; the CTA link morphs to create via ViewTransition.
 */
export function LandingHeroPostcard() {
  const [flipped, setFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function flip() {
    setFlipped((v) => !v);
  }

  return (
    <ViewTransition name="opa-postcard" share="morph" default="none">
      <div className="postcard-product postcard-product--large landing-postcard overflow-visible">
        <InteractivePostcard
          restingRotateZ={isMobile ? -1.5 : -4}
          maxTiltMobile={2}
          ambientIdle
        >
          <div
            className="postcard-stage cursor-pointer"
            onClick={flip}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                flip();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={
              flipped
                ? "Flip to front of postcard"
                : "Flip to back of postcard"
            }
          >
            <div className={`postcard-flipper ${flipped ? "is-flipped" : ""}`}>
              <div className="postcard-face postcard-face--front">
                <PostcardFrontContent catchUp={demoCatchUp} />
              </div>
              <div className="postcard-face postcard-face--back">
                <PostcardBackContent
                  catchUp={demoCatchUp}
                  bestSlot={demoSlot}
                  isConfirmed
                />
              </div>
            </div>
          </div>
        </InteractivePostcard>

        <button
          type="button"
          onClick={flip}
          className="landing-enter landing-enter--flip mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink sm:mt-4"
          aria-label="Click or tap to flip postcard"
        >
          <span aria-hidden>↻</span>
          click/tap to flip
        </button>
      </div>
    </ViewTransition>
  );
}
