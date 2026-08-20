import assert from "node:assert/strict";
import { test } from "node:test";
import { uniqueLocalTimesByCity } from "./local-times";
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
