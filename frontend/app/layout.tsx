import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DotBall — Pressure, ball by ball",
  description:
    "T20 cricket strategy platform: field placements, matchups, scouting, and live match assistance for players, captains, coaches, and analysts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
