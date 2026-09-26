import {
  GoogleGenAI,
  type ContentListUnion,
  type GenerateContentConfig,
  type GenerateContentResponse,
} from "@google/genai";

export class CorrectionRequestError extends Error {
  constructor(
    message: string,
    readonly kind: "busy" | "other" = "other"
  ) {
    super(message);
  }
}

// Modelo de producción (con facturación). Se fija en dos lugares: la variable
// GEMINI_MODEL de .env.local / del hosting, o esta constante como valor por
// defecto en producción. Sin GEMINI_MODEL en desarrollo se usa la cadena
// gratuita de abajo.
const PRODUCTION_MODEL = "gemini-3.8-flash";

// Cadena de producción. Se exprime primero el mejor modelo (3.8) y, cuando su
// cupo se satura, se cae al de MAYOR disponibilidad (3.5-flash-lite, para que
// casi nunca falle todo), luego a los de calidad y, como último recurso, 3.6.
// Cada modelo cede al siguiente si falla (503/429/404/timeout) tras sus
// reintentos; solo si los cuatro fallan se muestra "mucha demanda".
const PRODUCTION_CHAIN = [
  PRODUCTION_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

// Cadena de respaldo SOLO en desarrollo y sin GEMINI_MODEL, de más liviano/con
// más cupo a más pesado. Confirmados como existentes y accesibles con la key
// de desarrollo.
const DEV_FALLBACK_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
];

// Presupuesto total de espera antes de rendirse y mostrar "mucha demanda".
// Cada llamada tiene su propio límite, y el total alcanza para recorrer la
// cadena aun si algún modelo se cuelga. Ojo: en el hosting, la función del
// servidor debe permitir al menos ese tiempo (maxDuration).
const TOTAL_BUDGET_MS = 75_000;
const PER_REQUEST_TIMEOUT_MS = 25_000;

// Un 503 ("high demand") de Gemini suele ser un pico pasajero: se reintenta
// el mismo modelo UNA vez, con una pausa corta, y si sigue saturado se salta
// al siguiente modelo. Pocos reintentos a propósito. El tutor de escritura
// guiada hace varias llamadas por sesión y pide solo 1 intento por modelo
// (attemptsPerModel) para saltar de modelo más rápido.
const DEFAULT_ATTEMPTS_PER_MODEL = 2;
const RETRY_DELAY_MS = 1_000;

function getModelChain(): string[] {
  const forced = process.env.GEMINI_MODEL?.trim();
  const active =
    forced || (process.env.NODE_ENV === "production" ? PRODUCTION_MODEL : null);

  // Modelo de producción: con su cadena de respaldo para los picos de alta
  // demanda.
  if (active === PRODUCTION_MODEL) return PRODUCTION_CHAIN;
  // Cualquier otro GEMINI_MODEL definido a mano: ese modelo y solo ese, sin
  // respaldo, para que un error de cuota/facturación se vea y no lo tape otro.
  if (active) return [active];
  // Desarrollo sin GEMINI_MODEL: cadena gratuita.
  return DEV_FALLBACK_MODELS;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Llama a Gemini recorriendo la cadena de modelos (503/429/404/timeout pasan
 * al siguiente; el 503 se reintenta antes con el mismo modelo) dentro de un
 * presupuesto total de espera. Lo usan el corrector, el tutor de escritura
 * guiada y los ejercicios. Solo en el servidor: necesita GOOGLE_GEMINI_API_KEY.
 */
export async function generateWithFallback({
  contents,
  config,
  attemptsPerModel = DEFAULT_ATTEMPTS_PER_MODEL,
}: {
  contents: ContentListUnion;
  config: GenerateContentConfig;
  /** Intentos por modelo ante un 503 antes de pasar al siguiente. */
  attemptsPerModel?: number;
}): Promise<GenerateContentResponse> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new CorrectionRequestError("GOOGLE_GEMINI_API_KEY no está configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const model of getModelChain()) {
    for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 1000) break;

      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            ...config,
            abortSignal: AbortSignal.timeout(
              Math.min(remaining, PER_REQUEST_TIMEOUT_MS)
            ),
          },
        });
        if (process.env.NODE_ENV !== "production") {
          console.info(`Gemini respondió: ${response.modelVersion ?? model}`);
        }
        return response;
      } catch (err) {
        const status = (err as { status?: number }).status;
        const name = (err as Error).name;
        const skippable =
          status === 503 ||
          status === 429 ||
          status === 404 ||
          name === "TimeoutError" ||
          name === "AbortError";
        console.error(`Gemini ${model} failed (intento ${attempt}):`, status ?? name);
        if (!skippable) {
          throw new CorrectionRequestError((err as Error).message, "other");
        }
        // Solo el 503 (pico de demanda) merece reintento con el mismo modelo.
        if (status !== 503 || attempt === attemptsPerModel) break;
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new CorrectionRequestError(
    "Ningún modelo disponible respondió a tiempo.",
    "busy"
  );
}
