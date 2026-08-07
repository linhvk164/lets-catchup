import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Postcard",
  description: "Update your postcard invite details and share the same link.",
  robots: { index: false, follow: false },
};

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
