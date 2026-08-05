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
    assert.equal(weekends.start?.hour, 0);
    assert.equal(weekends.end?.hour, 0);
    assert.equal(weekends.label, "Anytime");

    assert.equal(parsed.exceptions.length, 1);
    assert.equal(parsed.exceptions[0]?.type, "unavailable");
    assert.equal(parsed.exceptions[0]?.date, "2026-08-20");

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: After work (5 PM – 11 PM)",
      "Sat–Sun: Anytime",
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
    assert.equal(saturday.start?.hour, 0);
    assert.equal(saturday.end?.hour, 0);

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: 10 AM – 5 PM",
      "Sat: Anytime",
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
      "Not available: August 5",
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
      "Not available: Mon, Thu",
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
      "Not available: Fri",
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
      "Not available: Wed",
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
      "Sat–Sun: Anytime",
      "Not available: August 8",
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
    assert.equal(weekends.start?.hour, 0);
    assert.equal(weekends.end?.hour, 0);
    assert.equal(weekends.label, "Anytime");

    assert.deepEqual(parsed.debugLines, [
      "Mon–Fri: 10 AM – 12 PM, 1 PM – 5 PM",
      "Sat–Sun: Anytime",
      "Not available: Mon–Fri, 12 PM – 1 PM",
    ]);
  });
});
