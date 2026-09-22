"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center sm:gap-12">
      <div className="absolute top-6 right-6">
        <LocaleSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-10 sm:gap-12"
      >
        <div
          className="relative flex size-28 items-center justify-center rounded-3xl bg-amarillo text-4xl sm:size-32"
          aria-label="Spazio riservato per la mascotte: un pappagallo"
        >
          🦜
          <span className="absolute top-2 right-2 size-3 rounded-full bg-rojo" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1 className="font-heading text-5xl font-bold tracking-tight text-azul sm:text-6xl">
            Italio
          </h1>
          <p className="max-w-xs text-lg text-muted-foreground sm:max-w-sm">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto">
            {t("primaryCta")}
          </Button>
          <Button size="lg" variant="secondary" className="w-full sm:w-auto">
            {t("secondaryCta")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
