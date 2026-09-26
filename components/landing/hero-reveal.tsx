"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** El único momento de animación de la landing: el bloque principal entra suave al cargar. */
export function HeroReveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      data-reveal
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
