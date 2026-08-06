import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeCatchUp,
  encodeCatchUp,
  getSharePreviewFields,
} from "./storage";
import type { CatchUp } from "./types";

const sample: CatchUp = {
  id: "abcd1234",
  title: "Let's Catch-up",
  message: "Miss you!",
  messageFont: "schoolbell",
  duration: 30,
  createdAt: "2026-08-05T12:00:00.000Z",
  photo: {
    src: "/images/postcards/spanish-beach.jpg",
    caption: "Spanish Beach",
    credit: "Photography by Connie Kang",
  },
  participants: [
    {
      id: "p1",
      name: "Linh",
      timezone: "America/Toronto",
      cityLabel: "Toronto",
      availabilityText: "Weekends anytime",
      rules: [{ kind: "weekends_anytime", raw: "Weekends anytime" }],
      preferences: [],
      exceptions: [],
      isCreator: true,
    },
  ],
};

test("encodeCatchUp compresses and round-trips", () => {
  const encoded = encodeCatchUp(sample);
  assert.ok(encoded.startsWith("z."), "expected compressed prefix");
  const decoded = decodeCatchUp(encoded);
  assert.ok(decoded);
  assert.equal(decoded!.id, sample.id);
  assert.equal(decoded!.title, sample.title);
  assert.equal(decoded!.participants[0]?.name, "Linh");
  assert.equal(decoded!.photo?.src, sample.photo?.src);
});

test("decodeCatchUp accepts legacy base64url payloads", () => {
  const json = JSON.stringify({
    ...sample,
    participants: sample.participants.map((p) => ({
      ...p,
      preferences: undefined,
    })),
  });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const legacy = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const decoded = decodeCatchUp(legacy);
  assert.ok(decoded);
  assert.equal(decoded!.id, sample.id);
});

test("getSharePreviewFields extracts OG fields", () => {
  const preview = getSharePreviewFields(sample);
  assert.equal(preview.title, "Let's Catch-up");
  assert.equal(preview.from, "Linh");
  assert.equal(preview.photo, "/images/postcards/spanish-beach.jpg");
});
