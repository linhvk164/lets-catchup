import { SiteFooter } from "@/components/SiteFooter";

/** App shell: page content plus site footer (hidden on create/edit flows). */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
