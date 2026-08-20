import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DateTime } from "luxon";
import {
  availabilityTier,
  findMeetingSlots,
  isPerfectOverlap,
} from "./scheduler";
import type { CatchUp, Participant } from "./types";

const NOW = DateTime.fromISO("2026-08-20T15:00:00.000Z", { zone: "utc" });

function participant(
  partial: Partial<Participant> &
    Pick<Participant, "id" | "name" | "timezone" | "cityLabel">
): Participant {
  return {
    availabilityText: "anytime",
    rules: [
      {
        kind: "anytime",
        start: { hour: 6, minute: 0 },
        end: { hour: 0, minute: 0 },
        raw: "anytime",
        label: "Anytime",
      },
    ],
    exceptions: [],
    ...partial,
  };
}

function catchUp(participants: Participant[]): CatchUp {
  return {
    id: "test",
    title: "Test",
    duration: 30,
    createdAt: NOW.toISO()!,
    participants,
  };
}

describe("availabilityTier", () => {
  it("maps ratios onto the product tiers", () => {
    assert.equal(availabilityTier(1), 4);
    assert.equal(availabilityTier(0.9), 3);
    assert.equal(availabilityTier(0.75), 2);
    assert.equal(availabilityTier(0.5), 1);
    assert.equal(availabilityTier(0.49), 0);
  });
});

describe("findMeetingSlots ranked compromises", () => {
  it("recommends a 4/5 overlap when nobody has a perfect time", () => {
    // Four people free evenings in Toronto; Sarah only mornings.
    const people = [
      participant({
        id: "a",
        name: "Alex",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 18, minute: 0 },
            end: { hour: 22, minute: 0 },
            raw: "evenings",
          },
        ],
      }),
      participant({
        id: "b",
        name: "Blake",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 18, minute: 0 },
            end: { hour: 22, minute: 0 },
            raw: "evenings",
          },
        ],
      }),
      participant({
        id: "c",
        name: "Casey",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 18, minute: 0 },
            end: { hour: 22, minute: 0 },
            raw: "evenings",
          },
        ],
      }),
      participant({
        id: "d",
        name: "Dana",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 18, minute: 0 },
            end: { hour: 22, minute: 0 },
            raw: "evenings",
          },
        ],
      }),
      participant({
        id: "sarah",
        name: "Sarah",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 9, minute: 0 },
            end: { hour: 12, minute: 0 },
            raw: "mornings",
          },
        ],
      }),
    ];

    const slots = findMeetingSlots(catchUp(people), {
      now: NOW,
      limit: 5,
      minGapMinutes: 60,
    });

    assert.ok(slots.length > 0);
    const best = slots[0]!;
    assert.equal(best.availableCount, 4);
    assert.equal(best.totalCount, 5);
    assert.equal(isPerfectOverlap(best), false);
    assert.deepEqual(best.unavailableNames, ["Sarah"]);
    assert.equal(best.localTimes.length, 5);
  });

  it("never recommends below 50% availability", () => {
    const people = [
      participant({
        id: "a",
        name: "A",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 9, minute: 0 },
            end: { hour: 11, minute: 0 },
            raw: "morning",
          },
        ],
      }),
      participant({
        id: "b",
        name: "B",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 13, minute: 0 },
            end: { hour: 15, minute: 0 },
            raw: "afternoon",
          },
        ],
      }),
      participant({
        id: "c",
        name: "C",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 17, minute: 0 },
            end: { hour: 19, minute: 0 },
            raw: "evening",
          },
        ],
      }),
    ];

    const slots = findMeetingSlots(catchUp(people), {
      now: NOW,
      limit: 12,
      minGapMinutes: 30,
    });

    assert.equal(slots.length, 0);
  });

  it("rejects candidates that put anyone in avoid hours (midnight–6 AM)", () => {
    // Toronto 8 PM = Vancouver 5 PM = Delhi 5:30 AM on a summer evening.
    // Delhi would be in avoid hours, so this must not be recommended even if
    // four people mark themselves available.
    const people = [
      participant({
        id: "tor",
        name: "Toronto",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
      }),
      participant({
        id: "van",
        name: "Vancouver",
        timezone: "America/Vancouver",
        cityLabel: "Vancouver",
      }),
      participant({
        id: "del",
        name: "Delhi",
        timezone: "Asia/Kolkata",
        cityLabel: "Delhi",
      }),
      participant({
        id: "ny",
        name: "New York",
        timezone: "America/New_York",
        cityLabel: "New York",
      }),
      participant({
        id: "chi",
        name: "Chicago",
        timezone: "America/Chicago",
        cityLabel: "Chicago",
      }),
    ];

    const slots = findMeetingSlots(catchUp(people), {
      now: NOW,
      limit: 20,
      minGapMinutes: 30,
    });

    for (const slot of slots) {
      for (const local of slot.localTimes) {
        assert.ok(
          local.hour >= 6 && local.hour < 24,
          `unexpected avoid-hour recommendation: ${local.cityLabel} ${local.timeLabel}`
        );
      }
    }
  });

  it("prefers fewer people in ideal hours over more people with someone at 3 AM", () => {
    // Five people free all day in Toronto (ideal daytime).
    // Six people free overnight in a way that would force 3 AM for one person
    // is filtered by avoid hours, so the best remaining slot should be the
    // five-person daytime window, not a higher count at extreme hours.
    const fiveIdeal = [
      participant({
        id: "1",
        name: "One",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 10, minute: 0 },
            end: { hour: 16, minute: 0 },
            raw: "day",
          },
        ],
      }),
      participant({
        id: "2",
        name: "Two",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 10, minute: 0 },
            end: { hour: 16, minute: 0 },
            raw: "day",
          },
        ],
      }),
      participant({
        id: "3",
        name: "Three",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 10, minute: 0 },
            end: { hour: 16, minute: 0 },
            raw: "day",
          },
        ],
      }),
      participant({
        id: "4",
        name: "Four",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 10, minute: 0 },
            end: { hour: 16, minute: 0 },
            raw: "day",
          },
        ],
      }),
      participant({
        id: "5",
        name: "Five",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 10, minute: 0 },
            end: { hour: 16, minute: 0 },
            raw: "day",
          },
        ],
      }),
      // Sixth person only free overnight locally (would be 3 AM if forced).
      participant({
        id: "night",
        name: "Night Owl",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 2, minute: 0 },
            end: { hour: 5, minute: 0 },
            raw: "late night",
          },
        ],
      }),
    ];

    const slots = findMeetingSlots(catchUp(fiveIdeal), {
      now: NOW,
      limit: 5,
      minGapMinutes: 60,
    });

    assert.ok(slots.length > 0);
    const best = slots[0]!;
    assert.equal(best.availableCount, 5);
    assert.equal(best.totalCount, 6);
    assert.deepEqual(best.unavailableNames, ["Night Owl"]);
    const hour = best.localTimes[0]!.hour;
    assert.ok(hour >= 8 && hour < 22);
  });

  it("treats anytime as 6 AM–midnight and does not recommend 2–5 AM", () => {
    const people = [
      participant({
        id: "a",
        name: "Alex",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
      }),
      participant({
        id: "b",
        name: "Blake",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
      }),
    ];

    const slots = findMeetingSlots(catchUp(people), {
      now: NOW,
      limit: 30,
      minGapMinutes: 15,
    });

    assert.ok(slots.length > 0);
    for (const slot of slots) {
      for (const local of slot.localTimes) {
        assert.ok(
          local.hour >= 6,
          `anytime must not recommend ${local.timeLabel}`
        );
      }
    }
  });

  it("ranks perfect overlap above partial overlap", () => {
    const people = [
      participant({
        id: "a",
        name: "A",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 14, minute: 0 },
            end: { hour: 18, minute: 0 },
            raw: "afternoon",
          },
        ],
      }),
      participant({
        id: "b",
        name: "B",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        rules: [
          {
            kind: "between_times",
            start: { hour: 14, minute: 0 },
            end: { hour: 20, minute: 0 },
            raw: "afternoon-evening",
          },
        ],
      }),
    ];

    const slots = findMeetingSlots(catchUp(people), {
      now: NOW,
      limit: 5,
      minGapMinutes: 60,
    });

    assert.ok(slots.length > 0);
    assert.equal(isPerfectOverlap(slots[0]!), true);
    assert.equal(slots[0]!.availableCount, 2);
  });
});
