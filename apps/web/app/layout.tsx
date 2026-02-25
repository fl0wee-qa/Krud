import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: [
    "latin"
  ]
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: [
    "latin"
  ],
  weight: [
    "400",
    "500",
    "600"
  ]
});

export const metadata: Metadata = {
  title: "Krud",
  description: "Modern QA test and bug management platform"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${plexMono.variable}`}>
      <body style={{ fontFamily: "var(--font-sora)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
