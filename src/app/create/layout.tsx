import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Postcard",
  description:
    "Compose a digital postcard invite, share one link, and find a time that works across time zones. No account needed.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
