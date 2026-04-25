/**
 * Animated background component
 * Provides subtle gradient animation that adds depth without interfering with foreground text
 */
import { motion } from "motion/react";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.08), transparent)",
        }}
      />
      
      {/* Animated gradient orbs - position shift only */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle 600px at 20% 80%, hsl(var(--primary) / 0.03) 0%, transparent 50%)",
        }}
        animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Second orb - different position */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle 500px at 80% 20%, hsl(var(--accent) / 0.02) 0%, transparent 50%)",
        }}
        animate={{
          x: [0, -15, 0],
          y: [0, 15, 0],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle beam effect - vertical light rays - opacity animation */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.005) 20%, transparent 40%)",
        }}
        animate={{
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles - position animations */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          left: "20%",
          top: "30%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.015) 0%, transparent 70%)",
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 15, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-56 h-56 rounded-full"
        style={{
          left: "50%",
          top: "50%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.01) 0%, transparent 70%)",
        }}
        animate={{
          y: [0, -20, 0],
          x: [0, -10, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Subtle grid pattern for depth - static */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}