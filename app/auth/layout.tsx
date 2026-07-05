"use client";

import React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mouse tracking for interactive background shapes
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 120 };
  const animatedX = useSpring(mouseX, springConfig);
  const animatedY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    // Normalize coordinates around the center of the screen
    mouseX.set((clientX - window.innerWidth / 2) * 0.04); // Dampen the effect
    mouseY.set((clientY - window.innerHeight / 2) * 0.04);
  };

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex flex-col items-center justify-center font-sans px-4 select-none"
      onMouseMove={handleMouseMove}
    >
      {/* ================= BACKGROUND LAYER ================= */}
      
      {/* 1. Swiss Dot Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(#94a3b8 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0",
        }}
      />

      {/* 2. Slow Drifting SVG Thin Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#0f172a" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 3. Interactive Floating Geometric Elements */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none hidden md:block"
        style={{ x: animatedX, y: animatedY }}
      >
        {/* Top-Left: Solid Rotating Wireframe Square */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-32 h-32 border border-slate-300 dark:border-slate-800 rounded-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* Bottom-Right: Large Minimalist Accent Circle */}
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center">
          <div className="w-40 h-40 border border-dashed border-slate-200 dark:border-slate-800 rounded-full animate-[spin_80s_linear_infinite]" />
        </div>

        {/* Diagonal layout line */}
        <div className="absolute top-1/3 left-[5%] right-[5%] h-[1px] bg-slate-200/40" />
      </motion.div>

      {/* ================= CENTRAL CONTENT CARD ================= */}
      <div className="relative z-10 w-full max-w-md my-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-slate-900 p-2 rounded-lg text-white border border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Shield className="size-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 uppercase">TenantManager</span>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  );
}
