import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { CILS_LEVEL_INFO } from "@/lib/cils-levels";
import type { CilsLevel } from "@/lib/types/profile";
import type { CorrectionPayload } from "@/lib/types/writing";

// Modelo de desarrollo (gratuito). Para producción, cambiar a gemini-3.8-flash con facturación activada.
const GEMINI_MODEL = "gemini-3.6-flash";
const MAX_BUSY_RETRIES = 3;

const ASSESSMENT_DIMENSION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    voto: {
      type: Type.NUMBER,
      description: "Voto da 1 a 10 per questa dimensione.",
    },
    commento: { type: Type.STRING },
  },
  required: ["voto", "commento"],
};

const CORRECTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    corrected_text: {
      type: Type.STRING,
      description: "Il testo dello studente riscritto senza errori.",
    },
    errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fragmento: {
            type: Type.STRING,
            description: "Il frammento originale con l'errore.",
          },
          correzione: {
            type: Type.STRING,
            description: "Come va corretto quel frammento.",
          },
          tipo: {
            type: Type.STRING,
            description:
              "Categoria dell'errore, ad es. morfosintassi, lessico, ortografia, coesione.",
          },
          spiegazione: {
            type: Type.STRING,
            description:
              "Spiegazione chiara e pedagogica, in italiano, del perché è un errore.",
          },
        },
        required: ["fragmento", "correzione", "tipo", "spiegazione"],
      },
    },
    assessment: {
      type: Type.OBJECT,
      properties: {
        adeguatezza: ASSESSMENT_DIMENSION_SCHEMA,
        morfosintassi: ASSESSMENT_DIMENSION_SCHEMA,
        lessico: ASSESSMENT_DIMENSION_SCHEMA,
        coesione: ASSESSMENT_DIMENSION_SCHEMA,
      },
      required: ["adeguatezza", "morfosintassi", "lessico", "coesione"],
    },
    level_verdict: {
      type: Type.STRING,
      enum: ["below", "at", "above"],
    },
    level_demonstrated: {
      type: Type.STRING,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
    general_comment: {
      type: Type.STRING,
      description:
        "Commento generale sempre incoraggiante, mai umiliante, in italiano.",
    },
  },
  required: [
    "corrected_text",
    "errors",
    "assessment",
    "level_verdict",
    "level_demonstrated",
    "general_comment",
  ],
};

function buildSystemInstruction(targetLevel: CilsLevel): string {
  const info = CILS_LEVEL_INFO[targetLevel];
  const indulgence =
    targetLevel === "A1" || targetLevel === "A2"
      ? "Sii indulgente: a questo livello concentrati solo sugli errori che impediscono la comprensione, senza penalizzare l'uso di strutture semplici."
      : targetLevel === "B1" || targetLevel === "B2"
        ? "Sii equilibrato: segnala sia gli errori di base sia quelli più avanzati, ma valorizza i tentativi di usare strutture più complesse."
        : "Sii rigoroso: a questo livello ci si aspetta precisione, quindi segnala anche errori sottili di stile, registro e coesione.";

  return `Sei un correttore esperto di italiano come lingua straniera, specializzato nella certificazione CILS.

Lo studente ha scelto come livello obiettivo il CILS ${targetLevel}. A questo livello, un testo tipico ha tra ${info.minWords} e ${info.maxWords} parole e usa strutture come: ${info.structures}.

${indulgence}

Analizza il testo dello studente (e, se presente, la consegna assegnata) e restituisci ESCLUSIVAMENTE un oggetto JSON con questa struttura:
- corrected_text: il testo corretto, riscritto senza errori, mantenendo lo stile e le idee originali dello studente.
- errors: un elenco di errori trovati, ciascuno con il frammento originale (fragmento), la correzione (correzione), il tipo di errore (tipo) e una spiegazione chiara e pedagogica in italiano (spiegazione). Se non c'è nessun errore, restituisci un elenco vuoto.
- assessment: una valutazione con quattro dimensioni (adeguatezza, morfosintassi, lessico, coesione), ciascuna con un voto da 1 a 10 (voto) e un commento breve (commento). In "adeguatezza" segnala anche se il testo non rispetta la consegna assegnata o se la lunghezza è molto lontana dal range indicato per il livello ${targetLevel} (${info.minWords}-${info.maxWords} parole).
- level_verdict: "below" se il testo è sotto il livello ${targetLevel}, "at" se è al livello, "above" se lo supera.
- level_demonstrated: il livello CILS (A1, A2, B1, B2, C1 o C2) che il testo dimostra effettivamente.
- general_comment: un commento generale in italiano, sempre incoraggiante e mai umiliante, che riassume i punti principali da migliorare.

Rispondi solo con il JSON richiesto, senza testo aggiuntivo.`;
}

function buildUserContent(promptText: string | null, content: string): string {
  const parts: string[] = [];
  if (promptText) {
    parts.push(`Consigna assegnata: ${promptText}`);
  }
  parts.push(`Testo dello studente:\n${content}`);
  return parts.join("\n\n");
}

export class CorrectionRequestError extends Error {
  constructor(
    message: string,
    readonly kind: "busy" | "other" = "other"
  ) {
    super(message);
  }
}

/**
 * Calls Gemini server-side to correct a student's writing. Never call this
 * from client code — it needs GOOGLE_GEMINI_API_KEY, which must stay
 * server-only.
 */
export async function correctWriting({
  targetLevel,
  promptText,
  content,
}: {
  targetLevel: CilsLevel;
  promptText: string | null;
  content: string;
}): Promise<CorrectionPayload> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new CorrectionRequestError("GOOGLE_GEMINI_API_KEY no está configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildUserContent(promptText, content),
        config: {
          systemInstruction: buildSystemInstruction(targetLevel),
          responseMimeType: "application/json",
          responseSchema: CORRECTION_SCHEMA,
        },
      });
      break;
    } catch (err) {
      const status = (err as { status?: number }).status;
      const busy = status === 503 || status === 429;
      if (status === 503 && attempt < MAX_BUSY_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
        continue;
      }
      console.error("Gemini request failed:", status, (err as Error).message);
      throw new CorrectionRequestError(
        (err as Error).message,
        busy ? "busy" : "other"
      );
    }
  }

  const rawText = response.text;
  if (!rawText) {
    throw new CorrectionRequestError("Gemini no devolvió contenido.");
  }

  return parseCorrectionPayload(rawText);
}

function isAssessmentDimension(value: unknown): value is CorrectionPayload["assessment"]["adeguatezza"] {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).voto === "number" &&
    typeof (value as Record<string, unknown>).commento === "string"
  );
}

/**
 * Defensively parses and validates Gemini's raw JSON text into a
 * CorrectionPayload, throwing CorrectionRequestError on any mismatch. Even
 * with a responseSchema, the model call is an external boundary, so the
 * shape is never trusted blindly before it reaches the database.
 */
export function parseCorrectionPayload(rawText: string): CorrectionPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new CorrectionRequestError("Gemini no devolvió un JSON válido.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new CorrectionRequestError("Gemini no devolvió un objeto JSON.");
  }

  const value = parsed as Record<string, unknown>;

  if (typeof value.corrected_text !== "string") {
    throw new CorrectionRequestError("Falta corrected_text en la respuesta.");
  }

  if (!Array.isArray(value.errors)) {
    throw new CorrectionRequestError("Falta errors en la respuesta.");
  }
  for (const item of value.errors) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).fragmento !== "string" ||
      typeof (item as Record<string, unknown>).correzione !== "string" ||
      typeof (item as Record<string, unknown>).tipo !== "string" ||
      typeof (item as Record<string, unknown>).spiegazione !== "string"
    ) {
      throw new CorrectionRequestError("Un error en errors tiene forma inválida.");
    }
  }

  const assessment = value.assessment;
  if (
    typeof assessment !== "object" ||
    assessment === null ||
    !isAssessmentDimension((assessment as Record<string, unknown>).adeguatezza) ||
    !isAssessmentDimension((assessment as Record<string, unknown>).morfosintassi) ||
    !isAssessmentDimension((assessment as Record<string, unknown>).lessico) ||
    !isAssessmentDimension((assessment as Record<string, unknown>).coesione)
  ) {
    throw new CorrectionRequestError("assessment tiene forma inválida.");
  }

  if (
    value.level_verdict !== "below" &&
    value.level_verdict !== "at" &&
    value.level_verdict !== "above"
  ) {
    throw new CorrectionRequestError("level_verdict inválido.");
  }

  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (
    typeof value.level_demonstrated !== "string" ||
    !validLevels.includes(value.level_demonstrated)
  ) {
    throw new CorrectionRequestError("level_demonstrated inválido.");
  }

  if (typeof value.general_comment !== "string") {
    throw new CorrectionRequestError("Falta general_comment en la respuesta.");
  }

  return {
    corrected_text: value.corrected_text,
    errors: value.errors as CorrectionPayload["errors"],
    assessment: assessment as CorrectionPayload["assessment"],
    level_verdict: value.level_verdict,
    level_demonstrated: value.level_demonstrated as CilsLevel,
    general_comment: value.general_comment,
  };
}
