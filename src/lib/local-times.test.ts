import assert from "node:assert/strict";
import { test } from "node:test";
import { groupParticipantsByCity, uniqueLocalTimesByCity } from "./local-times";
import type { LocalTimeDisplay } from "./types";

function place(
  cityLabel: string,
  hour: number,
  participantId: string,
  timezone = "America/Toronto"
): LocalTimeDisplay {
  return {
    participantId,
    name: participantId,
    timezone,
    cityLabel,
    timeLabel: `${hour}:00 AM`,
    hour,
  };
}

test("uniqueLocalTimesByCity keeps one row per city", () => {
  const rows = uniqueLocalTimesByCity([
    place("Toronto", 10, "linh"),
    place("Toronto", 10, "sarah"),
    place("Vancouver", 7, "alex", "America/Vancouver"),
  ]);
  assert.deepEqual(
    rows.map((r) => r.cityLabel),
    ["Vancouver", "Toronto"]
  );
});

test("uniqueLocalTimesByCity does not merge different cities in the same timezone", () => {
  const rows = uniqueLocalTimesByCity([
    place("Toronto", 10, "a", "America/Toronto"),
    place("Montreal", 10, "b", "America/Toronto"),
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.cityLabel).sort(),
    ["Montreal", "Toronto"]
  );
});

test("groupParticipantsByCity nests people under one city label", () => {
  const groups = groupParticipantsByCity([
    {
      id: "1",
      name: "Linh",
      timezone: "America/Toronto",
      cityLabel: "Toronto",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "2",
      name: "Sarah",
      timezone: "America/Toronto",
      cityLabel: "Toronto",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
    {
      id: "3",
      name: "Alex",
      timezone: "America/Vancouver",
      cityLabel: "Vancouver",
      availabilityText: "",
      rules: [],
      exceptions: [],
    },
  ]);
  assert.equal(groups.length, 2);
  const toronto = groups.find((g) => g.cityLabel === "Toronto");
  assert.ok(toronto);
  assert.deepEqual(
    toronto!.participants.map((p) => p.name),
    ["Linh", "Sarah"]
  );
});
