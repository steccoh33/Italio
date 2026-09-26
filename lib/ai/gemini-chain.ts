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

// Respaldo del modelo de producción: solo entra si este devuelve 503 (alta
// demanda) tras agotar sus reintentos.
const PRODUCTION_BACKUP_MODEL = "gemini-3.7-flash";

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
const TOTAL_BUDGET_MS = 50_000;
const PER_REQUEST_TIMEOUT_MS = 30_000;

// Un 503 ("high demand") de Gemini suele ser un pico pasajero: se reintenta
// el mismo modelo unas veces, con una pausa corta, antes de pasar al siguiente
// (en producción: de gemini-3.8-flash a gemini-3.7-flash).
const MAX_ATTEMPTS_PER_MODEL = 3;
const RETRY_DELAY_MS = 2_000;

function getModelChain(): string[] {
  const forced = process.env.GEMINI_MODEL?.trim();
  const active =
    forced || (process.env.NODE_ENV === "production" ? PRODUCTION_MODEL : null);

  // Modelo de producción: con su respaldo para los picos de alta demanda.
  if (active === PRODUCTION_MODEL) {
    return [PRODUCTION_MODEL, PRODUCTION_BACKUP_MODEL];
  }
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
}: {
  contents: ContentListUnion;
  config: GenerateContentConfig;
}): Promise<GenerateContentResponse> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new CorrectionRequestError("GOOGLE_GEMINI_API_KEY no está configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const model of getModelChain()) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
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
        if (status !== 503 || attempt === MAX_ATTEMPTS_PER_MODEL) break;
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new CorrectionRequestError(
    "Ningún modelo disponible respondió a tiempo.",
    "busy"
  );
}
