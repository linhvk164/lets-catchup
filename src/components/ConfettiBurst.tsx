"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

const COLORS = [
  "#2f6f7e",
  "#1f4f5c",
  "#c9a06a",
  "#b85c45",
  "#d48976",
  "#8fb6c9",
  "#c9dde8",
];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  color: string;
  size: number;
  shape: "rect" | "circle" | "strip";
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** One-shot confetti burst for celebrating a finished postcard. */
export function ConfettiBurst({
  active,
  durationMs = 3200,
}: {
  active: boolean;
  durationMs?: number;
}) {
  const [visible, setVisible] = useState(false);
  const pieces = useMemo<Piece[]>(() => {
    if (!active) return [];
    return Array.from({ length: 48 }, (_, id) => {
      const shapeRoll = id % 5;
      return {
        id,
        left: 4 + ((id * 17) % 92),
        delay: (id % 12) * 0.04,
        duration: 1.8 + (id % 7) * 0.18,
        drift: -48 + (id % 9) * 12,
        rotate: 180 + (id % 10) * 72,
        color: COLORS[id % COLORS.length]!,
        size: 6 + (id % 5) * 2,
        shape: shapeRoll < 2 ? "rect" : shapeRoll < 4 ? "strip" : "circle",
      };
    });
  }, [active]);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [active, durationMs]);

  if (!visible || pieces.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              width:
                piece.shape === "strip"
                  ? Math.max(3, piece.size * 0.35)
                  : piece.size,
              height:
                piece.shape === "circle"
                  ? piece.size
                  : piece.shape === "strip"
                    ? piece.size * 1.8
                    : piece.size * 0.7,
              background: piece.color,
              borderRadius: piece.shape === "circle" ? "999px" : "2px",
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-rotate": `${piece.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

const CELEBRATE_KEY_PREFIX = "opa:celebrate:";

export function markPostcardCelebrate(id: string) {
  try {
    sessionStorage.setItem(`${CELEBRATE_KEY_PREFIX}${id}`, "1");
  } catch {
    // ignore private mode / quota
  }
}

export function consumePostcardCelebrate(id: string): boolean {
  try {
    const key = `${CELEBRATE_KEY_PREFIX}${id}`;
    if (sessionStorage.getItem(key) !== "1") return false;
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
