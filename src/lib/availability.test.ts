import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DateTime } from "luxon";
import { parseAvailabilityInput } from "./availability";

describe("parseAvailabilityInput", () => {
  it("keeps weekdays after work and weekends anytime as separate rules", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays after work, weekends anytime, except August 20."
    );

    assert.equal(parsed.rules.length, 2);

    const weekdays = parsed.rules[0];
    assert.deepEqual(weekdays.days, [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
    assert.equal(weekdays.start?.hour, 17);
    assert.equal(weekdays.end?.hour, 23);
    assert.equal(weekdays.label, "After work");

    const weekends = parsed.rules[1];
    assert.deepEqual(weekends.days, ["saturday", "sunday"]);
    assert.equal(weekends.start?.hour, 6);
    assert.equal(weekends.end?.hour, 0);
    assert.equal(weekends.label, "Anytime");

    assert.equal(parsed.exceptions.length, 1);
    assert.equal(parsed.exceptions[0]?.type, "unavailable");
    assert.equal(parsed.exceptions[0]?.date, "2026-08-20");

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: After work (5 PM – 11 PM)",
      "Sat–Sun: Anytime (6 AM – 12 AM)",
      "Not available: August 20",
    ]);
  });

  it("parses weekday range and Saturday anytime separately", () => {
    const parsed = parseAvailabilityInput(
      "Free 10 AM-5 PM weekdays. Free anytime Saturday."
    );

    assert.equal(parsed.rules.length, 2);

    const weekdays = parsed.rules[0];
    assert.deepEqual(weekdays.days, [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
    assert.equal(weekdays.start?.hour, 10);
    assert.equal(weekdays.end?.hour, 17);

    const saturday = parsed.rules[1];
    assert.deepEqual(saturday.days, ["saturday"]);
    assert.equal(saturday.start?.hour, 6);
    assert.equal(saturday.end?.hour, 0);

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: 10 AM – 5 PM",
      "Sat: Anytime (6 AM – 12 AM)",
    ]);
  });

  it("keeps evenings recurring and marks this Wednesday unavailable", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    assert.equal(now.isValid, true);
    const parsed = parseAvailabilityInput(
      "Usually evenings, but not this Wednesday.",
      now
    );

    assert.equal(parsed.rules.length, 1);
    const evenings = parsed.rules[0];
    assert.equal(evenings.kind, "evenings");
    assert.equal(evenings.start?.hour, 17);
    assert.equal(evenings.end?.hour, 23);
    assert.equal(evenings.label, "Evenings");
    assert.equal(evenings.days, undefined);

    assert.equal(parsed.exceptions.length, 1);
    assert.equal(parsed.exceptions[0]?.type, "unavailable");
    assert.equal(parsed.exceptions[0]?.date, "2026-08-05");

    assert.deepEqual(parsed.debugLines, [
      "Every day: Evenings (5 PM – 11 PM)",
      "Not available: This Wednesday",
    ]);
  });

  it("treats except weekdays as removals, not availability", () => {
    const parsed = parseAvailabilityInput(
      "Free most days from 10am to 5pm except Mondays and Thursdays"
    );

    assert.equal(parsed.rules.length, 1);
    const rule = parsed.rules[0];
    assert.deepEqual(rule.days, [
      "tuesday",
      "wednesday",
      "friday",
      "saturday",
      "sunday",
    ]);
    assert.equal(rule.start?.hour, 10);
    assert.equal(rule.end?.hour, 17);
    assert.equal(parsed.exceptions.length, 0);

    assert.deepEqual(parsed.debugLines, [
      "Tue, Wed, Fri–Sun: 10 AM – 5 PM",
      "Not available: Mondays, Thursdays",
    ]);
  });

  it("removes Friday from weekdays after work when excepted", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays after work except Fridays"
    );

    assert.equal(parsed.rules.length, 1);
    assert.deepEqual(parsed.rules[0]?.days, [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
    ]);
    assert.equal(parsed.rules[0]?.label, "After work");
    assert.deepEqual(parsed.debugLines, [
      "Mon–Thu: After work (5 PM – 11 PM)",
      "Not available: Fridays",
    ]);
  });

  it("removes a recurring weekday from evenings", () => {
    const parsed = parseAvailabilityInput(
      "Usually evenings except Wednesday"
    );

    assert.equal(parsed.rules.length, 1);
    const rule = parsed.rules[0];
    assert.equal(rule.kind, "evenings");
    assert.equal(rule.start?.hour, 17);
    assert.equal(rule.end?.hour, 23);
    assert.deepEqual(rule.days, [
      "monday",
      "tuesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]);
    assert.deepEqual(parsed.debugLines, [
      "Mon, Tue, Thu–Sun: Evenings (5 PM – 11 PM)",
      "Not available: Wednesdays",
    ]);
  });

  it("keeps weekend availability and marks this Saturday as a date exception", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    assert.equal(now.isValid, true);
    // Wednesday Aug 5 → this Saturday is Aug 8
    const parsed = parseAvailabilityInput(
      "Available weekends except this Saturday",
      now
    );

    assert.equal(parsed.rules.length, 1);
    assert.deepEqual(parsed.rules[0]?.days, ["saturday", "sunday"]);
    assert.equal(parsed.exceptions.length, 1);
    assert.equal(parsed.exceptions[0]?.type, "unavailable");
    assert.equal(parsed.exceptions[0]?.date, "2026-08-08");

    assert.deepEqual(parsed.debugLines, [
      "Sat–Sun",
      "Not available: This Saturday",
    ]);
  });

  it("lets specific weekdays override a general weekdays after rule", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays after 6 PM. Mondays after 8 PM."
    );

    assert.equal(parsed.rules.length, 2);

    const monday = parsed.rules.find((r) =>
      r.days?.includes("monday") && r.days.length === 1
    );
    assert.ok(monday);
    assert.equal(monday.start?.hour, 20);
    assert.equal(monday.end?.hour, 0);

    const rest = parsed.rules.find((r) => r.days?.includes("tuesday"));
    assert.ok(rest);
    assert.deepEqual(rest.days, ["tuesday", "wednesday", "thursday", "friday"]);
    assert.equal(rest.start?.hour, 18);
    assert.equal(rest.end?.hour, 0);

    assert.deepEqual(parsed.debugLines, [
      "Mon: 8 PM – 12 AM",
      "Tue–Fri: 6 PM – 12 AM",
    ]);
  });

  it("resolves overlapping rules and parses before-time correctly", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays after 6pm. Mondays and thursdays free after 8pm. Weekend free before 11pm."
    );

    assert.equal(parsed.rules.length, 3);

    const monThu = parsed.rules.find(
      (r) =>
        r.days?.includes("monday") &&
        r.days?.includes("thursday") &&
        r.days.length === 2
    );
    assert.ok(monThu);
    assert.equal(monThu.start?.hour, 20);
    assert.equal(monThu.end?.hour, 0);

    const midweek = parsed.rules.find((r) => r.days?.includes("tuesday"));
    assert.ok(midweek);
    assert.deepEqual(midweek.days, ["tuesday", "wednesday", "friday"]);
    assert.equal(midweek.start?.hour, 18);
    assert.equal(midweek.end?.hour, 0);

    const weekend = parsed.rules.find((r) => r.days?.includes("saturday"));
    assert.ok(weekend);
    assert.deepEqual(weekend.days, ["saturday", "sunday"]);
    assert.equal(weekend.start?.hour, 0);
    assert.equal(weekend.end?.hour, 23);
    assert.equal(weekend.label, "Before");

    assert.deepEqual(parsed.debugLines, [
      "Mon, Thu: 8 PM – 12 AM",
      "Tue, Wed, Fri: 6 PM – 12 AM",
      "Sat–Sun: Before 11 PM",
    ]);
  });

  it("does not treat free before a clock time as anytime", () => {
    const parsed = parseAvailabilityInput("Free before 11pm weekdays");

    assert.equal(parsed.rules.length, 1);
    assert.deepEqual(parsed.rules[0]?.days, [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
    assert.equal(parsed.rules[0]?.start?.hour, 0);
    assert.equal(parsed.rules[0]?.end?.hour, 23);
    assert.equal(parsed.rules[0]?.label, "Before");
    assert.deepEqual(parsed.debugLines, ["Mon–Fri: Before 11 PM"]);
  });

  it("treats not-free time ranges as exclusions on the prior day context", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays 10am–5pm. Not free from 12pm to 1pm"
    );

    assert.equal(parsed.rules.length, 2);
    assert.deepEqual(parsed.rules[0]?.days, [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
    assert.equal(parsed.rules[0]?.start?.hour, 10);
    assert.equal(parsed.rules[0]?.end?.hour, 12);
    assert.equal(parsed.rules[1]?.start?.hour, 13);
    assert.equal(parsed.rules[1]?.end?.hour, 17);

    assert.ok(
      parsed.rules.every(
        (r) => !r.days?.includes("saturday") && !r.days?.includes("sunday")
      )
    );

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: 10 AM – 12 PM, 1 PM – 5 PM",
      "Not available: Mon–Fri, 12 PM – 1 PM",
    ]);
  });

  it("treats lunch break as a weekday time exclusion", () => {
    const parsed = parseAvailabilityInput(
      "Free Monday to Friday 9-5. Lunch break 12-1."
    );

    assert.equal(parsed.rules.length, 2);
    assert.equal(parsed.rules[0]?.start?.hour, 9);
    assert.equal(parsed.rules[0]?.end?.hour, 12);
    assert.equal(parsed.rules[1]?.start?.hour, 13);
    assert.equal(parsed.rules[1]?.end?.hour, 17);

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: 9 AM – 12 PM, 1 PM – 5 PM",
      "Not available: Mon–Fri, 12 PM – 1 PM",
    ]);
  });

  it("cuts excepted time ranges out of weekdays after hours", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays after 6 PM except 8-9 PM."
    );

    assert.equal(parsed.rules.length, 2);
    assert.equal(parsed.rules[0]?.start?.hour, 18);
    assert.equal(parsed.rules[0]?.end?.hour, 20);
    assert.equal(parsed.rules[1]?.start?.hour, 21);
    assert.equal(parsed.rules[1]?.end?.hour, 0);

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: 6 PM – 8 PM, 9 PM – 12 AM",
      "Not available: Mon–Fri, 8 PM – 9 PM",
    ]);
  });

  it("applies dayless exceptions only to the previous availability scope", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays 10am–5pm. Not free from 12pm to 1pm. Free anytime on weekends."
    );

    assert.equal(parsed.rules.length, 3);

    const weekdayMorning = parsed.rules.find((r) => r.start?.hour === 10);
    assert.ok(weekdayMorning);
    assert.deepEqual(weekdayMorning.days, [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
    assert.equal(weekdayMorning.end?.hour, 12);

    const weekdayAfternoon = parsed.rules.find((r) => r.start?.hour === 13);
    assert.ok(weekdayAfternoon);
    assert.equal(weekdayAfternoon.end?.hour, 17);

    const weekends = parsed.rules.find((r) =>
      r.days?.includes("saturday")
    );
    assert.ok(weekends);
    assert.deepEqual(weekends.days, ["saturday", "sunday"]);
    assert.equal(weekends.start?.hour, 6);
    assert.equal(weekends.end?.hour, 0);
    assert.equal(weekends.label, "Anytime");

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: 10 AM – 12 PM, 1 PM – 5 PM",
      "Sat–Sun: Anytime (6 AM – 12 AM)",
      "Not available: Mon–Fri, 12 PM – 1 PM",
    ]);
  });

  it("lets later specific days override an earlier weekday range", () => {
    const parsed = parseAvailabilityInput(
      "Weekdays 10am–5pm. Free friday, saturday and thursday. Not free Sunday."
    );

    const weekdayBlock = parsed.rules.find((r) => r.start?.hour === 10);
    assert.ok(weekdayBlock);
    assert.deepEqual(weekdayBlock.days, ["monday", "tuesday", "wednesday"]);
    assert.equal(weekdayBlock.end?.hour, 17);

    const freeDays = parsed.rules.find(
      (r) => !r.start && r.days?.includes("thursday")
    );
    assert.ok(freeDays);
    assert.deepEqual(freeDays.days, ["thursday", "friday", "saturday"]);

    assert.deepEqual(parsed.debugLines, [
      "Mon–Wed: 10 AM – 5 PM",
      "Thu–Sat",
      "Not available: Sundays",
    ]);
  });

  it("lets a later free Friday override weekdays for that day only", () => {
    const parsed = parseAvailabilityInput("Weekdays 10 AM–5 PM. Free Friday.");

    assert.deepEqual(parsed.debugLines, [
      "Mon–Thu: 10 AM – 5 PM",
      "Fri",
    ]);
  });

  it("does not invent times for bare Weekdays or Weekends", () => {
    assert.deepEqual(parseAvailabilityInput("Weekdays").debugLines, [
      "Mon–Fri",
    ]);
    assert.deepEqual(parseAvailabilityInput("Weekends").debugLines, [
      "Sat–Sun",
    ]);
    assert.deepEqual(parseAvailabilityInput("Weekdays").structured.timeRanges, []);
  });

  it("assumes 6 AM–12 AM only when the user says Anytime", () => {
    const anytime = parseAvailabilityInput("Anytime");
    assert.deepEqual(anytime.debugLines, ["Anytime (6 AM – 12 AM)"]);
    assert.equal(anytime.rules[0]?.start?.hour, 6);
    assert.equal(anytime.rules[0]?.end?.hour, 0);

    const weekends = parseAvailabilityInput("Free anytime weekends");
    assert.deepEqual(weekends.debugLines, [
      "Sat–Sun: Anytime (6 AM – 12 AM)",
    ]);
  });

  it("keeps after-work times and recurring Sunday exclusion", () => {
    assert.deepEqual(
      parseAvailabilityInput("Weekdays after work. No Sunday.").debugLines,
      [
        "Mon–Fri: After work (5 PM – 11 PM)",
        "Not available: Sundays",
      ]
    );
  });

  it("treats No Sundays as recurring unavailability", () => {
    const parsed = parseAvailabilityInput("No Sundays.");
    assert.deepEqual(parsed.debugLines, ["Not available: Sundays"]);
  });

  it("treats Not Sunday as recurring unavailability", () => {
    const parsed = parseAvailabilityInput("Not Sunday.");
    assert.deepEqual(parsed.debugLines, ["Not available: Sundays"]);
  });

  it("treats Not this Sunday as a relative date", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const parsed = parseAvailabilityInput("Not this Sunday.", now);
    assert.equal(parsed.exceptions[0]?.date, "2026-08-09");
    assert.deepEqual(parsed.debugLines, ["Not available: This Sunday"]);
  });

  it("treats Not next Sunday as a relative date", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const parsed = parseAvailabilityInput("Not next Sunday.", now);
    assert.equal(parsed.exceptions[0]?.date, "2026-08-16");
    assert.deepEqual(parsed.debugLines, ["Not available: Next Sunday"]);
  });

  it("keeps weekday evenings and No Sunday as recurring", () => {
    const parsed = parseAvailabilityInput("Weekday evenings. No Sunday.");
    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: Evenings (5 PM – 11 PM)",
      "Not available: Sundays",
    ]);
  });

  it("keeps weekday evenings but not Sunday as recurring", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const parsed = parseAvailabilityInput(
      "Weekday evenings but not Sunday.",
      now
    );
    assert.equal(parsed.exceptions.length, 0);
    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: Evenings (5 PM – 11 PM)",
      "Not available: Sundays",
    ]);
  });

  it("marks Busy tomorrow as relative unavailability", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const parsed = parseAvailabilityInput("Busy tomorrow.", now);
    assert.equal(parsed.exceptions[0]?.date, "2026-08-06");
    assert.deepEqual(parsed.debugLines, ["Not available: Tomorrow"]);
  });

  it("marks Free next Wednesday as relative availability", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const parsed = parseAvailabilityInput("Free next Wednesday.", now);
    assert.equal(parsed.exceptions[0]?.date, "2026-08-12");
    assert.equal(parsed.exceptions[0]?.type, "free_all_day");
    assert.deepEqual(parsed.debugLines, ["Available: Next Wednesday"]);
  });

  it("marks Not free next week as relative unavailability", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const parsed = parseAvailabilityInput("Not free next week.", now);
    assert.ok(parsed.exceptions.length >= 7);
    assert.deepEqual(parsed.debugLines, ["Not available: Next week"]);
  });

  it("marks Free this weekend as relative availability", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const parsed = parseAvailabilityInput("Free this weekend.", now);
    assert.equal(parsed.exceptions.length, 2);
    assert.deepEqual(parsed.debugLines, ["Available: This weekend"]);
  });

  it("treats except <day> after <time> as a time-based exception", () => {
    const parsed = parseAvailabilityInput(
      "Free everyday except Wednesdays after 8pm"
    );

    assert.equal(parsed.rules.length, 2);

    const openDays = parsed.rules[0];
    assert.deepEqual(openDays.days, [
      "monday",
      "tuesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]);
    assert.equal(openDays.start?.hour, 6);
    assert.equal(openDays.end?.hour, 0);
    assert.equal(openDays.label, "Anytime");

    // Wednesday keeps the base availability up to 8 PM instead of being dropped.
    const wednesday = parsed.rules[1];
    assert.deepEqual(wednesday.days, ["wednesday"]);
    assert.equal(wednesday.start?.hour, 6);
    assert.equal(wednesday.end?.hour, 20);

    assert.equal(parsed.structured.excludedDays.length, 0);

    assert.deepEqual(parsed.debugLines, [
      "Mon, Tue, Thu–Sun: Anytime (6 AM – 12 AM)",
      "Wed: 6 AM – 8 PM",
      "Not available: Wed, 8 PM – 12 AM",
    ]);
  });

  it("still treats except <day> with no time as a full-day exception", () => {
    const parsed = parseAvailabilityInput("Free everyday except Wednesdays");

    assert.deepEqual(parsed.structured.excludedDays, ["wednesday"]);
    assert.ok(parsed.rules.every((r) => !r.days?.includes("wednesday")));

    assert.deepEqual(parsed.debugLines, [
      "Mon, Tue, Thu–Sun: Anytime (6 AM – 12 AM)",
      "Not available: Wednesdays",
    ]);
  });

  it("treats except <day> before <time> as unavailable only before that time", () => {
    const parsed = parseAvailabilityInput(
      "Free everyday except Wednesdays before 8pm"
    );

    const wednesday = parsed.rules.find((r) => r.days?.includes("wednesday"));
    assert.ok(wednesday);
    assert.deepEqual(wednesday.days, ["wednesday"]);
    assert.equal(wednesday.start?.hour, 20);
    assert.equal(wednesday.end?.hour, 0);
  });

  it("removes only the named range for except <day> from <time> to <time>", () => {
    const parsed = parseAvailabilityInput(
      "Free everyday except Wednesdays from 8pm to 10pm"
    );

    const wednesday = parsed.rules.filter((r) => r.days?.includes("wednesday"));
    assert.equal(wednesday.length, 2);
    assert.equal(wednesday[0]?.start?.hour, 6);
    assert.equal(wednesday[0]?.end?.hour, 20);
    assert.equal(wednesday[1]?.start?.hour, 22);
    assert.equal(wednesday[1]?.end?.hour, 0);
  });

  it("applies part-of-day exceptions without dropping the day", () => {
    assert.deepEqual(
      parseAvailabilityInput("every day except Monday evenings").debugLines,
      [
        "Tue–Sun: Anytime (6 AM – 12 AM)",
        "Mon: 6 AM – 5 PM",
        "Not available: Mon, 5 PM – 12 AM",
      ]
    );

    assert.deepEqual(
      parseAvailabilityInput("every day except Tuesday mornings").debugLines,
      [
        "Mon, Wed–Sun: Anytime (6 AM – 12 AM)",
        "Tue: 12 PM – 12 AM",
        "Not available: Tue, 6 AM – 12 PM",
      ]
    );

    assert.deepEqual(
      parseAvailabilityInput("available anytime except Wednesday night")
        .debugLines,
      [
        "Mon, Tue, Thu–Sun: Anytime (6 AM – 12 AM)",
        "Wed: 6 AM – 8 PM",
        "Not available: Wed, 8 PM – 12 AM",
      ]
    );

    assert.deepEqual(
      parseAvailabilityInput("free all week except Sunday before noon")
        .debugLines,
      [
        "Mon–Sat: Anytime (6 AM – 12 AM)",
        "Sun: 12 PM – 12 AM",
        "Not available: Sun, 12 AM – 12 PM",
      ]
    );
  });

  it("understands weekends as a full-day exception group", () => {
    const parsed = parseAvailabilityInput("Free anytime except weekends");

    assert.deepEqual(parsed.structured.excludedDays, ["saturday", "sunday"]);
    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: Anytime (6 AM – 12 AM)",
      "Not available: Weekends",
    ]);
  });

  it("cuts a timed exception out of a day-only weekday scope", () => {
    const parsed = parseAvailabilityInput(
      "weekdays except Thursday after 6pm"
    );

    const thursday = parsed.rules.find((r) => r.days?.includes("thursday"));
    assert.ok(thursday);
    assert.deepEqual(thursday.days, ["thursday"]);
    assert.equal(thursday.end?.hour, 18);

    assert.ok(
      parsed.rules.every(
        (r) => !r.days?.includes("saturday") && !r.days?.includes("sunday")
      )
    );

    assert.deepEqual(parsed.debugLines, [
      "Mon–Wed, Fri",
      "Thu: 12 AM – 6 PM",
      "Not available: Thu, 6 PM – 12 AM",
    ]);
  });

  it("distinguishes this Sunday from next Sunday after weekdays", () => {
    const now = DateTime.fromObject({ year: 2026, month: 8, day: 5, hour: 12 });
    if (!now.isValid) throw new Error("invalid now");
    const thisSun = parseAvailabilityInput(
      "Weekdays after work. Not this Sunday.",
      now
    );
    assert.deepEqual(thisSun.debugLines, [
      "Mon–Fri: After work (5 PM – 11 PM)",
      "Not available: This Sunday",
    ]);

    const nextSun = parseAvailabilityInput(
      "Weekdays after work. Not next Sunday.",
      now
    );
    assert.deepEqual(nextSun.debugLines, [
      "Mon–Fri: After work (5 PM – 11 PM)",
      "Not available: Next Sunday",
    ]);
  });
});

/**
 * Phrasings that already parse correctly. These guard the clause splitter and
 * day-list handling against regressions from later parser changes.
 */
describe("parseAvailabilityInput characterization", () => {
  const CASES: [string, string[]][] = [
    ["Free friday, saturday and thursday", ["Thu–Sat"]],
    ["Tuesdays and Thursdays after 5pm", ["Tue, Thu: 5 PM – 12 AM"]],
    [
      "Free after 6 on weekdays and anytime weekends",
      ["Mon–Fri: 6 PM – 12 AM", "Sat–Sun: Anytime (6 AM – 12 AM)"],
    ],
    ["Mondays and thursdays free after 8pm", ["Mon, Thu: 8 PM – 12 AM"]],
    [
      "Free Monday to Friday 9-5. Lunch break 12-1.",
      [
        "Mon–Fri: 9 AM – 12 PM, 1 PM – 5 PM",
        "Not available: Mon–Fri, 12 PM – 1 PM",
      ],
    ],
    [
      "Weekdays after work, weekends anytime",
      ["Mon–Fri: After work (5 PM – 11 PM)", "Sat–Sun: Anytime (6 AM – 12 AM)"],
    ],
    [
      "Free most days from 10am to 5pm except Mondays and Thursdays",
      ["Tue, Wed, Fri–Sun: 10 AM – 5 PM", "Not available: Mondays, Thursdays"],
    ],
    [
      "Free 10 AM-5 PM weekdays. Free anytime Saturday.",
      ["Mon–Fri: 10 AM – 5 PM", "Sat: Anytime (6 AM – 12 AM)"],
    ],
    [
      "Any evening except Friday",
      ["Mon–Thu, Sat, Sun: Evenings (5 PM – 11 PM)", "Not available: Fridays"],
    ],
    [
      "Weekdays 9-5 but not Wednesdays",
      ["Mon, Tue, Thu, Fri: 9 AM – 5 PM", "Not available: Wednesdays"],
    ],
    ["Free all day Saturday", ["Sat: Anytime (6 AM – 12 AM)"]],
    ["Any time on the weekend", ["Sat–Sun: Anytime (6 AM – 12 AM)"]],
    ["Weekends only", ["Sat–Sun"]],
    ["Just Sundays", ["Sun"]],
  ];

  for (const [input, expected] of CASES) {
    it(`keeps parsing "${input}"`, () => {
      assert.deepEqual(parseAvailabilityInput(input).debugLines, expected);
    });
  }
});

describe("parseAvailabilityInput negations", () => {
  const CASES: [string, string[]][] = [
    ["Avoid Mondays", ["Not available: Mondays"]],
    ["Skip Mondays", ["Not available: Mondays"]],
    ["Never Fridays", ["Not available: Fridays"]],
    ["Mondays are bad", ["Not available: Mondays"]],
    ["Mondays don't work", ["Not available: Mondays"]],
    [
      "Tuesdays and Wednesdays are booked",
      ["Not available: Tuesdays, Wednesdays"],
    ],
    [
      "Any day besides Monday",
      ["Tue–Sun: Anytime (6 AM – 12 AM)", "Not available: Mondays"],
    ],
  ];

  for (const [input, expected] of CASES) {
    it(`reads "${input}" as unavailability`, () => {
      assert.deepEqual(parseAvailabilityInput(input).debugLines, expected);
    });
  }

  it("implies an open day around a time-only exclusion", () => {
    assert.deepEqual(parseAvailabilityInput("Nothing after 9pm").debugLines, [
      "Every day: 6 AM – 9 PM",
      "Not available: Every day, 9 PM – 12 AM",
    ]);
    assert.deepEqual(parseAvailabilityInput("Nothing before 9am").debugLines, [
      "Every day: 9 AM – 12 AM",
      "Not available: Every day, 12 AM – 9 AM",
    ]);
  });

  it("keeps the base scope when a negative bound follows it", () => {
    assert.deepEqual(
      parseAvailabilityInput("Free weekdays, no later than 8pm").debugLines,
      ["Mon–Fri: 12 AM – 8 PM", "Not available: Mon–Fri, 8 PM – 12 AM"]
    );
  });

  it("still treats a day-only exclusion as a plain removal", () => {
    assert.deepEqual(parseAvailabilityInput("No Sundays.").debugLines, [
      "Not available: Sundays",
    ]);
  });
});

describe("parseAvailabilityInput day ranges", () => {
  const CASES: [string, string[]][] = [
    ["Mon-Wed", ["Mon–Wed"]],
    ["Tuesday through Thursday", ["Tue–Thu"]],
    ["Mon thru Fri", ["Mon–Fri"]],
    ["Sat-Mon", ["Mon, Sat, Sun"]],
    ["MWF", ["Mon, Wed, Fri"]],
    ["TTh", ["Tue, Thu"]],
    ["M/W/F", ["Mon, Wed, Fri"]],
  ];

  for (const [input, expected] of CASES) {
    it(`expands "${input}"`, () => {
      assert.deepEqual(parseAvailabilityInput(input).debugLines, expected);
    });
  }

  it("keeps the middle of a range that carries its own times", () => {
    assert.deepEqual(
      parseAvailabilityInput("Mon-Wed 9-5, Thu-Fri after 6").debugLines,
      ["Mon–Wed: 9 AM – 5 PM", "Thu, Fri: 6 PM – 12 AM"]
    );
  });
});

describe("parseAvailabilityInput one-sided bounds", () => {
  const CASES: [string, string[]][] = [
    ["Free until 5pm", ["Every day: Before 5 PM"]],
    ["Free till 5pm", ["Every day: Before 5 PM"]],
    ["Available til 5", ["Every day: Before 5 PM"]],
    ["Free up until 6pm", ["Every day: Before 6 PM"]],
    ["By 5pm", ["Every day: Before 5 PM"]],
    ["As late as 11pm", ["Every day: Before 11 PM"]],
    ["From 9 onwards", ["Every day: 9 AM – 12 AM"]],
    ["Starting at 9am", ["Every day: 9 AM – 12 AM"]],
    ["As early as 7am", ["Every day: 7 AM – 12 AM"]],
    ["Free weekdays until 5pm", ["Mon–Fri: Before 5 PM"]],
  ];

  for (const [input, expected] of CASES) {
    it(`bounds "${input}"`, () => {
      assert.deepEqual(parseAvailabilityInput(input).debugLines, expected);
    });
  }
});

describe("parseAvailabilityInput vague phrasing", () => {
  const ANYTIME = ["Anytime (6 AM – 12 AM)"];
  const CASES: [string, string[]][] = [
    ["Up to you", ANYTIME],
    ["You pick", ANYTIME],
    ["Your call", ANYTIME],
    ["Whatever works", ANYTIME],
    ["Whenever works", ANYTIME],
    ["No preference", ANYTIME],
    ["Doesn't matter", ANYTIME],
    ["I'm easy", ANYTIME],
    ["Wide open", ANYTIME],
    ["Any day works", ANYTIME],
    ["Most days", ["Every day: 8 AM – 10 PM"]],
  ];

  for (const [input, expected] of CASES) {
    it(`treats "${input}" as flexible`, () => {
      assert.deepEqual(parseAvailabilityInput(input).debugLines, expected);
    });
  }

  it("keeps a named part of the day alongside flexible wording", () => {
    assert.deepEqual(
      parseAvailabilityInput("I'm usually free evenings but not Mondays")
        .debugLines,
      ["Tue–Sun: Evenings (5 PM – 11 PM)", "Not available: Mondays"]
    );
  });
});

describe("parseAvailabilityInput parts of day", () => {
  const CASES: [string, string[]][] = [
    ["Early mornings", ["Every day: 6 AM – 9 AM"]],
    ["Late mornings", ["Every day: 10 AM – 12 PM"]],
    ["First thing in the morning", ["Every day: 6 AM – 9 AM"]],
    ["Midday", ["Every day: 11 AM – 2 PM"]],
    ["Free at lunchtime", ["Every day: 12 PM – 1 PM"]],
    ["Late afternoons", ["Every day: 3 PM – 6 PM"]],
    ["Early evenings", ["Every day: 5 PM – 7 PM"]],
    ["Nights", ["Every day: 8 PM – 12 AM"]],
    ["Weeknights", ["Mon–Fri: Evenings (5 PM – 11 PM)"]],
    ["Free after school", ["Mon–Fri: 3 PM – 6 PM"]],
    ["Free after dinner", ["Every day: 7 PM – 11 PM"]],
    ["Before bed", ["Every day: 8 PM – 11 PM"]],
    ["Daytime only", ["Every day: 9 AM – 5 PM"]],
  ];

  for (const [input, expected] of CASES) {
    it(`reads "${input}"`, () => {
      assert.deepEqual(parseAvailabilityInput(input).debugLines, expected);
    });
  }

  it("cuts a part-of-day exception out of the base day", () => {
    assert.deepEqual(
      parseAvailabilityInput("Free every day except Wednesday late afternoon")
        .debugLines,
      [
        "Mon, Tue, Thu–Sun: Anytime (6 AM – 12 AM)",
        "Wed: 6 AM – 3 PM, 6 PM – 12 AM",
        "Not available: Wed, 3 PM – 6 PM",
      ]
    );
  });
});

describe("parseAvailabilityInput clock formats", () => {
  const CASES: [string, string[]][] = [
    ["Free 0900-1700", ["Every day: 9 AM – 5 PM"]],
    ["Free 9h-17h", ["Every day: 9 AM – 5 PM"]],
    ["Weekdays 1730-2100", ["Mon–Fri: 5:30 PM – 9 PM"]],
    ["Around 8pm", ["Every day: 7 PM – 9 PM"]],
    ["About 3pm", ["Every day: 2 PM – 4 PM"]],
    ["Free 6-9", ["Every day: 6 PM – 9 PM"]],
  ];

  for (const [input, expected] of CASES) {
    it(`reads "${input}"`, () => {
      assert.deepEqual(parseAvailabilityInput(input).debugLines, expected);
    });
  }
});

describe("parseAvailabilityInput multiple windows", () => {
  it("keeps both ranges joined by and", () => {
    assert.deepEqual(parseAvailabilityInput("Free 9-12 and 2-5").debugLines, [
      "Every day: 9 AM – 12 PM, 2 PM – 5 PM",
    ]);
  });

  it("keeps both ranges joined by a comma", () => {
    assert.deepEqual(parseAvailabilityInput("Free 9-12, 2-5").debugLines, [
      "Every day: 9 AM – 12 PM, 2 PM – 5 PM",
    ]);
  });

  it("keeps both ranges scoped to the named days", () => {
    assert.deepEqual(
      parseAvailabilityInput("Free weekdays 9-12 and 2-5").debugLines,
      ["Mon–Fri: 9 AM – 12 PM, 2 PM – 5 PM"]
    );
  });

  it("does not split a range written as between x and y", () => {
    assert.deepEqual(parseAvailabilityInput("Free between 9 and 5").debugLines, [
      "Every day: 9 AM – 5 PM",
    ]);
  });

  it("splits when both sides name their own day and time", () => {
    assert.deepEqual(
      parseAvailabilityInput("Saturday afternoon or Sunday morning").debugLines,
      ["Sat: 12 PM – 5 PM", "Sun: 6 AM – 12 PM"]
    );
    assert.deepEqual(
      parseAvailabilityInput("Weekday evenings and weekend mornings")
        .debugLines,
      ["Mon–Fri: Evenings (5 PM – 11 PM)", "Sat–Sun: 6 AM – 12 PM"]
    );
  });

  it("keeps weekday times with the weekdays when a weekend follows", () => {
    assert.deepEqual(
      parseAvailabilityInput(
        "I'm free weekday evenings after 7 and most of the weekend"
      ).debugLines,
      ["Mon–Fri: 7 PM – 12 AM", "Sat–Sun"]
    );
  });
});

describe("parseAvailabilityInput confidence", () => {
  it("flags input it could not read", () => {
    const parsed = parseAvailabilityInput("asdfgh qwerty");
    assert.equal(parsed.understood, false);
    // Scheduling still needs something to work with.
    assert.ok(parsed.rules.length > 0);
  });

  it("does not flag input it could read", () => {
    assert.equal(parseAvailabilityInput("Free weekdays").understood, true);
    assert.equal(parseAvailabilityInput("No Sundays.").understood, true);
    assert.equal(parseAvailabilityInput("Nothing after 9pm").understood, true);
  });
});
