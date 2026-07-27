import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { productImages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await db.query.productImages.findFirst({
    where: eq(productImages.id, id),
    columns: { data: true, mimeType: true },
  });

  if (!image) {
    return new NextResponse("Image not found", { status: 404 });
  }

  // `bytea` comes back as a Buffer, which may be a view into a shared pool —
  // wrap it in a plain Uint8Array view so it is a valid response body.
  const body = new Uint8Array(
    image.data.buffer as ArrayBuffer,
    image.data.byteOffset,
    image.data.byteLength
  );

  return new NextResponse(body, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
