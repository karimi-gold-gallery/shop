import type { Metadata } from "next";

import { FloorGuideViewer } from "@/components/floor-guide-viewer";

export const metadata: Metadata = {
  title: "راهنمای طبقات پاساژ دلگشا",
  description:
    "نقشه و راهنمای طبقات پاساژ دلگشا از طبقه منفی ۶ تا طبقه دوم؛ مناسب بازدید حضوری و اسکن QR.",
  openGraph: {
    title: "راهنمای طبقات پاساژ دلگشا",
    description: "نقشه تعاملی طبقات پاساژ دلگشا با امکان بزرگ‌نمایی.",
  },
};

export default function FloorGuidePage() {
  return <FloorGuideViewer />;
}
