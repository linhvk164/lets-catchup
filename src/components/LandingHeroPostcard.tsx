"use client";

import { useState, ViewTransition } from "react";
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
    "Maybe this will make it easier to find a time that works. See you soon!",
  duration: 30,
  createdAt: new Date().toISOString(),
  photo: getDefaultPhoto(),
  participants: [
    {
      id: "me",
      name: "Me",
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
  localTimes: [
    {
      participantId: "toronto",
      name: "Toronto",
      timezone: "America/Toronto",
      cityLabel: "Toronto",
      flagEmoji: "🇨🇦",
      timeLabel: "8:00 AM",
      hour: 8,
    },
    {
      participantId: "hcmc",
      name: "Ho Chi Minh City",
      timezone: "Asia/Ho_Chi_Minh",
      cityLabel: "Ho Chi Minh City",
      flagEmoji: "🇻🇳",
      timeLabel: "7:00 PM",
      hour: 19,
    },
    {
      participantId: "melbourne",
      name: "Melbourne",
      timezone: "Australia/Melbourne",
      cityLabel: "Melbourne",
      flagEmoji: "🇦🇺",
      timeLabel: "10:00 PM",
      hour: 22,
    },
  ],
};

/**
 * Landing postcard preview with gentle physical 3D tilt.
 * Click flips the card; the CTA link morphs to create via ViewTransition.
 */
export function LandingHeroPostcard() {
  const [flipped, setFlipped] = useState(false);

  function flip() {
    setFlipped((v) => !v);
  }

  return (
    <ViewTransition name="opa-postcard" share="morph" default="none">
      <div className="postcard-product postcard-product--large landing-postcard">
        <InteractivePostcard restingRotateZ={-4} ambientIdle>
          <div
            className="postcard-stage w-full cursor-pointer"
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
              flipped ? "Flip to front of postcard" : "Flip to back of postcard"
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
          className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink"
          aria-label={
            flipped ? "Flip to front of postcard" : "Flip to back of postcard"
          }
        >
          <span aria-hidden>↻</span>
          {flipped ? "Flip to front" : "Flip to back"}
        </button>
      </div>
    </ViewTransition>
  );
}
