import assert from "node:assert/strict";
import { test } from "node:test";
import {
  messageFontSizePx,
  messageFontSizeScale,
  MESSAGE_FONTS,
} from "./message-fonts";

test("each message font has a sizeScale relative to Schoolbell", () => {
  assert.equal(messageFontSizeScale("schoolbell"), 1);
  for (const font of MESSAGE_FONTS) {
    assert.ok(font.sizeScale > 0.5 && font.sizeScale < 1.4);
  }
})

test("messageFontSizePx applies the font scale to the base size", () => {
  assert.equal(messageFontSizePx(32, "schoolbell"), 32);
  assert.equal(messageFontSizePx(32, "birthstone-bounce"), 23.7);
  assert.ok(
    Math.abs(messageFontSizePx(17, "gamja-flower") - 17 * 1.15) < 0.15
  );
  assert.ok(messageFontSizePx(32, "sedgwick-ave") < 32);
  assert.ok(messageFontSizePx(32, "homemade-apple") < 32);
});
