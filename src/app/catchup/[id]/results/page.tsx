"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

/** Recommendations live on the main postcard invitation page. */
export default function ResultsRedirectPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const p = searchParams.get("p");
    const qs = p ? `?p=${encodeURIComponent(p)}` : "";
    router.replace(`/catchup/${params.id}${qs}`);
  }, [params.id, router, searchParams]);

  return (
    <div className="flex min-h-full items-center justify-center px-5">
      <p className="text-ink-soft">Opening postcard…</p>
    </div>
  );
}
