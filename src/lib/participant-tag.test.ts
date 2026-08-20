import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contrastingTagTextColor,
  PARTICIPANT_TAG_COLORS,
  resolveParticipantTagColor,
} from "./participant-tag";

test("resolveParticipantTagColor is stable for the same id", () => {
  const a = resolveParticipantTagColor({ id: "abcd1234", name: "Linh" });
  const b = resolveParticipantTagColor({ id: "abcd1234", name: "Linh" });
  assert.equal(a, b);
  assert.ok((PARTICIPANT_TAG_COLORS as readonly string[]).includes(a));
});

test("stored tagColor wins over the seed fallback", () => {
  assert.equal(
    resolveParticipantTagColor({
      id: "abcd1234",
      tagColor: "#F5D244",
    }),
    "#F5D244"
  );
});

test("contrastingTagTextColor picks dark text on light yellow", () => {
  const text = contrastingTagTextColor("#F5D244");
  assert.equal(text, "#1e3340");
});

test("contrastingTagTextColor picks light text on dark green", () => {
  const text = contrastingTagTextColor("#008371");
  assert.equal(text, "#f8f4ec");
});
