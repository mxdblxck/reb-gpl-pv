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
      
      {/* Animated gradient orbs - subtle and slow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle 600px at 20% 80%, hsl(var(--primary) / 0.03) 0%, transparent 50%),
            radial-gradient(circle 500px at 80% 20%, hsl(var(--accent) / 0.02) 0%, transparent 50%)
          `,
        }}
        animate={{
          background: [
            `radial-gradient(circle 600px at 20% 80%, hsl(var(--primary) / 0.03) 0%, transparent 50%),
            `radial-gradient(circle 650px at 30% 70%, hsl(var(--primary) / 0.035) 0%, transparent 50%),
            `radial-gradient(circle 600px at 20% 80%, hsl(var(--primary) / 0.03) 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle beam effect - vertical light rays */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            linear-gradient(
              180deg,
              transparent 0%,
              hsl(var(--primary) / 0.005) 20%,
              transparent 40%
            )
          `,
          maskImage: "linear-gradient(180deg, black 30%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, black 30%, transparent 100%)",
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

      {/* Floating particles - very subtle */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 200 + 100,
            height: Math.random() * 200 + 100,
            left: `${20 + i * 30}%`,
            top: `${30 + i * 20}%`,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.015) 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 12 + i * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}

      {/* Subtle grid pattern for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}