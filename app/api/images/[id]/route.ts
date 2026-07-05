import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await prisma.productImage.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });

  if (!image) {
    return new NextResponse("Image not found", { status: 404 });
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
