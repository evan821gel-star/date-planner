import type { Metadata } from "next";
import { JetBrains_Mono, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const zenMaru = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ふたりの行きたい場所",
  description: "行きたい場所と一日のプランをふたりで共有するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${zenMaru.variable} ${jetBrainsMono.variable} antialiased font-[var(--font-zen-maru)] text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
