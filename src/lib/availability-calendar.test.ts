import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dayPartForHour,
  slotsForDayAndPart,
  uniqueParticipantTimezones,
  upcomingWeeks,
  weekOffsetLabel,
  weeksWithAvailability,
} from "./availability-calendar";
import type { MeetingSlot, Participant } from "./types";

function participant(
  partial: Pick<Participant, "id" | "name" | "timezone" | "cityLabel">
): Participant {
  return {
    availabilityText: "",
    rules: [],
    exceptions: [],
    ...partial,
  };
}

function slot(startUtc: string, endUtc: string): MeetingSlot {
  return {
    id: startUtc,
    startUtc,
    endUtc,
    score: 1,
    label: "Option",
    availableCount: 2,
    totalCount: 2,
    unavailableNames: [],
    localTimes: [
      {
        participantId: "a",
        name: "A",
        timezone: "America/Toronto",
        cityLabel: "Toronto",
        timeLabel: "7:00 PM",
        hour: 19,
      },
    ],
  };
}

describe("uniqueParticipantTimezones", () => {
  it("includes every distinct timezone from participants and slots", () => {
    const options = uniqueParticipantTimezones(
      [
        participant({
          id: "1",
          name: "A",
          timezone: "America/Toronto",
          cityLabel: "Toronto",
        }),
        participant({
          id: "2",
          name: "B",
          timezone: "America/Toronto",
          cityLabel: "Toronto",
        }),
        participant({
          id: "3",
          name: "C",
          timezone: "America/Vancouver",
          cityLabel: "Vancouver",
        }),
      ],
      [
        {
          id: "s",
          startUtc: "2026-08-13T23:00:00.000Z",
          endUtc: "2026-08-13T23:30:00.000Z",
          score: 1,
          label: "Option",
          availableCount: 2,
          totalCount: 2,
          unavailableNames: [],
          localTimes: [
            {
              participantId: "4",
              name: "D",
              timezone: "Asia/Ho_Chi_Minh",
              cityLabel: "Hanoi",
              timeLabel: "8:00 AM",
              hour: 8,
            },
          ],
        },
      ]
    );
    assert.deepEqual(
      options.map((o) => o.timezone).sort(),
      ["America/Toronto", "America/Vancouver", "Asia/Ho_Chi_Minh"]
    );
  });
});

describe("upcomingWeeks", () => {
  it("returns this week plus three more", () => {
    const weeks = upcomingWeeks(
      [
        slot("2026-08-13T23:00:00.000Z", "2026-08-13T23:30:00.000Z"),
      ],
      "America/Toronto",
      4
    );
    assert.equal(weeks.length, 4);
    assert.equal(weeks[0]!.days.length, 7);
  });
});

describe("weekOffsetLabel", () => {
  it("labels this week through in N weeks", () => {
    assert.equal(weekOffsetLabel(0), "This week");
    assert.equal(weekOffsetLabel(1), "Next week");
    assert.equal(weekOffsetLabel(2), "In 2 weeks");
    assert.equal(weekOffsetLabel(3), "In 3 weeks");
  });
});

describe("weeksWithAvailability", () => {
  it("builds weeks that contain recommended dates", () => {
    const weeks = weeksWithAvailability(
      [
        slot("2026-08-13T23:00:00.000Z", "2026-08-13T23:30:00.000Z"),
        slot("2026-08-14T23:00:00.000Z", "2026-08-14T23:30:00.000Z"),
      ],
      "America/Toronto"
    );
    assert.ok(weeks.length >= 1);
    assert.ok(weeks[0]!.days.some((d) => d.hasSlots));
    assert.equal(weeks[0]!.days.length, 7);
  });
});

describe("day parts", () => {
  it("maps hours to morning afternoon evening", () => {
    assert.equal(dayPartForHour(9), "morning");
    assert.equal(dayPartForHour(14), "afternoon");
    assert.equal(dayPartForHour(19), "evening");
  });

  it("filters slots for a day and part in the display zone", () => {
    const morning = slot(
      "2026-08-13T15:00:00.000Z",
      "2026-08-13T15:30:00.000Z"
    );
    const evening = slot(
      "2026-08-13T23:00:00.000Z",
      "2026-08-13T23:30:00.000Z"
    );
    const found = slotsForDayAndPart(
      [morning, evening],
      "2026-08-13",
      "evening",
      "America/Toronto"
    );
    assert.equal(found.length, 1);
    assert.equal(found[0]!.id, evening.id);
  });
});
