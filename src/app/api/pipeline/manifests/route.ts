// src/app/api/pipeline/manifests/route.ts
import { listManifests } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const manifests = await listManifests();
  return Response.json(manifests);
}
