import { Suspense } from "react";

export default function CatchUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center px-5">
          <p className="text-ink-soft">Loading…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
