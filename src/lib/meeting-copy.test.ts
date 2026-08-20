import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAvailableCount,
  formatAvailableCountPrompt,
  formatUnavailableSentence,
} from "./meeting-copy";
import type { MeetingSlot } from "./types";

const baseSlot = {
  id: "x",
  startUtc: "2026-08-07T00:00:00.000Z",
  endUtc: "2026-08-07T00:30:00.000Z",
  score: 1,
  label: "Best",
  localTimes: [],
} satisfies Omit<
  MeetingSlot,
  "availableCount" | "totalCount" | "unavailableNames"
>;

describe("formatUnavailableSentence", () => {
  it("names one person", () => {
    assert.equal(
      formatUnavailableSentence(["Sarah"]),
      "Sarah isn't available at this time."
    );
  });

  it("names two people", () => {
    assert.equal(
      formatUnavailableSentence(["Sarah", "Alex"]),
      "Sarah and Alex aren't available at this time."
    );
  });

  it("lists three or more people", () => {
    assert.equal(
      formatUnavailableSentence(["Sarah", "Alex", "Blake"]),
      "Sarah, Alex, and Blake aren't available at this time."
    );
  });

  it("returns null when nobody is missing", () => {
    assert.equal(formatUnavailableSentence([]), null);
  });
});

describe("formatAvailableCount", () => {
  it("formats N of M", () => {
    assert.equal(
      formatAvailableCount({
        ...baseSlot,
        availableCount: 4,
        totalCount: 5,
        unavailableNames: ["Sarah"],
      }),
      "4 of 5 people available"
    );
  });
});

describe("formatAvailableCountPrompt", () => {
  it("adds the adjust prompt", () => {
    assert.equal(
      formatAvailableCountPrompt({
        ...baseSlot,
        availableCount: 2,
        totalCount: 3,
        unavailableNames: ["Jenny"],
      }),
      "2 of 3 people available. Try adjusting the time!"
    );
  });
});
