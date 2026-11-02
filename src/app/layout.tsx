import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "Chat Raid Boss: your Twitch chat vs. an AI boss";
const description =
  "A drop-in OBS overlay where Twitch chat teams up to fight an AI-narrated raid boss live on stream.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title,
  description,
  applicationName: "Chat Raid Boss",
  openGraph: {
    type: "website",
    siteName: "Chat Raid Boss",
    title,
    description: "Your whole chat. One raid boss. " + description,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Your whole chat. One raid boss. " + description,
  },
};

export const viewport: Viewport = {
  themeColor: "#141415",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
