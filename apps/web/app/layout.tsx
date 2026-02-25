import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: [
    "latin"
  ]
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
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
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body className="antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
