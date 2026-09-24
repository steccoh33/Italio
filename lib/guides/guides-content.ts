import type { CilsLevel } from "@/lib/types/profile";

export type GuideLocale = "it" | "es";
export type Localized = Record<GuideLocale, string>;

export type Guide = {
  id: string;
  level: CilsLevel;
  title: Localized;
  whatIsIt: Localized;
  register: Localized;
  structure: {
    start: Localized;
    development: Localized;
    end: Localized;
  };
  /** Frasi in italiano: non si traducono. */
  usefulPhrases: string[];
  /** Testo modello, solo in italiano, al livello esatto della guida. */
  modelExample: string;
  commonMistakes: Localized[];
};

export const GUIDES_BY_LEVEL: Record<CilsLevel, Guide[]> = {
  A1: [
    {
      id: "a1-descrizione-personale",
      level: "A1",
      title: {
        it: "Descrizione personale breve",
        es: "Descripción personal breve",
      },
      whatIsIt: {
        it: "Un testo corto per presentarti: nome, famiglia, dove abiti e cosa ti piace. Lunghezza: 20-40 parole.",
        es: "Un texto corto para presentarte: nombre, familia, dónde vivís y qué te gusta. Extensión: 20-40 palabras.",
      },
      register: {
        it: "Semplice e diretto, con frasi corte.",
        es: "Básico y directo, con frases cortas.",
      },
      structure: {
        start: {
          it: "Presentati con nome, età e nazionalità: «Mi chiamo… Ho… anni. Sono…»",
          es: "Presentate con nombre, edad y nacionalidad: «Mi chiamo… Ho… anni. Sono…»",
        },
        development: {
          it: "Parla della famiglia, della casa e dei tuoi gusti: «Abito a… con… Mi piace…»",
          es: "Hablá de tu familia, tu casa y tus gustos: «Abito a… con… Mi piace…»",
        },
        end: {
          it: "Chiudi con un gusto o un desiderio: «Il mio hobby è… / Sono felice.»",
          es: "Cerrá con un gusto o un deseo: «Il mio hobby è… / Sono felice.»",
        },
      },
      usefulPhrases: [
        "Mi chiamo…",
        "Ho … anni",
        "Sono di…",
        "Abito a…",
        "Mi piace",
        "Non mi piace",
        "La mia famiglia è…",
      ],
      modelExample:
        "Mi chiamo Ana. Ho venti anni e sono argentina. Abito a Bariloche con la mia famiglia. Ho una sorella. Mi piace la musica e il cinema. Non mi piace lo sport. Il mio cane si chiama Toto. Sono felice.",
      commonMistakes: [
        {
          it: "Frasi troppo lunghe: a livello A1 è meglio scrivere frasi corte.",
          es: "Frases demasiado largas: en A1 es mejor escribir frases cortas.",
        },
        {
          it: "Dimenticare il verbo: «Io Ana» → «Mi chiamo Ana».",
          es: "Olvidar el verbo: «Io Ana» → «Mi chiamo Ana».",
        },
      ],
    },
    {
      id: "a1-messaggio-semplice",
      level: "A1",
      title: {
        it: "Messaggio semplice",
        es: "Mensaje simple",
      },
      whatIsIt: {
        it: "Una nota o un messaggio breve e informale a un amico o a un familiare: salutare, avvisare, invitare. Lunghezza: 20-40 parole.",
        es: "Una nota o mensaje corto e informal a un amigo o familiar: saludar, avisar, invitar. Extensión: 20-40 palabras.",
      },
      register: {
        it: "Informale, con il «tu».",
        es: "Informal, tratando al otro de «tu» (tuteo).",
      },
      structure: {
        start: {
          it: "Saluta: «Ciao…!»",
          es: "Saludá: «Ciao…!»",
        },
        development: {
          it: "Scrivi il messaggio: «Oggi… Domani… Ti aspetto…»",
          es: "Escribí el mensaje: «Oggi… Domani… Ti aspetto…»",
        },
        end: {
          it: "Congedati e firma con il tuo nome: «A presto! / Ciao!»",
          es: "Despedite y firmá con tu nombre: «A presto! / Ciao!»",
        },
      },
      usefulPhrases: [
        "Ciao",
        "Come stai?",
        "Oggi",
        "Domani",
        "Ti aspetto",
        "A presto",
        "Un saluto",
      ],
      modelExample:
        "Ciao Marco! Come stai? Domani io vado al parco. Ci sono anche Lucia e Paolo. Vieni anche tu? Ti aspetto alle tre. È una bella giornata! A presto, Ana",
      commonMistakes: [
        {
          it: "Usare il registro formale in un messaggio a un amico.",
          es: "Usar el registro formal en un mensaje a un amigo.",
        },
        {
          it: "Dimenticare il saluto iniziale o il congedo finale.",
          es: "Olvidar el saludo inicial o la despedida final.",
        },
      ],
    },
  ],
  A2: [],
  B1: [],
  B2: [],
  C1: [],
  C2: [],
};

export function getGuidesForLevel(level: CilsLevel): Guide[] {
  return GUIDES_BY_LEVEL[level];
}

/** Solo restituisce la guida se appartiene esattamente al livello dato. */
export function getGuideForLevel(
  level: CilsLevel,
  guideId: string
): Guide | null {
  return GUIDES_BY_LEVEL[level].find((guide) => guide.id === guideId) ?? null;
}
