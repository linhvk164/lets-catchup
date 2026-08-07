"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * Fades/rises elements in when they enter the viewport.
 * Used for landing-page load-in (including below the fold).
 */
export function LandingReveal({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
  once = true,
}: {
  children: ReactNode;
  className?: string;
  /** Extra delay after the element becomes visible. */
  delayMs?: number;
  as?: ElementType;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        if (once) observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const Comp = Tag as ElementType;

  return (
    <Comp
      ref={ref as never}
      className={`landing-reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </Comp>
  );
}
