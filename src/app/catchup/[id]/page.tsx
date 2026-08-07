import type { Metadata } from "next";
import { CatchUpInvitationClient } from "./CatchUpInvitationClient";
import { getCatchUp, isCatchUpStoreConfigured } from "@/lib/catchup-store";
import { decodeCatchUp } from "@/lib/storage";
import {
  catchupInviteTitle,
  OG_DESCRIPTION,
  SHARE_OG,
} from "@/lib/og";

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

  let catchUp = encoded ? decodeCatchUp(encoded) : null;
  if ((!catchUp || catchUp.id !== id) && isCatchUpStoreConfigured()) {
    try {
      catchUp = await getCatchUp(id);
    } catch {
      catchUp = null;
    }
  }

  const valid = Boolean(catchUp && catchUp.id === id);
  const creator =
    catchUp?.participants.find((p) => p.isCreator) ?? catchUp?.participants[0];
  const title = valid
    ? catchupInviteTitle(creator?.name)
    : "Let's Catchup";
  const description = valid
    ? OG_DESCRIPTION
    : "Open this postcard invite to find a time to catch up.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [...SHARE_OG.images],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SHARE_OG.images[0].url],
    },
  };
}

export default function CatchUpInvitationPage() {
  return <CatchUpInvitationClient />;
}
