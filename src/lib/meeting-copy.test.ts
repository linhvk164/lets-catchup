import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAvailableCountPrompt,
  formatUnavailableClause,
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

describe("formatUnavailableClause", () => {
  it("names one person", () => {
    assert.equal(formatUnavailableClause(["Sarah"]), "Sarah isn't available");
  });

  it("names two people", () => {
    assert.equal(
      formatUnavailableClause(["Sarah", "Alex"]),
      "Sarah and Alex aren't available"
    );
  });

  it("lists three or more people", () => {
    assert.equal(
      formatUnavailableClause(["Sarah", "Alex", "Blake"]),
      "Sarah, Alex, and Blake aren't available"
    );
  });

  it("returns null when nobody is missing", () => {
    assert.equal(formatUnavailableClause([]), null);
  });
});

describe("formatUnavailableSentence", () => {
  it("adds at this time", () => {
    assert.equal(
      formatUnavailableSentence(["Sarah"]),
      "Sarah isn't available at this time."
    );
  });
});

describe("formatAvailableCountPrompt", () => {
  it("names who is missing and prompts to adjust", () => {
    assert.equal(
      formatAvailableCountPrompt({
        ...baseSlot,
        availableCount: 2,
        totalCount: 3,
        unavailableNames: ["Jenny"],
      }),
      "Jenny isn't available at this time. Try adjusting availabilities!"
    );
  });

  it("returns null when everyone is free", () => {
    assert.equal(
      formatAvailableCountPrompt({
        ...baseSlot,
        availableCount: 3,
        totalCount: 3,
        unavailableNames: [],
      }),
      null
    );
  });
});
