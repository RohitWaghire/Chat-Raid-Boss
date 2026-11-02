import type { Metadata } from "next";
import Storyboard from "@/components/Storyboard";

export const metadata: Metadata = {
  title: "Press storyboard",
  description: "Animated 1200×675 storyboard used to record the README GIF.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StoryboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawFrame = firstValue(params.frame);
  const frame = rawFrame !== undefined && /^[0-5]$/.test(rawFrame) ? Number(rawFrame) : null;
  const auto = firstValue(params.auto) !== "0";

  return (
    <div className="grid min-h-dvh place-items-center overflow-auto bg-[#141415]">
      <Storyboard key={`${frame ?? "auto"}-${auto}`} frame={frame} auto={auto} />
    </div>
  );
}
