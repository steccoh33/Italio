import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  LEGAL_LAST_UPDATED,
  type LegalDocument,
} from "@/lib/legal/legal-content";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function LegalPage({ doc }: { doc: LegalDocument }) {
  const t = await getTranslations("Legal");

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-heading text-2xl font-bold tracking-tight text-azul"
        >
          Italio
        </Link>
        <LocaleSwitcher />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-6 pb-16 sm:pt-10">
        <Link href="/" className="text-sm font-medium text-azul hover:underline">
          ← {t("back")}
        </Link>

        <p className="mt-4 rounded-xl border border-amarillo/40 bg-amarillo/10 px-3 py-2 text-xs text-foreground">
          {t("spanishNotice")}
        </p>

        {/* Los documentos legales están siempre en español. */}
        <article lang="es" className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight text-azul sm:text-4xl">
              {doc.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Última actualización: {LEGAL_LAST_UPDATED}
            </p>
          </div>

          <ol className="flex flex-col gap-5">
            {doc.sections.map((section) => (
              <li key={section.number} className="flex flex-col gap-2 text-base leading-relaxed text-foreground">
                <p>
                  <span className="font-heading font-bold text-azul">
                    {section.number}.
                  </span>{" "}
                  <span className="font-bold">{section.title}</span>
                  {section.body ? ` ${section.body}` : null}
                </p>
                {section.items && (
                  <ul className="flex flex-col gap-2 border-l-2 border-amarillo pl-4">
                    {section.items.map((item) => (
                      <li key={item.number}>
                        <span className="font-bold">{item.number}.</span>{" "}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          {doc.closing && (
            <p className="rounded-2xl bg-secondary px-5 py-4 text-base leading-relaxed text-foreground">
              <span className="font-bold">{doc.closing.title}</span>{" "}
              {doc.closing.body}
            </p>
          )}
        </article>
      </main>
    </div>
  );
}
