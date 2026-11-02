import type { Metadata } from "next";
import { Suspense } from "react";
import CheatSheetOverlay from "@/components/CheatSheetOverlay";

export const metadata: Metadata = {
  title: "Raid Cheat Sheet Overlay",
  description: "Transparent OBS browser source showing the chat-command cheat sheet for the raid boss.",
  robots: { index: false, follow: false },
};

export default function CheatSheetPage() {
  return (
    <Suspense fallback={null}>
      <CheatSheetOverlay />
    </Suspense>
  );
}
