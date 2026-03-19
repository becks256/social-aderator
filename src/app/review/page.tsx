// src/app/review/page.tsx
import { Suspense } from "react";
import { listManifests } from "@/lib/storage";
import ReviewClient from "./ReviewClient";

export default async function ReviewPage() {
  const manifests = await listManifests();
  return (
    <Suspense
      fallback={<div className="p-8 text-gray-400 text-sm">Loading…</div>}
    >
      <ReviewClient initialManifests={manifests} />
    </Suspense>
  );
}
