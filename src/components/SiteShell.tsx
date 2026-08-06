"use client";

import { SiteFooter } from "@/components/SiteFooter";

/** App shell: page content and footer (footer hidden on create/edit). */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative z-20 flex min-h-0 flex-1 flex-col">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
