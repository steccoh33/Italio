import { Type, type Schema } from "@google/genai";
import { CorrectionRequestError, generateWithFallback } from "@/lib/ai/gemini-chain";
import { getSyllabusUpTo } from "@/lib/ai/syllabus";
import { getGuidesForLevel } from "@/lib/guides/guides-content";
import type { CilsLevel } from "@/lib/types/profile";

export type TutorMessage = { role: "tutor" | "student"; text: string };

export type TutorTurn = {
  message: string;
  phase: "planning" | "ready_to_write";
  /** Solo en el primer turno: la consigna propuesta. */
  consigna: string | null;
  /** true si el último mensaje del alumno fue un intento real de respuesta (cuenta para avanzar). */
  answered: boolean;
};

export const MAX_HISTORY_MESSAGES = 30;
export const MAX_MESSAGE_CHARS = 1500;
/** Tope de mensajes del alumno por encima del mínimo de planificación, para no dar vueltas sin fin. */
const EXTRA_STUDENT_MESSAGES_CAP = 4;

const TUTOR_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description:
        "Il messaggio del tutor allo studente, in italiano, semplice e calibrato sul livello.",
    },
    phase: {
      type: Type.STRING,
      enum: ["planning", "ready_to_write"],
      description:
        "planning finché si sta ancora pianificando; ready_to_write quando il piano è completo e lo studente può scrivere il testo.",
    },
    consigna: {
      type: Type.STRING,
      description:
        "SOLO nel primo turno: la consegna proposta (tipo di testo + tema + lunghezza), in italiano semplice. Vuota negli altri turni.",
    },
    answered: {
      type: Type.BOOLEAN,
      description:
        "true se l'ULTIMO messaggio dello studente era un vero tentativo di rispondere alla domanda; false se non capisce, chiede aiuto o che scriva il tutor, risponde in un'altra lingua o va fuori tema. Nel primo turno (nessun messaggio dello studente) metti false.",
    },
  },
  required: ["message", "phase", "answered"],
};

/** Cuántas respuestas del alumno dura la planificación antes de pasar a escribir. */
export function getMaxPlanningAnswers(level: CilsLevel): number {
  return level === "A1" || level === "A2" ? 3 : 4;
}

function levelStyle(level: CilsLevel): string {
  if (level === "A1") {
    return "ITALIANO MOLTO SEMPLICE: frasi cortissime (5-8 parole), parole comuni e concrete, un solo concetto per frase, presente indicativo. Nessuna subordinata complessa. Se lo studente non capisce, riformula in italiano ancora più facile (mai in un'altra lingua).";
  }
  if (level === "A2") {
    return "ITALIANO SEMPLICE: frasi corte, lessico quotidiano, tempi semplici. Se lo studente non capisce, riformula in italiano più facile (mai in un'altra lingua).";
  }
  if (level === "B1") {
    return "ITALIANO CHIARO E NATURALE, con frasi di media lunghezza e lessico comune. Se lo studente non capisce, riformula più semplicemente in italiano.";
  }
  return "ITALIANO RICCO E NATURALE, adatto al livello, con lessico più vario e sfumato.";
}

function buildTutorInstruction({
  level,
  consigna,
  validAnswers,
  isFirstTurn,
  forceClose,
}: {
  level: CilsLevel;
  consigna: string | null;
  /** Respuestas válidas ya registradas ANTES del último mensaje del alumno. */
  validAnswers: number;
  isFirstTurn: boolean;
  forceClose: boolean;
}): string {
  const max = getMaxPlanningAnswers(level);
  const guides = getGuidesForLevel(level)
    .map((guide) => `- ${guide.title.it}: ${guide.whatIsIt.it}`)
    .join("\n");

  const closing = `CONCLUDI la pianificazione: di' in una riga che il piano è pronto e invitalo a scrivere il testo completo usando il suo piano. NON fare NESSUNA altra domanda in questo messaggio (le domande sono finite) e NON scrivere tu il testo. phase = "ready_to_write". Il campo "consigna" resta vuoto.`;

  let stateInstruction: string;
  if (isFirstTurn) {
    stateInstruction = `È l'INIZIO della pianificazione: lo studente ha già ACCETTATO la consegna (è indicata sopra). In questo turno NON proporre una nuova consegna: nel campo "message" saluta brevemente, richiama la consegna in poche parole e fai la PRIMA domanda di pianificazione (come iniziare il testo: saluto/apertura). phase = "planning", answered = false. Il campo "consigna" resta vuoto.`;
  } else if (forceClose) {
    stateInstruction = `La conversazione è già stata lunga. Valida brevemente l'ultimo messaggio dello studente (con un indizio se serve) e poi ${closing} answered = false.`;
  } else {
    stateInstruction = `Risposte valide già registrate prima dell'ultimo messaggio: ${validAnswers} su ${max} previste. Valuta l'ULTIMO messaggio dello studente:
(A) Se è un vero TENTATIVO di rispondere alla domanda: answered = true. Se ${validAnswers} + 1 raggiunge ${max}, valida brevemente (con un indizio se serve) e poi ${closing} Altrimenti valida la risposta (è adatta alla consegna? è chiara?), dai UN indizio grammaticale o strutturale utile senza dargli la frase, e fai UNA sola domanda successiva di pianificazione (nell'ordine: apertura → cosa raccontare e in che ordine → un dettaglio o due → chiusura). phase = "planning".
(B) Se NON è un tentativo (non capisce, chiede aiuto o che scriva tu, risponde in un'altra lingua, va fuori tema): answered = false, phase = "planning". Non avanzare: ripeti la STESSA domanda in modo più semplice, incoraggialo, senza esempi di risposta.
Il campo "consigna" resta sempre vuoto.`;
  }

  return `Sei "il tutor di scrittura guidata": aiuti uno studente di italiano come lingua straniera, con livello obiettivo CILS ${level}, a PIANIFICARE e poi SCRIVERE un testo, passo dopo passo.

=== REGOLA CENTRALE (la più importante) ===
Tu GUIDI ma NON scrivi MAI il testo al posto dello studente. Non dare frasi già fatte da copiare, né esempi della frase che lo studente deve scrivere, né il testo completo o parti di esso. Puoi fare SOLO: domande, conferme/validazione e indizi grammaticali o strutturali (es. "ricordati di usare il passato prossimo", "quale ausiliare serve con 'andare'?"). Se lo studente ti chiede di scrivere tu ("scrivilo tu", "dammi la frase", "non so come dirlo"), incoraggialo a provare da solo e dagli soltanto un indizio, senza risolvere.
Se nella risposta dello studente c'è un errore, NON scrivere la forma corretta e NON riscrivere la sua frase: indica solo il PUNTO da rivedere, sotto forma di domanda o richiamo (es. "guarda il verbo 'volere': come si dice con 'io'?", "quale ausiliare serve con 'andare'?"). Mai dare la parola o la forma giusta.
Quando devi riformulare perché lo studente non capisce, semplifica la DOMANDA (parole più facili, frase più corta), ma NON fare esempi di risposta: non dire "per esempio: ...", non mostrare frasi modello e non rispondere tu alla domanda al posto suo.
DIVIETO ASSOLUTO: nel tuo messaggio non deve MAI comparire una frase (o una domanda) completa che lo studente potrebbe copiare come sua risposta o inserire nel testo. Puoi nominare al massimo UNA parola-chiave o un verbo all'infinito come indizio (es. "pensa al verbo venire"), mai una frase intera.
ESEMPI:
- Lo studente dice "non capisco". SBAGLIATO: "Vuoi venire a casa mia?" (è già la frase da scrivere). GIUSTO: "Come chiedi al tuo amico di venire da te? Pensa al verbo venire."
- Lo studente dice "scrivilo tu". SBAGLIATO: "Prova a dire: Vieni a casa mia!" (è la frase da scrivere). GIUSTO: "Non scrivo io il testo, ma sei capace! Con quale verbo inviti un amico? Prova tu."
- Lo studente scrive "Io voglio andare" con un errore. SBAGLIATO: "Si dice: io vado." GIUSTO: "Controlla il verbo: come cambia 'andare' con 'io'?"
Prima di rispondere, ricontrolla il tuo messaggio: se contiene una frase che lo studente potrebbe ricopiare, riscrivilo togliendola.

=== LINGUA E LIVELLO ===
Parla SEMPRE E SOLO in italiano, anche se lo studente risponde in un'altra lingua. ${levelStyle(level)}

=== SILLABO (rispettalo SEMPRE) ===
Guida solo dentro il sillabo del livello ${level}. La consegna, le domande e gli indizi NON devono richiedere strutture di livelli SUPERIORI al ${level}. Puoi ripassare strutture dei livelli inferiori.
${getSyllabusUpTo(level)}

=== TIPI DI TESTO CONSENTITI PER IL LIVELLO ${level} ===
${guides}
${consigna ? `\n=== CONSEGNA GIÀ PROPOSTA ===\n${consigna}\n` : ""}
=== STILE ===
Tono incoraggiante e mai umiliante. Messaggi BREVI (massimo 3-4 frasi corte). Una sola domanda alla volta. Testo semplice, senza elenchi lunghi né formattazione speciale.

=== STATO DELLA SESSIONE ===
${stateInstruction}

Rispondi ESCLUSIVAMENTE con l'oggetto JSON richiesto.`;
}

/** Cuántas consignas distintas puede pedir el alumno en total (la inicial + 3 alternativas). */
export const MAX_CONSIGNA_PROPOSALS = 4;

const CONSIGNA_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    consigna: {
      type: Type.STRING,
      description:
        "La consegna proposta: tipo di testo, tema e lunghezza, in italiano semplice e calibrato sul livello. Una o due frasi.",
    },
  },
  required: ["consigna"],
};

/**
 * Propone una consigna del nivel del alumno, distinta de las ya propuestas.
 * Es una llamada aparte del chat: el alumno puede pedir otra antes de empezar a planificar.
 */
export async function proposeConsigna({
  targetLevel,
  previous,
}: {
  targetLevel: CilsLevel;
  previous: string[];
}): Promise<string> {
  const guides = getGuidesForLevel(targetLevel)
    .map((guide) => `- ${guide.title.it}: ${guide.whatIsIt.it}`)
    .join("\n");
  const already = previous.length
    ? `\n=== CONSEGNE GIÀ PROPOSTE (proponine una DIVERSA: cambia il tipo di testo o, almeno, il tema) ===\n${previous.map((p) => `- ${p}`).join("\n")}\n`
    : "";

  const instruction = `Sei un tutor di scrittura per studenti di italiano come lingua straniera, livello obiettivo CILS ${targetLevel}. Proponi UNA consegna di scrittura adatta a questo livello.

Regole:
- Scegli il tipo di testo SOLO tra quelli consentiti per il livello ${targetLevel} qui sotto, con un tema semplice e vicino alla vita dello studente.
- La consegna deve indicare tipo di testo, tema e lunghezza (usa la lunghezza indicata per quel tipo di testo).
- Deve essere realizzabile SOLO con le strutture del sillabo del livello ${targetLevel}: NON richiedere strutture di livelli superiori.
- ${levelStyle(targetLevel)}
- Scrivi solo la consegna (una o due frasi), senza salutare e senza fare domande.

=== SILLABO ===
${getSyllabusUpTo(targetLevel)}

=== TIPI DI TESTO CONSENTITI PER IL LIVELLO ${targetLevel} ===
${guides}
${already}
Rispondi ESCLUSIVAMENTE con l'oggetto JSON richiesto.`;

  const response = await generateWithFallback({
    attemptsPerModel: 1,
    contents: [{ role: "user", parts: [{ text: "Proponi una consegna." }] }],
    config: {
      systemInstruction: instruction,
      responseMimeType: "application/json",
      responseSchema: CONSIGNA_SCHEMA,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new CorrectionRequestError("Gemini no devolvió contenido.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CorrectionRequestError("Gemini no devolvió un JSON válido.");
  }

  const consigna = (parsed as { consigna?: unknown } | null)?.consigna;
  if (typeof consigna !== "string" || consigna.trim() === "") {
    throw new CorrectionRequestError("Falta consigna en la respuesta.");
  }

  return consigna.trim().slice(0, 600);
}

function parseTurn(
  raw: string,
  ctx: { validAnswers: number; max: number; forceClose: boolean }
): TutorTurn {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CorrectionRequestError("Gemini no devolvió un JSON válido.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new CorrectionRequestError("Gemini no devolvió un objeto JSON.");
  }

  const value = parsed as Record<string, unknown>;
  if (typeof value.message !== "string" || value.message.trim() === "") {
    throw new CorrectionRequestError("Falta message en la respuesta.");
  }

  const answered = value.answered === true;
  const reachedMax = ctx.validAnswers + (answered ? 1 : 0) >= ctx.max;
  const phase =
    ctx.forceClose || reachedMax || value.phase === "ready_to_write"
      ? "ready_to_write"
      : "planning";
  const consigna =
    typeof value.consigna === "string" && value.consigna.trim() !== ""
      ? value.consigna.trim()
      : null;

  return { message: value.message.trim(), phase, consigna, answered };
}

/** Un turno del tutor: recibe el historial y devuelve el siguiente mensaje. Solo en el servidor. */
export async function runTutorTurn({
  targetLevel,
  history,
  consigna,
  validAnswers,
}: {
  targetLevel: CilsLevel;
  history: TutorMessage[];
  consigna: string | null;
  /** Respuestas válidas contadas por el cliente antes del último mensaje. */
  validAnswers: number;
}): Promise<TutorTurn> {
  const max = getMaxPlanningAnswers(targetLevel);
  const studentMessages = history.filter((m) => m.role === "student").length;
  const isFirstTurn = studentMessages === 0;
  const forceClose = studentMessages >= max + EXTRA_STUDENT_MESSAGES_CAP;

  // Gemini expects the conversation to start with a user turn: the session
  // opener stands in for it, and tutor messages map to the "model" role.
  const contents = [
    { role: "user", parts: [{ text: "(inizio della sessione)" }] },
    ...history.map((m) => ({
      role: m.role === "tutor" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  ];

  const response = await generateWithFallback({
    attemptsPerModel: 1,
    contents,
    config: {
      systemInstruction: buildTutorInstruction({
        level: targetLevel,
        consigna,
        validAnswers,
        isFirstTurn,
        forceClose,
      }),
      responseMimeType: "application/json",
      responseSchema: TUTOR_SCHEMA,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new CorrectionRequestError("Gemini no devolvió contenido.");
  }

  return parseTurn(raw, { validAnswers, max, forceClose });
}

export { CorrectionRequestError };
