import type { Metadata, Viewport } from "next";
import {
  Birthstone_Bounce,
  Fraunces,
  Gaegu,
  Gamja_Flower,
  Homemade_Apple,
  Outfit,
  Schoolbell,
  Sedgwick_Ave,
} from "next/font/google";
import { SiteShell } from "@/components/SiteShell";
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

const schoolbell = Schoolbell({
  variable: "--font-schoolbell",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const sedgwickAve = Sedgwick_Ave({
  variable: "--font-sedgwick-ave",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const birthstoneBounce = Birthstone_Bounce({
  variable: "--font-birthstone-bounce",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const gaegu = Gaegu({
  variable: "--font-gaegu",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const gamjaFlower = Gamja_Flower({
  variable: "--font-gamja-flower",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const homemadeApple = Homemade_Apple({
  variable: "--font-homemade-apple",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000")
  ),
  title: "Let's Catchup",
  description:
    "Send a postcard invite. Find a moment to catch up, no matter where you are.",
  openGraph: {
    title: "Let's Catchup",
    description:
      "Send a postcard invite and find a time that works across time zones.",
    type: "website",
    images: [
      {
        url: "/images/og/postcard-invite.jpg",
        width: 1200,
        height: 630,
        alt: "Let's Catch-up",
      },
    ],
  },
  icons: {
    icon: [{ url: "/images/logo/logo-submark.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c9dde8",
};

const fontVariables = [
  fraunces.variable,
  outfit.variable,
  schoolbell.variable,
  sedgwickAve.variable,
  birthstoneBounce.variable,
  gaegu.variable,
  gamjaFlower.variable,
  homemadeApple.variable,
].join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="min-h-full antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
