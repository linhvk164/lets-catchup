"use client";

import Link from "next/link";
import { PostcardFrontContent } from "@/components/postcard/PostcardFaces";
import type { CatchUp } from "@/lib/types";

const demoCatchUp: CatchUp = {
  id: "landing",
  title: "Let's Catch up",
  duration: 30,
  createdAt: new Date().toISOString(),
  participants: [
    {
      id: "a",
      name: "You",
      timezone: "America/Toronto",
      cityLabel: "Toronto",
      flagEmoji: "🇨🇦",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "b",
      name: "Friend",
      timezone: "Europe/Berlin",
      cityLabel: "Berlin",
      flagEmoji: "🇩🇪",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
  ],
};

/**
 * Landing postcard preview. Shares view-transition-name with the create page
 * postcard for a smooth handoff when clicking Create a postcard.
 */
export function LandingHeroPostcard() {
  return (
    <Link href="/create" className="mx-auto block w-full max-w-[320px] outline-none">
      <div
        className="postcard-stage animate-float cursor-pointer"
        style={{ viewTransitionName: "opa-postcard" }}
      >
        <div className="postcard-face postcard-face--static rotate-[-1.5deg]">
          <PostcardFrontContent catchUp={demoCatchUp} />
        </div>
      </div>
    </Link>
  );
}
