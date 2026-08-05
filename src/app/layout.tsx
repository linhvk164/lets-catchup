import type { Metadata, Viewport } from "next";
import {
  Birthstone_Bounce,
  Butterfly_Kids,
  Fraunces,
  Outfit,
  Schoolbell,
  Sedgwick_Ave,
  Sue_Ellen_Francisco,
} from "next/font/google";
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

const sueEllenFrancisco = Sue_Ellen_Francisco({
  variable: "--font-sue-ellen-francisco",
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

const butterflyKids = Butterfly_Kids({
  variable: "--font-butterfly-kids",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Let's Catchup",
  description:
    "Send a postcard invite. Find a moment to catch up, no matter where you are.",
  openGraph: {
    title: "Let's Catchup",
    description:
      "Send a postcard invite and find a time that works across time zones.",
    type: "website",
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
  sueEllenFrancisco.variable,
  birthstoneBounce.variable,
  butterflyKids.variable,
].join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
