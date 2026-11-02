import type { Metadata } from "next";
import { Suspense } from "react";
import AttractMode from "@/components/AttractMode";

export const metadata: Metadata = {
  title: "Attract mode · Chat Raid Boss",
  description: "Self-running demo loop for recording the Chat Raid Boss video.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AttractPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#141415]" aria-hidden="true" />}>
      <AttractMode />
    </Suspense>
  );
}
