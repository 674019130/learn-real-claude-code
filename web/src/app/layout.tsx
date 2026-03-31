import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learn Real Claude Code",
  description: "Source archaeology on a 512K-line agent — how a production AI coding agent actually works",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
