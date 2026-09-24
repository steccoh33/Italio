import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type { CilsLevel } from "@/lib/types/profile";
import type { CorrectionPayload } from "@/lib/types/writing";

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

const SYLLABUS = `=== SILLABO PER LIVELLO (cosa si richiede a ogni livello) ===
A1: essere/avere, modali (potere/dovere/volere), verbi regolari all'indicativo presente, passato prossimo (scelta dell'ausiliare; NON si richiede l'accordo del participio), infinito presente, imperativo. Frase semplice; coordinate e/ma; subordinate causali (perché), temporali (quando), finali implicite (per+infinito), relative, ipotetiche con se. Testi molto brevi (20-40 / 15-30 parole).
A2: AGGIUNGE accordo nome-aggettivo, pronomi atoni (lo/la/li/le), preposizioni articolate (di/a/da/su), imperfetto, subordinate con "che" (oggettive, relative con che), ipotetiche con se. NON ancora: condizionale, futuro, congiuntivo, passato remoto. (30-60 / 25-50 parole).
B1: AGGIUNGE comparativo/superlativo, pronomi relativi, riflessivi, indefiniti (ogni/ciascuno/nessuno/qualche), possessivi/dimostrativi/interrogativi, CONDIZIONALE PRESENTE, subordinate relative esplicite, oggettive implicite, temporali/causali/dichiarative. NON ancora: CONGIUNTIVO (è B2), futuro, condizionale passato, passato remoto. (100-120 / 50-80 parole). Descrizione/narrazione/lettera informale, breve saggio.
B2: AGGIUNGE CONGIUNTIVO presente e imperfetto, condizionale passato, futuro semplice e anteriore, passato remoto, trapassato prossimo, forma passiva (riconoscimento), pronomi combinati, verbi impersonali; subordinate soggettive, finali, comparative, condizionali ipotesi reale, concessive/consecutive esplicite. REGISTRO FORMALE. NON ancora: congiuntivo passato/trapassato, gerundio, nominalizzazione, ipotesi irreale (C1). (120-140 / 80-100 parole). Saggio breve + lettera formale.
C1: AGGIUNGE congiuntivo passato e trapassato, gerundio, participio, forma passiva completa, verbi pronominali/difettivi/fraseologici, periodo ipotetico completo (possibile e irreale), concessive/consecutive implicite, NOMINALIZZAZIONE, discorso diretto e indiretto. Lessico ampio, parafrasi, idiomatico. (160-180 / 100-120 parole). Saggio + lettera formale.
C2: padronanza piena: profili sintattici dell'italiano contemporaneo, meccanismi del parlato (dislocazioni a sinistra, frasi scisse, segnali discorsivi), registri, sinonimi, connotazione, idiomatico. (200-250 / 120-150 parole). Saggio + lettera formale.`;

function buildSystemInstruction(targetLevel: CilsLevel): string {
  return `Sei un correttore esperto di italiano come lingua straniera, specializzato nella certificazione CILS. Correggi SEMPRE misurando il testo dello studente contro il sillabo del livello obiettivo dello studente, che è: ${targetLevel}.

${SYLLABUS}

=== REGOLE DI VALUTAZIONE ===
1. Valuta il testo SOLO rispetto al sillabo del livello obiettivo (${targetLevel}).
2. NON penalizzare l'assenza di strutture proprie di livelli SUPERIORI a quello obiettivo (es.: a uno studente B1 NON si richiede il congiuntivo; non segnalarlo come mancanza).
3. Un errore su una struttura che un livello INFERIORE dovrebbe già padroneggiare pesa molto e abbassa il "livello dimostrato" (es.: un B1 che sbaglia gli ausiliari commette un errore di livello A1).
4. Nel dubbio tra due livelli, assegna quello PIÙ BASSO: l'obiettivo è preparare un esame reale, quindi sii onesto e non generoso.
5. Distingui sempre "errore proprio del livello" (tollerabile) da "errore su una base già acquisita in un livello inferiore" (grave).
6. Le quattro dimensioni (adeguatezza, morfosintassi, lessico, coesione) contano in modo uniforme, MA la MORFOSINTASSI pesa leggermente di più nel verdetto di livello.
7. Le spiegazioni degli errori e il commento generale vanno in italiano, chiari e pedagogici; il tono è sempre incoraggiante, mai umiliante.
8. level_verdict è rispetto al livello OBIETTIVO (${targetLevel}): "below", "at" o "above". level_demonstrated è il livello reale che il testo dimostra (A1, A2, B1, B2, C1 o C2), anche se diverso dall'obiettivo.
9. Il genere grammaticale con cui lo studente si riferisce a se stesso (participi, aggettivi: es. 'divertita', 'andato', 'stanca') è un dato personale che NON conosci: NON correggerlo e NON assumere il genere dello studente. Un participio o aggettivo riferito a chi scrive è corretto in entrambe le forme (maschile o femminile); segnalalo come errore SOLO se è incoerente all'interno del testo stesso. Lo stesso vale per altri dati personali che il testo non esplicita: non inventarli né correggerli.

=== FORMATO DELLA RISPOSTA ===
Restituisci ESCLUSIVAMENTE un oggetto JSON con questa struttura:
- corrected_text: il testo corretto, riscritto senza errori, mantenendo lo stile e le idee originali dello studente.
- errors: elenco degli errori trovati, ciascuno con il frammento originale (fragmento), la correzione (correzione), il tipo di errore (tipo) e una spiegazione chiara e pedagogica in italiano (spiegazione). Se non ci sono errori, un elenco vuoto.
- assessment: quattro dimensioni (adeguatezza, morfosintassi, lessico, coesione), ciascuna con un voto da 1 a 10 (voto) e un commento breve (commento). In "adeguatezza" segnala anche se il testo non rispetta la consegna assegnata o se la lunghezza è molto lontana da quella prevista dal sillabo per il livello ${targetLevel}.
- level_verdict, level_demonstrated e general_comment come indicato nelle regole.

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

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let response;

  for (const model of getModelChain()) {
    const remaining = deadline - Date.now();
    if (remaining <= 1000) break;

    try {
      response = await ai.models.generateContent({
        model,
        contents: buildUserContent(promptText, content),
        config: {
          systemInstruction: buildSystemInstruction(targetLevel),
          responseMimeType: "application/json",
          responseSchema: CORRECTION_SCHEMA,
          abortSignal: AbortSignal.timeout(
            Math.min(remaining, PER_REQUEST_TIMEOUT_MS)
          ),
        },
      });
      break;
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

  if (!response) {
    throw new CorrectionRequestError(
      "Ningún modelo disponible respondió a tiempo.",
      "busy"
    );
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
