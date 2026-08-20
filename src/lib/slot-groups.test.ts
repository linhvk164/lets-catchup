import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupSlotsByWeekday, timeLabelForSlot } from "./slot-groups";
import type { MeetingSlot } from "./types";

function slot(
  startUtc: string,
  timeLabel: string,
  timezone = "America/Toronto"
): MeetingSlot {
  return {
    id: startUtc,
    startUtc,
    endUtc: startUtc,
    score: 1,
    label: "Option",
    availableCount: 2,
    totalCount: 2,
    unavailableNames: [],
    localTimes: [
      {
        participantId: "a",
        name: "A",
        timezone,
        cityLabel: "Toronto",
        timeLabel,
        hour: 0,
      },
    ],
  };
}

describe("groupSlotsByWeekday", () => {
  it("groups by weekday then date then keeps times per date", () => {
    const slots = [
      slot("2026-08-12T23:00:00.000Z", "7:00 PM"), // Wed Aug 12 evening ET
      slot("2026-08-13T00:00:00.000Z", "8:00 PM"), // Wed Aug 12 8pm ET
      slot("2026-08-15T22:00:00.000Z", "6:00 PM"), // Sat Aug 15
      slot("2026-08-14T23:00:00.000Z", "7:00 PM"), // Fri Aug 14
    ];

    const groups = groupSlotsByWeekday(slots);
    assert.equal(groups.length, 3);
    assert.equal(groups[0]!.weekdayLabel, "Wednesday");
    assert.equal(groups[0]!.dates.length, 1);
    assert.equal(groups[0]!.dates[0]!.dateLabel, "Aug 12");
    assert.equal(groups[0]!.dates[0]!.slots.length, 2);
    assert.equal(groups[1]!.weekdayLabel, "Friday");
    assert.equal(groups[2]!.weekdayLabel, "Saturday");
  });

  it("keeps separate dates under the same weekday", () => {
    const slots = [
      slot("2026-08-13T23:00:00.000Z", "7:00 PM"), // Thu Aug 13
      slot("2026-08-20T23:00:00.000Z", "7:00 PM"), // Thu Aug 20
    ];
    const groups = groupSlotsByWeekday(slots);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.weekdayLabel, "Thursday");
    assert.deepEqual(
      groups[0]!.dates.map((d) => d.dateLabel),
      ["Aug 13", "Aug 20"]
    );
  });
});

describe("timeLabelForSlot", () => {
  it("prefers the first local time label", () => {
    assert.equal(
      timeLabelForSlot(slot("2026-08-12T23:00:00.000Z", "7:00 PM")),
      "7:00 PM"
    );
  });
});
