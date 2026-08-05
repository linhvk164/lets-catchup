"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

type InteractivePostcardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Resting Z rotation in degrees (e.g. landing page slant). */
  restingRotateZ?: number;
  /** Max tilt from mouse on desktop. */
  maxTiltDesktop?: number;
  /** Max tilt from device orientation on mobile. */
  maxTiltMobile?: number;
  /** Soft idle sway when not interacting. */
  ambientIdle?: boolean;
  /** Shared element name for page transitions. */
  transitionName?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Reusable physical tilt wrapper for postcard UIs.
 * Desktop: cursor-follow tilt. Mobile: device orientation (with iOS permission).
 * Resting Z lives on the root so view transitions can morph it to straight.
 * Respects prefers-reduced-motion.
 */
export function InteractivePostcard({
  children,
  className = "",
  style,
  restingRotateZ = 0,
  maxTiltDesktop = 8,
  maxTiltMobile = 5,
  ambientIdle = false,
  transitionName,
}: InteractivePostcardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [motionReady, setMotionReady] = useState(false);

  const target = useRef({ rx: 0, ry: 0 });
  const current = useRef({ rx: 0, ry: 0 });
  const rafId = useRef(0);
  const active = useRef(false);
  const mode = useRef<"idle" | "pointer" | "orientation">("idle");
  const orientationBound = useRef(false);

  const applyFrame = useCallback(
    (idleSwayZ = 0, idleSwayX = 0) => {
      const root = rootRef.current;
      const frame = frameRef.current;
      const { rx, ry } = current.current;
      const rotZ = restingRotateZ + idleSwayZ;

      // Z on the named root so view transitions morph slant → straight.
      if (root) {
        root.style.transform = `rotateZ(${rotZ.toFixed(2)}deg)`;
      }
      if (frame) {
        frame.style.transform = `rotateX(${(rx + idleSwayX).toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        frame.style.boxShadow = "none";
      }
    },
    [restingRotateZ]
  );

  const tick = useCallback(() => {
    const lerp = 0.12;
    current.current.rx += (target.current.rx - current.current.rx) * lerp;
    current.current.ry += (target.current.ry - current.current.ry) * lerp;

    const t = performance.now() / 1000;
    const idle =
      ambientIdle && !reducedMotion && mode.current === "idle" && !active.current;
    const idleSwayZ = idle ? Math.sin(t * 0.65) * 0.7 : 0;
    const idleSwayX = idle ? Math.sin(t * 0.5 + 0.8) * 0.35 : 0;

    applyFrame(idleSwayZ, idleSwayX);

    const settled =
      Math.abs(target.current.rx - current.current.rx) < 0.02 &&
      Math.abs(target.current.ry - current.current.ry) < 0.02;

    if (!settled || active.current || ambientIdle) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      rafId.current = 0;
      current.current.rx = target.current.rx;
      current.current.ry = target.current.ry;
      applyFrame(0, 0);
    }
  }, [ambientIdle, applyFrame, reducedMotion]);

  const ensureLoop = useCallback(() => {
    if (rafId.current || reducedMotion) return;
    rafId.current = requestAnimationFrame(tick);
  }, [reducedMotion, tick]);

  const setTarget = useCallback(
    (rx: number, ry: number) => {
      target.current.rx = rx;
      target.current.ry = ry;
      ensureLoop();
    },
    [ensureLoop]
  );

  const resetTarget = useCallback(() => {
    active.current = false;
    mode.current = "idle";
    setTarget(0, 0);
  }, [setTarget]);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (reducedMotion || mode.current === "orientation") return;
      if (isCoarsePointer() && event.pointerType === "touch") return;

      const root = rootRef.current;
      if (!root) return;

      const rect = root.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const nx = clamp(px * 2 - 1, -1, 1);
      const ny = clamp(py * 2 - 1, -1, 1);

      active.current = true;
      mode.current = "pointer";
      setTarget(-ny * maxTiltDesktop, nx * maxTiltDesktop);
    },
    [maxTiltDesktop, reducedMotion, setTarget]
  );

  const onPointerLeave = useCallback(() => {
    if (mode.current === "orientation") return;
    resetTarget();
  }, [resetTarget]);

  const onOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      if (reducedMotion) return;
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;

      const ry = clamp(gamma / 32, -1, 1) * maxTiltMobile;
      const rx = clamp((beta - 45) / 32, -1, 1) * maxTiltMobile;

      active.current = true;
      mode.current = "orientation";
      setTarget(-rx, ry);
    },
    [maxTiltMobile, reducedMotion, setTarget]
  );

  const bindOrientation = useCallback(async () => {
    if (reducedMotion || orientationBound.current) return;
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return;
    }

    try {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied" | "default">;
      };
      if (typeof DOE.requestPermission === "function") {
        const permission = await DOE.requestPermission();
        if (permission !== "granted") return;
      }
      window.addEventListener("deviceorientation", onOrientation, true);
      orientationBound.current = true;
      setMotionReady(true);
    } catch {
      // Permission denied or unavailable — keep pointer/static fallback.
    }
  }, [onOrientation, reducedMotion]);

  const onPointerDown = useCallback(() => {
    if (isCoarsePointer()) {
      void bindOrientation();
    }
  }, [bindOrientation]);

  useEffect(() => {
    if (reducedMotion) return;

    if (
      isCoarsePointer() &&
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (
        DeviceOrientationEvent as unknown as { requestPermission?: unknown }
      ).requestPermission !== "function"
    ) {
      void bindOrientation();
    }

    if (ambientIdle) ensureLoop();

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = 0;
      if (orientationBound.current) {
        window.removeEventListener("deviceorientation", onOrientation, true);
        orientationBound.current = false;
      }
    };
  }, [ambientIdle, bindOrientation, ensureLoop, onOrientation, reducedMotion]);

  useEffect(() => {
    applyFrame(0, 0);
  }, [applyFrame]);

  const transitionStyle: CSSProperties = {
    ...style,
    transform: `rotateZ(${restingRotateZ}deg)`,
    ...(transitionName ? { viewTransitionName: transitionName } : {}),
  };

  if (reducedMotion) {
    return (
      <div
        className={`interactive-postcard interactive-postcard--static ${className}`}
        style={transitionStyle}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`interactive-postcard ${className}`}
      style={transitionStyle}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      data-motion-ready={motionReady ? "true" : "false"}
    >
      <div ref={frameRef} className="interactive-postcard__frame">
        {children}
      </div>
    </div>
  );
}
