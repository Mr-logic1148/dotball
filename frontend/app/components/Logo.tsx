"use client";

import { motion } from "framer-motion";

export default function Logo({ size = 56 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="flex items-center gap-3"
    >
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: "radial-gradient(circle at 30% 30%, #FF6B4E, #B82F1A)",
          boxShadow:
            "inset -4px -4px 8px rgba(0,0,0,0.4), 0 6px 20px rgba(255, 77, 46, 0.3)",
        }}
      >
        <div
          className="absolute"
          style={{
            top: "30%",
            left: "10%",
            right: "10%",
            height: "2px",
            background: "rgba(255,255,255,0.25)",
            borderRadius: "999px",
            transform: "rotate(-25deg)",
          }}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className="font-medium tracking-tight text-ink-50"
          style={{ fontSize: size * 0.5 }}
        >
          DotBall
        </span>
      </div>
    </motion.div>
  );
}
