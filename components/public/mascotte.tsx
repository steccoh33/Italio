import { getTranslations } from "next-intl/server";

/**
 * Espacio de la mascota (lorito geométrico). Hoy es un placeholder:
 * para poner la mascota definitiva basta con reemplazar el contenido de
 * este componente; los lugares donde se usa no cambian.
 *
 * - "hero": recuadro grande de la landing.
 * - "about": recuadro chico de /chi-siamo (por ahora con el monograma).
 */
export async function Mascotte({
  variant = "hero",
}: {
  variant?: "hero" | "about";
}) {
  const t = await getTranslations("PublicShell");

  if (variant === "about") {
    return (
      <div
        role="img"
        aria-label={t("mascotteAboutAlt")}
        className="relative flex size-32 items-center justify-center rounded-[2rem] bg-amarillo sm:size-44"
      >
        <span
          className="font-heading text-6xl font-bold text-tinta sm:text-8xl"
          aria-hidden="true"
        >
          H
        </span>
        <span
          className="absolute top-3 right-3 size-3 rounded-full bg-rojo sm:size-4"
          aria-hidden="true"
        />
        <span
          className="absolute bottom-0 left-0 size-10 rounded-tr-2xl bg-azul-fondo sm:size-14"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={t("mascotteHeroAlt")}
      className="relative flex aspect-square w-full items-center justify-center rounded-[2rem] bg-amarillo"
    >
      <span className="text-8xl sm:text-9xl" aria-hidden="true">
        🦜
      </span>
      <span
        className="absolute top-6 right-6 size-4 rounded-full bg-rojo"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 left-0 size-24 rounded-tr-[2rem] bg-azul-fondo sm:size-28"
        aria-hidden="true"
      />
    </div>
  );
}
