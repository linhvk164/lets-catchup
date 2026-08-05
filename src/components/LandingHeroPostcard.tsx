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
    "It's been way too long. Let's find a time to catch up, see you soon ✨",
  duration: 30,
  createdAt: new Date().toISOString(),
  photo: getDefaultPhoto(),
  participants: [
    {
      id: "crew",
      name: "The Central Perk Crew",
      timezone: "America/New_York",
      cityLabel: "New York",
      flagEmoji: "🇺🇸",
      availabilityText: "",
      rules: [],
      exceptions: [],
      isCreator: true,
    },
    {
      id: "rachel",
      name: "Rachel",
      timezone: "America/New_York",
      cityLabel: "New York",
      flagEmoji: "🇺🇸",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "ross",
      name: "Ross",
      timezone: "America/New_York",
      cityLabel: "New York",
      flagEmoji: "🇺🇸",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "monica",
      name: "Monica",
      timezone: "America/New_York",
      cityLabel: "New York",
      flagEmoji: "🇺🇸",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "chandler",
      name: "Chandler",
      timezone: "Europe/London",
      cityLabel: "London",
      flagEmoji: "🇬🇧",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "joey",
      name: "Joey",
      timezone: "America/Los_Angeles",
      cityLabel: "Los Angeles",
      flagEmoji: "🇺🇸",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "phoebe",
      name: "Phoebe",
      timezone: "America/Los_Angeles",
      cityLabel: "Los Angeles",
      flagEmoji: "🇺🇸",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
  ],
};

/** Saturday, August 8, 2026 · 10:00 AM New York (= 14:00 UTC). */
const demoSlot: MeetingSlot = {
  id: "landing-demo-slot",
  startUtc: "2026-08-08T14:00:00.000Z",
  endUtc: "2026-08-08T14:30:00.000Z",
  score: 1,
  label: "Saturday morning",
  localTimes: [
    {
      participantId: "rachel",
      name: "Rachel",
      timezone: "America/New_York",
      cityLabel: "New York",
      flagEmoji: "🇺🇸",
      timeLabel: "10:00 AM",
      hour: 10,
    },
    {
      participantId: "chandler",
      name: "Chandler",
      timezone: "Europe/London",
      cityLabel: "London",
      flagEmoji: "🇬🇧",
      timeLabel: "3:00 PM",
      hour: 15,
    },
    {
      participantId: "joey",
      name: "Joey",
      timezone: "America/Los_Angeles",
      cityLabel: "Los Angeles",
      flagEmoji: "🇺🇸",
      timeLabel: "7:00 AM",
      hour: 7,
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
