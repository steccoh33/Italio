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

// Modelos gratuitos solo para desarrollo. En producción: gemini-3.8-flash
// con facturación (una sola línea: GEMINI_MODEL o la constante de producción).
const PRODUCTION_MODEL = "gemini-3.8-flash";

// Cadena de respaldo SOLO en desarrollo, de más liviano/con más cupo a más
// pesado. Confirmados como existentes y accesibles con la key de desarrollo.
const DEV_FALLBACK_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
];

// Presupuesto total de espera antes de rendirse y mostrar "mucha demanda".
const TOTAL_BUDGET_MS = 35_000;
const PER_REQUEST_TIMEOUT_MS = 20_000;

function getModelChain(): string[] {
  const forced = process.env.GEMINI_MODEL?.trim();
  if (process.env.NODE_ENV === "production") {
    return [forced || PRODUCTION_MODEL];
  }
  const chain = forced ? [forced, ...DEV_FALLBACK_MODELS] : DEV_FALLBACK_MODELS;
  return [...new Set(chain)];
}

/**
 * Llama a Gemini recorriendo la cadena de modelos (503/429/404/timeout pasan
 * al siguiente) dentro de un presupuesto total de espera. Lo usan el corrector
 * y el tutor de escritura guiada. Solo en el servidor: necesita
 * GOOGLE_GEMINI_API_KEY.
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
    const remaining = deadline - Date.now();
    if (remaining <= 1000) break;

    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: {
          ...config,
          abortSignal: AbortSignal.timeout(
            Math.min(remaining, PER_REQUEST_TIMEOUT_MS)
          ),
        },
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      const name = (err as Error).name;
      const skippable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        name === "TimeoutError" ||
        name === "AbortError";
      console.error(`Gemini ${model} failed:`, status ?? name);
      if (!skippable) {
        throw new CorrectionRequestError((err as Error).message, "other");
      }
    }
  }

  throw new CorrectionRequestError(
    "Ningún modelo disponible respondió a tiempo.",
    "busy"
  );
}
