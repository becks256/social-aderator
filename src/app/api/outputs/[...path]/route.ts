// src/app/api/outputs/[...path]/route.ts
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function storageRoot(): string {
  return process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // outputPath stored in manifest is relative to storageRoot (e.g. "outputs/campaignId/...")
  // so we join directly — NOT path.join(storageRoot(), 'outputs', ...segments)
  // which would produce a double "outputs" segment
  const root = path.resolve(storageRoot());
  const filePath = path.resolve(path.join(root, ...segments));
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    return new Response(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
