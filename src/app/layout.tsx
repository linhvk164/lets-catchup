import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "One Postcard Away",
  description:
    "Find a moment to catch up, no matter where you are. Send a thoughtful invitation across distance.",
  openGraph: {
    title: "One Postcard Away",
    description:
      "Help friends across time zones find a time that works, then seal it with a postcard.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c9dde8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
