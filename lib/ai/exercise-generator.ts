import { Type, type Schema } from "@google/genai";
import { CorrectionRequestError, generateWithFallback } from "@/lib/ai/gemini-chain";
import { getSyllabusUpTo } from "@/lib/ai/syllabus";
import {
  LEVEL_CONFIG,

  allowedStructures,
  forbiddenVerbStructures,
  type ExerciseType,
} from "@/lib/exercises/config";
import {
  mergeVerification,
  parseVerifierOutput,
  validateExercise,
} from "@/lib/exercises/validate";

import type { Exercise } from "@/lib/exercises/types";
import type { CilsLevel } from "@/lib/types/profile";

const EXERCISE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    instructions: {
      type: Type.STRING,
      description: "La consegna per lo studente, in italiano semplice, una riga.",
    },
    text: {
      type: Type.STRING,
      description:
        "Il testo dell'esercizio. Ogni spazio da completare è un marcatore [1], [2], [3]... (numerati, ognuno una sola volta).",
    },
    blanks: {
      type: Type.ARRAY,
      minItems: "5",
      maxItems: "8",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER, description: "Numero dello spazio: 1, 2, 3..." },
          structure: {
            type: Type.STRING,
            description:
              "Etichetta della struttura che verifica questo spazio, scelta ESATTAMENTE tra quelle consentite.",
          },
          answers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              "Per verbi e strutturale: TUTTE le forme corrette accettabili in quel contesto (almeno una). Per il cloze: array vuoto.",
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Solo per il cloze: le opzioni. Per gli altri tipi: array vuoto.",
          },
          correct_index: {
            type: Type.INTEGER,
            description:
              "Solo per il cloze: indice (da 0) dell'opzione corretta. Per gli altri tipi: 0.",
          },
          explanation: {
            type: Type.STRING,
            description: "Breve spiegazione in italiano semplice del perché la risposta è quella.",
          },
        },
        required: ["id", "structure", "answers", "options", "correct_index", "explanation"],
      },
    },
  },
  required: ["instructions", "text", "blanks"],
};

const THEMES = [
  "la famiglia",
  "una giornata a scuola",
  "una vacanza al mare",
  "la spesa al mercato",
  "il tempo libero",
  "una gita in città",
  "il lavoro",
  "il cibo e la cucina",
  "un viaggio in treno",
  "gli amici e le feste",
  "lo sport",
  "la casa e il quartiere",
  "un incontro inatteso",
  "la salute e il benessere",
  "la tecnologia di ogni giorno",
];

function formatSpec(level: CilsLevel, type: ExerciseType): string {
  const config = LEVEL_CONFIG[level];

  if (type === "verbi") {
    return `TIPO "verbi". Scrivi un breve testo coerente (un paragrafo o due) con ESATTAMENTE 6 spazi (mai meno di 5 e mai più di 8). Ogni spazio è un marcatore [n] seguito SUBITO dall'infinito tra parentesi, es.: "Ieri io [1] (andare) al mercato e [2] (comprare) la frutta." Lo studente scrive la forma coniugata corretta. Strutture verbali ammesse per il livello ${level}: ${config.verbDescription} Etichette consentite per il campo "structure": ${config.verbStructures.join(", ")}.`;
  }

  if (type === "strutturale") {
    const s = config.structural;
    const hint =
      s.kind === "aggettivi"
        ? `Ogni spazio è un marcatore [n] seguito dall'aggettivo base tra parentesi (forma del maschile singolare), es.: "Le mie amiche sono [1] (simpatico)." Lo studente scrive la forma concordata.`
        : s.kind === "preposizioni"
          ? `Ogni spazio è un marcatore [n] seguito tra parentesi dalle due parti da unire, es.: "Vado [1] (a + il) cinema." Lo studente scrive la preposizione articolata. Usa SOLO preposizioni che formano davvero una preposizione articolata: di, a, da, in, su (mai per, tra, fra: non si fondono con l'articolo). La frase deve essere naturale con la preposizione articolata (es. "vado dai nonni", non "vado ai nonni").`
          : `Ogni spazio è un marcatore [n], eventualmente seguito da un breve suggerimento tra parentesi se serve a rendere la risposta inequivocabile. Lo studente scrive la forma corretta.`;
    return `TIPO "strutturale" (${s.kind}). Scrivi un breve testo coerente con ESATTAMENTE 6 spazi (mai meno di 5 e mai più di 8) che verificano: ${s.description} ${hint} Etichette consentite per il campo "structure": ${s.structures.join(", ")}.`;
  }

  return `TIPO "cloze". Scrivi un breve testo coerente con ESATTAMENTE 6 spazi (mai meno di 5 e mai più di 8), ognuno un marcatore [n] senza altro testo. Per OGNI spazio dai esattamente ${config.clozeOptions} opzioni TUTTE DIVERSE tra loro (campo "options") e l'indice della corretta (campo "correct_index", da 0): una sola opzione è corretta, le altre sono plausibili ma chiaramente sbagliate in quel contesto. Le opzioni devono essere PAROLE DIVERSE (nomi, verbi, aggettivi, avverbi, connettivi: vocabolario), NON forme diverse dello stesso verbo e NON un esercizio sugli ausiliari. Lessico: ${config.clozeLexicon}. Il campo "structure" è sempre "lessico". Il campo "answers" è un array vuoto.`;
}

function buildInstruction(level: CilsLevel, type: ExerciseType, theme: string): string {
  const forbidden =
    type === "verbi" ? forbiddenVerbStructures(level) : [];

  return `Sei un esaminatore CILS esperto che prepara esercizi di analisi delle strutture, in stile esame CILS reale, per uno studente di livello ${level}.

=== COMPITO ===
Genera UN esercizio nuovo. Tema suggerito: ${theme}.
${formatSpec(level, type)}

=== REGOLA D'ORO: RISPETTA IL LIVELLO ===
Usa SOLO strutture del sillabo del livello ${level}. NON generare MAI strutture di livelli superiori.${
    forbidden.length
      ? ` Per questo esercizio sono VIETATE (livelli superiori): ${forbidden.join(", ")}.`
      : ""
  } Anche il testo intorno agli spazi deve restare a livello ${level}: lessico e sintassi semplici, senza strutture superiori al livello (nemmeno fuori dagli spazi).
${getSyllabusUpTo(level)}

=== RIGORE (è la cosa più importante) ===
- Italiano CORRETTO e naturale. Soluzioni INEQUIVOCABILI: nessuno spazio ambiguo.
- Per verbi e strutturale: se nel contesto è valida più di una forma, elencale TUTTE in "answers" (es. "è andata", "andò"); non lasciare fuori nessuna forma corretta. Se non c'è ambiguità, una sola.
- Il contesto deve rendere la risposta INEQUIVOCABILE: aggiungi indicatori di tempo chiari (ieri, ogni giorno, mentre, all'improvviso, l'anno scorso...) in modo che passato prossimo e imperfetto non siano intercambiabili. Evita frasi dove sarebbero corrette più forme a meno che le elenchi tutte.
- Verbi con DUE ausiliari entrambi corretti: i modali dovere/potere/volere + infinito ("ho dovuto restare" e "sono dovuto restare"); iniziare/cominciare/finire seguiti da "a"/infinito ("ha iniziato a piovere" e "è iniziato a piovere"); i verbi meteo (piovere, nevicare: "ha piovuto" e "è piovuto"); durare, vivere, correre, passare in alcuni usi. Elencali sempre entrambi. Elencali entrambi, oppure evita questi casi.
- MAI usare periodi ipotetici con "se" + congiuntivo (es. "Se avessi tempo...", "Se potessi...") sotto il livello B2: contengono un congiuntivo, vietato. Per il condizionale presente usa SOLO richieste gentili, desideri e consigli ("vorrei", "potresti", "dovresti", "mi piacerebbe", "secondo me sarebbe meglio"). Non scrivere mai nel testo forme di congiuntivo (avesse, fosse, potesse, che sia, che vada...) sotto il livello B2.
- Ogni risposta deve essere una forma COMPLETA (per i tempi composti: ausiliare + participio, mai il solo participio).
- Se il soggetto non specifica il genere (io, noi, tu, voi) e il verbo ha l'ausiliare ESSERE, elenca sia la forma maschile sia quella femminile (es. "sono andato" e "sono andata"). Con l'ausiliare AVERE il participio NON si accorda ("ho deciso", MAI "ho decisa"): niente varianti di genere.
- Ogni spazio deve verificare UNA struttura consentita e dichiararla nel campo "structure" (etichetta esatta).
- AUTO-VERIFICA prima di rispondere: risolvi tu stesso ogni spazio, senza guardare la soluzione che hai scritto, e controlla che coincida; controlla che il testo sia grammaticalmente corretto una volta riempiti gli spazi; controlla che nessuna risposta non elencata sia possibile; controlla che nessuna struttura superiore al livello ${level} compaia negli spazi.
- Le spiegazioni ("explanation") sono brevi (una frase) e in italiano semplice.
- Marcatori [1], [2]... consecutivi, ognuno UNA sola volta nel testo, e tutti dichiarati in "blanks".

Rispondi ESCLUSIVAMENTE con l'oggetto JSON richiesto.`;
}

const VERIFIER_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    blanks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          structure: {
            type: Type.STRING,
            description: "Etichetta della struttura richiesta dalla tua risposta, tra quelle consentite.",
          },
          answers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              "Verbi/strutturale: TUTTE le forme corrette accettabili in quel contesto. Cloze: array vuoto.",
          },
          valid_option_indices: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description:
              "Cloze: gli indici (da 0) di TUTTE le opzioni corrette nel contesto (di solito una sola). Altri tipi: array vuoto.",
          },
          tested_forms: {
            type: Type.ARRAY,
            description:
              "Solo per verbi: per ogni tempo/modo consentito, la forma che metteresti nello spazio e se, inserita nella frase, la rende corretta e naturale. Un elemento per OGNI tempo consentito. Altri tipi: array vuoto.",
            items: {
              type: Type.OBJECT,
              properties: {
                structure: { type: Type.STRING },
                form: { type: Type.STRING },
                is_correct: { type: Type.BOOLEAN },
              },
              required: ["structure", "form", "is_correct"],
            },
          },
          explanation: {
            type: Type.STRING,
            description:
              "Breve spiegazione in italiano semplice, coerente con TUTTE le risposte accettate.",
          },
        },
        required: ["id", "structure", "answers", "valid_option_indices", "tested_forms", "explanation"],
      },
    },
    text_above_level: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Etichette, scelte SOLO tra quelle vietate indicate nelle istruzioni, delle strutture vietate presenti in QUALSIASI parte del testo (anche fuori dagli spazi). Array vuoto se nessuna.",
    },
  },
  required: ["blanks", "text_above_level"],
};

/**
 * Segundo pase: otra llamada a la IA resuelve el ejercicio SIN ver la solución
 * del generador. Sirve para detectar huecos dudosos y para completar variantes
 * válidas que el generador olvidó.
 */
async function verifyExercise(exercise: Exercise, level: CilsLevel) {
  const blankLines = exercise.blanks
    .map((b) =>
      exercise.type === "cloze"
        ? `[${b.id}] opzioni: ${b.options.map((o, i) => `${i}) ${o}`).join("; ")}`
        : `[${b.id}]`
    )
    .join("\n");

  const instruction = `Sei un revisore CILS molto rigoroso. Ti viene dato un esercizio di analisi delle strutture per il livello ${level}, SENZA soluzioni. Risolvilo tu, in modo indipendente.

Regole:
${
    exercise.type === "verbi"
      ? `- Procedura obbligatoria per i verbi: per OGNI spazio prova UNO PER UNO tutti questi tempi/modi consentiti per il livello: ${LEVEL_CONFIG[level].verbStructures.join(", ")}. Compila "tested_forms" con UN elemento per OGNI tempo/modo elencato (la forma coniugata che metteresti e is_correct true/false: true solo se la frase risultante è corretta e naturale nel contesto). Poi metti in "answers" TUTTE le forme con is_correct true. Molte frasi ammettono più tempi (passato prossimo e imperfetto; presente e condizionale con "oggi/adesso"...): non fermarti alla prima forma che ti viene in mente. Varianti di genere (maschile/femminile) SOLO con l'ausiliare essere; con avere il participio non si accorda ("ho deciso", mai "ho decisa").
`
      : ""
  }- Per verbi e strutturale: per ogni spazio elenca TUTTE le forme corrette accettabili in quel contesto: includi le varianti valide (entrambi gli ausiliari con i verbi modali + infinito; passato prossimo e imperfetto se il contesto ammette entrambi; forma maschile e femminile quando il soggetto non specifica il genere; forme contratte/elise equivalenti). NON includere forme sbagliate. Se non c'è alcuna risposta corretta o lo spazio è ambiguo, elenca comunque la forma più probabile.
- Per il cloze: elenca gli indici di TUTTE le opzioni corrette nel contesto (di solito una sola). Se più opzioni funzionano, elencale tutte.
- Verbi con DUE ausiliari entrambi corretti: i modali dovere/potere/volere + infinito ("ho dovuto restare" e "sono dovuto restare"); iniziare/cominciare/finire seguiti da "a"/infinito ("ha iniziato a piovere" e "è iniziato a piovere"); i verbi meteo (piovere, nevicare: "ha piovuto" e "è piovuto"); durare, vivere, correre, passare in alcuni usi. Elencali sempre entrambi.
- Ogni risposta deve essere una forma COMPLETA (per i tempi composti: ausiliare + participio, mai il solo participio).
- Nel campo "structure" indica la struttura richiesta dalla tua risposta principale, scegliendo ESATTAMENTE tra: ${allowedStructures(level, exercise.type).join(", ")}.
- Nel campo "explanation" scrivi una breve spiegazione in italiano semplice, coerente con TUTTE le risposte accettate.
- Nel campo "text_above_level" indica quali tra queste strutture VIETATE per il livello ${level} compaiono in QUALSIASI parte del testo (anche fuori dagli spazi): ${forbiddenVerbStructures(level).join(", ") || "(nessuna)"}. Segnala SOLO strutture di questa lista (mai imperfetto, presente, passato prossimo o condizionale presente se consentiti a ${level}); se non ce n'è nessuna, array vuoto.
- Rispondi con l'oggetto JSON richiesto.`;

  const response = await generateWithFallback({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Tipo di esercizio: ${exercise.type}\nConsegna: ${exercise.instructions}\n\nTesto:\n${exercise.text}\n\nSpazi:\n${blankLines}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: instruction,
      responseMimeType: "application/json",
      responseSchema: VERIFIER_SCHEMA,
    },
  });

  let parsed: unknown = null;
  try {
    parsed = response.text ? JSON.parse(response.text) : null;
  } catch {
    parsed = null;
  }
  return parseVerifierOutput(parsed);
}

/**
 * Genera un ejercicio del nivel y tipo dados. Solo en el servidor. La respuesta
 * se valida estrictamente; si es inválida o sale del nivel se reintenta una
 * vez (solo si queda tiempo).
 */
export async function generateExercise({
  level,
  type,
}: {
  level: CilsLevel;
  type: ExerciseType;
}): Promise<Exercise> {
  const started = Date.now();
  let lastReason = "";

  for (let attempt = 0; attempt < 3; attempt++) {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const response = await generateWithFallback({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                attempt === 0
                  ? "Genera l'esercizio."
                  : `Genera l'esercizio. Il tentativo precedente era invalido (${lastReason}): correggi questo problema.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: buildInstruction(level, type, theme),
        responseMimeType: "application/json",
        responseSchema: EXERCISE_SCHEMA,
      },
    });

    const rawText = response.text;
    let parsed: unknown = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    const result = validateExercise(parsed, level, type);
    if (result.ok) {
      const verifier = await verifyExercise(result.exercise, level);
      if (!verifier) {
        lastReason = "el verificador devolvió una respuesta inválida";
      } else if (
        verifier.textAboveLevel.some((label) =>
          forbiddenVerbStructures(level).includes(label.trim().toLowerCase().replace(/[\s-]+/g, "_"))
        )
      ) {
        lastReason = `el texto tiene estructuras por encima del nivel: ${verifier.textAboveLevel.join(", ")}`;
      } else {
        const merged = mergeVerification(result.exercise, verifier.blanks, level);
        if (merged.ok) return merged.exercise;
        lastReason = merged.reason;
      }
    } else {
      lastReason = result.reason;
    }

    console.error(`Exercise ${level}/${type} rejected:`, lastReason);
    if (Date.now() - started > 25_000) break;
  }

  throw new CorrectionRequestError(`Ejercicio inválido: ${lastReason}`, "other");
}
