/**
 * Animated background component
 * Provides subtle gradient animation that adds depth without interfering with foreground text
 */
import { motion } from "motion/react";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - more visible */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 100%, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
      />
      
      {/* Animated primary orb - larger and more visible */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle 800px at 0% 100%, hsl(var(--primary) / 0.12) 0%, transparent 60%)",
        }}
        animate={{
          x: [0, 40, 0],
          y: [0, -20, 0],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary accent orb - more visible */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle 600px at 100% 80%, hsl(var(--accent) / 0.08) 0%, transparent 50%)",
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, 25, 0],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Third warm orb */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle 500px at 80% 100%, hsl(0, 0%, 100%, 0.05) 0%, transparent 50%)",
        }}
        animate={{
          x: [0, -20, 0],
          y: [0, -15, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Beam light effect - more visible */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.03) 15%, hsl(var(--primary) / 0.05) 30%, transparent 60%)",
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Larger floating orbs - more prominent */}
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          left: "10%",
          top: "40%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
        }}
        animate={{
          y: [0, -40, 0],
          x: [0, 25, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          left: "60%",
          top: "60%",
          background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 70%)",
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, -20, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          left: "35%",
          top: "75%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)",
        }}
        animate={{
          y: [0, -25, 0],
          x: [0, -15, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Subtle mesh overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}