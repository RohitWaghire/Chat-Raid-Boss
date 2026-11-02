import { Suspense } from "react";
import { OverlayClient } from "./OverlayClient";

export const metadata = { title: "Chat Raid Boss overlay" };

export default function OverlayPage() {
  return (
    <Suspense fallback={<div data-testid="overlay" aria-hidden className="hidden" />}>
      <OverlayClient />
    </Suspense>
  );
}
