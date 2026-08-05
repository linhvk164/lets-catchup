/** Predetermined postcard map compositions (percent of map canvas). */
export type PostcardMapPoint = { x: number; y: number };

/**
 * Intentionally designed layouts for the postcard travel map.
 * Prefer visual composition over even mathematical spacing.
 */
export const postcardPositions: Record<number, PostcardMapPoint[]> = {
  1: [{ x: 50, y: 48 }],
  2: [
    { x: 18, y: 48 },
    { x: 82, y: 48 },
  ],
  3: [
    { x: 15, y: 58 },
    { x: 50, y: 28 },
    { x: 85, y: 58 },
  ],
  4: [
    { x: 18, y: 32 },
    { x: 82, y: 32 },
    { x: 18, y: 68 },
    { x: 82, y: 68 },
  ],
  5: [
    { x: 14, y: 30 },
    { x: 50, y: 26 },
    { x: 86, y: 30 },
    { x: 28, y: 68 },
    { x: 72, y: 68 },
  ],
  6: [
    { x: 14, y: 28 },
    { x: 50, y: 26 },
    { x: 86, y: 28 },
    { x: 14, y: 68 },
    { x: 50, y: 70 },
    { x: 86, y: 68 },
  ],
};

/** Which dots connect for each layout (indices into postcardPositions[n]). */
export const postcardThreads: Record<number, [number, number][]> = {
  1: [],
  2: [[0, 1]],
  3: [
    [0, 1],
    [1, 2],
  ],
  4: [
    [0, 1],
    [1, 3],
    [3, 2],
    [2, 0],
  ],
  5: [
    [0, 1],
    [1, 2],
    [0, 3],
    [2, 4],
    [3, 4],
  ],
  6: [
    [0, 1],
    [1, 2],
    [3, 4],
    [4, 5],
    [0, 3],
    [2, 5],
  ],
};

export function getPostcardMapLayout(count: number): {
  positions: PostcardMapPoint[];
  threads: [number, number][];
  compact: boolean;
  shownCount: number;
} {
  const shownCount = Math.min(Math.max(count, 1), 6);
  const key = shownCount as keyof typeof postcardPositions;
  return {
    positions: postcardPositions[key],
    threads: postcardThreads[key],
    compact: count > 6 || shownCount >= 5,
    shownCount,
  };
}

/** Cubic Bézier travel-route curve between two percent-based points. */
export function travelCurve(a: PostcardMapPoint, b: PostcardMapPoint): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const lift = Math.max(12, Math.min(28, dist * 0.38));
  const midY = Math.min(a.y, b.y);
  const c1 = {
    x: a.x + dx * 0.28,
    y: midY - lift,
  };
  const c2 = {
    x: a.x + dx * 0.72,
    y: midY - lift * 0.9,
  };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}
