import Image from "next/image";

/**
 * La mascota de Italio: un carpincho. Está aislada en este componente: para
 * cambiarla basta con tocar este archivo; los lugares donde se usa (landing
 * y /chi-siamo) no cambian.
 *
 * Siempre mira hacia el texto que la acompaña:
 * - "hero": grande, a la DERECHA del texto de la landing → mira a la izquierda.
 * - "about": chico, a la IZQUIERDA del título de /chi-siamo → mira a la derecha.
 *
 * Las imágenes (900x997) se dimensionan solo por ancho; el alto sale de su
 * proporción, así nunca se deforman.
 */
export function Mascotte({
  variant = "hero",
}: {
  variant?: "hero" | "about";
}) {
  const isHero = variant === "hero";

  return (
    <Image
      src={
        isHero
          ? "/carpincho_mascota_izquierda.png"
          : "/carpincho_mascota_derecha.png"
      }
      alt="Italio - la mascota carpincho"
      width={900}
      height={997}
      priority
      sizes={isHero ? "(min-width: 1024px) 384px, 70vw" : "(min-width: 640px) 176px, 144px"}
      className={
        isHero
          ? "mx-auto h-auto w-[70%] max-w-sm select-none sm:w-3/5 lg:w-full"
          : "h-auto w-36 shrink-0 select-none sm:w-44"
      }
    />
  );
}
