import type { Metadata } from "next";
import { CatchUpInvitationClient } from "./CatchUpInvitationClient";
import {
  buildOgImagePath,
  decodeCatchUp,
  getSharePreviewFields,
} from "@/lib/storage";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string | string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const raw = sp.p;
  const encoded = Array.isArray(raw) ? raw[0] : raw;

  const catchUp = encoded ? decodeCatchUp(encoded) : null;
  if (!catchUp || catchUp.id !== id) {
    return {
      title: "Let's Catchup",
      description: "Open this postcard invite to find a time to catch up.",
    };
  }

  const preview = getSharePreviewFields(catchUp);
  const description = `from ${preview.from} · Find a time to catch up`;
  const ogPath = buildOgImagePath(catchUp);

  return {
    title: preview.title,
    description,
    openGraph: {
      title: preview.title,
      description,
      type: "website",
      images: [
        {
          url: ogPath,
          width: 1200,
          height: 630,
          alt: preview.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: preview.title,
      description,
      images: [ogPath],
    },
  };
}

export default function CatchUpInvitationPage() {
  return <CatchUpInvitationClient />;
}
