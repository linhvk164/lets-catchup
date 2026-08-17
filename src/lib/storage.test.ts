import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeCatchUp, encodeCatchUp, loadCatchUp, saveCatchUp } from "./storage";
import type { CatchUp } from "./types";
import { catchupInviteTitle, SHARE_OG } from "./og";

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

test("static OG image and personalized invite title", () => {
  assert.equal(SHARE_OG.images[0].url, "/images/og/postcard-invite.jpg");
  assert.equal(SHARE_OG.images[0].width, 1200);
  assert.equal(SHARE_OG.images[0].height, 630);
  assert.equal(catchupInviteTitle("Linh"), "Catchup invite from Linh");
  assert.equal(
    catchupInviteTitle(""),
    "Catchup invite from someone special"
  );
});

test("saveCatchUp prunes other invites when localStorage is full", () => {
  const data = new Map<string, string>();
  let quota = 0;
  const memoryStorage = {
    get length() {
      return data.size;
    },
    key(i: number) {
      return [...data.keys()][i] ?? null;
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key: string, value: string) {
      const next = new Map(data);
      next.set(key, value);
      const used = [...next.values()].reduce((n, v) => n + v.length, 0);
      if (used > quota) {
        throw new DOMException(
          "Setting the value exceeded the quota.",
          "QuotaExceededError"
        );
      }
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
  };

  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: memoryStorage,
  });

  try {
    quota = 50_000;
    saveCatchUp({
      ...sample,
      id: "oldphoto",
      photo: {
        ...sample.photo!,
        dataUrl: `data:image/jpeg;base64,${"A".repeat(20_000)}`,
      },
    });
    assert.ok(loadCatchUp("oldphoto")?.photo?.dataUrl);

    quota = 8_000;
    saveCatchUp({
      ...sample,
      id: "newinvite",
      photo: {
        ...sample.photo!,
        dataUrl: `data:image/jpeg;base64,${"B".repeat(2_000)}`,
      },
    });

    assert.equal(loadCatchUp("oldphoto"), null);
    const saved = loadCatchUp("newinvite");
    assert.ok(saved);
    assert.equal(saved!.id, "newinvite");
    assert.ok(saved!.photo?.dataUrl);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previousWindow,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousStorage,
    });
  }
});
