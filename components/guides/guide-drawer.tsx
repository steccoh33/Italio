"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { CilsLevel } from "@/lib/types/profile";
import {
  getGuidesForLevel,
  type Guide,
  type GuideLocale,
} from "@/lib/guides/guides-content";
import { Button } from "@/components/ui/button";
import { GuideContent } from "@/components/guides/guide-content";

/**
 * Panel lateral con las guías del nivel objetivo. Se monta al costado del
 * formulario de escribir (no lo desmonta), así el texto no se pierde al
 * abrir o cerrar el panel.
 */
export function GuideDrawer({ targetLevel }: { targetLevel: CilsLevel }) {
  const t = useTranslations("Guides");
  const locale = useLocale() as GuideLocale;
  const guides = getGuidesForLevel(targetLevel);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Guide | null>(null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        {t("viewGuide")}
      </Button>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/20 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col bg-background text-foreground outline-none duration-200 data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[30rem] sm:border-l sm:border-border sm:shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <DialogPrimitive.Title className="font-heading text-lg font-bold tracking-tight text-azul">
              {t("title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={<Button type="button" variant="secondary" size="sm" />}
            >
              <XIcon />
              {t("close")}
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            {guides.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {t("comingSoon")}
              </p>
            ) : selected ? (
              <div className="flex flex-col gap-6">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="self-start text-sm font-medium text-azul hover:underline"
                >
                  {t("backToGuides")}
                </button>
                <div className="flex flex-col gap-2">
                  <span className="w-fit rounded-full bg-azul/10 px-2 py-0.5 text-xs font-medium text-azul">
                    {selected.level}
                  </span>
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-marca">
                    {selected.title[locale]}
                  </h2>
                </div>
                <GuideContent guide={selected} locale={locale} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {t("chooseGuide")}
                </p>
                <ul className="flex flex-col gap-3">
                  {guides.map((guide) => (
                    <li key={guide.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(guide)}
                        className="flex w-full flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-azul"
                      >
                        <span className="font-heading text-base font-bold tracking-tight text-foreground">
                          {guide.title[locale]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {guide.whatIsIt[locale]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
