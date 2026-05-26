"use client";

import { IPL_BRANDS } from "../lib/types";

export default function TeamCrest({
  teamId,
  size = 56,
  ring = true,
}: {
  teamId: string;
  size?: number;
  ring?: boolean;
}) {
  const brand = IPL_BRANDS[teamId];
  if (!brand) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-ink-800 text-ink-300"
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: brand.primary,
        color: brand.secondary,
        boxShadow: ring
          ? `0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px ${brand.primary}33`
          : undefined,
      }}
    >
      <span
        className="font-medium tracking-tight"
        style={{ fontSize: size * 0.32 }}
      >
        {brand.short}
      </span>
    </div>
  );
}
