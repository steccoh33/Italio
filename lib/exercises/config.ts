import type { CilsLevel } from "@/lib/types/profile";

export type ExerciseType = "verbi" | "strutturale" | "cloze";
export const EXERCISE_TYPES: ExerciseType[] = ["verbi", "strutturale", "cloze"];

export type StructuralKind =
  | "aggettivi"
  | "preposizioni"
  | "pronomi"
  | "pronomi_connettivi"
  | "riformulazione";

type LevelConfig = {
  /** Etiquetas de estructura permitidas para los huecos de "verbi". */
  verbStructures: string[];
  /** Nombre del tipo estructural de este nivel y sus etiquetas permitidas. */
  structural: { kind: StructuralKind; structures: string[]; description: string };
  /** Opciones por hueco en el cloze. */
  clozeOptions: 3 | 4;
  clozeLexicon: string;
  verbDescription: string;
};

const A1_VERBS = ["presente", "passato_prossimo", "imperativo"];
const A2_VERBS = ["presente", "passato_prossimo", "imperfetto"];
const B1_VERBS = ["presente", "passato_prossimo", "imperfetto", "condizionale_presente"];
const B2_VERBS = [
  ...B1_VERBS,
  "congiuntivo_presente",
  "congiuntivo_imperfetto",
  "futuro",
  "passato_remoto",
  "trapassato_prossimo",
];
const C1_VERBS = [
  ...B2_VERBS,
  "congiuntivo_passato",
  "congiuntivo_trapassato",
  "gerundio",
  "forma_passiva",
  "periodo_ipotetico",
];
const C2_VERBS = [
  ...C1_VERBS,
  "condizionale_passato",
  "futuro_anteriore",
  "costruzioni_colte",
];

/**
 * Ficha por nivel: qué estructuras puede generar cada tipo de ejercicio.
 * Regla de oro: nunca estructuras por encima del nivel.
 */
export const LEVEL_CONFIG: Record<CilsLevel, LevelConfig> = {
  A1: {
    verbStructures: A1_VERBS,
    verbDescription:
      "presente indicativo, passato prossimo (con scelta dell'ausiliare essere/avere) e imperativo di base. NIENTE imperfetto, NIENTE condizionale, NIENTE congiuntivo, NIENTE futuro.",
    structural: {
      kind: "aggettivi",
      structures: ["aggettivi_concordanza_regolare"],
      description:
        "concordanza di genere e numero degli aggettivi con il nome, solo casi regolari (-o/-a/-i/-e, -e/-i).",
    },
    clozeOptions: 3,
    clozeLexicon: "lessico elementare (vita quotidiana, famiglia, cibo, casa, scuola)",
  },
  A2: {
    verbStructures: A2_VERBS,
    verbDescription:
      "presente indicativo, passato prossimo e imperfetto. NIENTE condizionale, NIENTE futuro, NIENTE congiuntivo, NIENTE passato remoto.",
    structural: {
      kind: "aggettivi",
      structures: ["aggettivi_concordanza"],
      description:
        "concordanza di genere e numero degli aggettivi con il nome, anche casi meno regolari (-ista, -ese, -e invariabili, bello/buono davanti al nome).",
    },
    clozeOptions: 3,
    clozeLexicon: "lessico di base (viaggi, lavoro, tempo libero, salute, città)",
  },
  B1: {
    verbStructures: B1_VERBS,
    verbDescription:
      "presente indicativo, passato prossimo, imperfetto e condizionale presente. NIENTE congiuntivo (è B2), NIENTE futuro, NIENTE condizionale passato, NIENTE passato remoto.",
    structural: {
      kind: "preposizioni",
      structures: ["preposizioni_articolate"],
      description:
        "preposizioni articolate (di+il → del, a+i → ai, su+la → sulla, in+il → nel, da+lo → dallo...).",
    },
    clozeOptions: 4,
    clozeLexicon: "lessico intermedio (ambiente, media, studio, esperienze, opinioni semplici)",
  },
  B2: {
    verbStructures: B2_VERBS,
    verbDescription:
      "presente, passato prossimo, imperfetto, condizionale presente, congiuntivo presente e imperfetto, futuro semplice, passato remoto e trapassato prossimo. NIENTE congiuntivo passato o trapassato, NIENTE gerundio, NIENTE periodo ipotetico dell'irrealtà.",
    structural: {
      kind: "pronomi",
      structures: [
        "possessivi",
        "relativi_che_cui",
        "interrogativi",
        "pronomi_combinati",
      ],
      description:
        "pronomi e aggettivi possessivi, pronomi relativi (che, cui, il quale), interrogativi e pronomi combinati (glielo, me lo, ce ne...).",
    },
    clozeOptions: 4,
    clozeLexicon: "lessico avanzato, con sinonimi sottili e collocazioni comuni",
  },
  C1: {
    verbStructures: C1_VERBS,
    verbDescription:
      "tutti i tempi del B2 più congiuntivo passato e trapassato, gerundio, forma passiva e periodo ipotetico completo (possibile e irreale).",
    structural: {
      kind: "pronomi_connettivi",
      structures: ["relativi_complessi", "nominalizzazione", "discorso_indiretto"],
      description:
        "pronomi relativi complessi (il cui, colui che, ciò che...), nominalizzazione e discorso indiretto.",
    },
    clozeOptions: 4,
    clozeLexicon: "lessico ampio e idiomatico, registri e sfumature",
  },
  C2: {
    verbStructures: C2_VERBS,
    verbDescription:
      "tutti i modi e i tempi con sfumature, anche costruzioni colte e letterarie.",
    structural: {
      kind: "riformulazione",
      structures: [
        "registro",
        "connettivi_sofisticati",
        "espressioni_idiomatiche",
      ],
      description:
        "riformulazione e scelta di registro, connettivi sofisticati ed espressioni idiomatiche.",
    },
    clozeOptions: 4,
    clozeLexicon: "lessico colto, connotazione e sfumature di significato",
  },
};

/** Etiquetas de estructura permitidas para un hueco, según nivel y tipo. */
export function allowedStructures(level: CilsLevel, type: ExerciseType): string[] {
  const config = LEVEL_CONFIG[level];
  if (type === "verbi") return config.verbStructures;
  if (type === "strutturale") return config.structural.structures;
  return ["lessico"];
}

/** Etiquetas de estructura que pertenecen a niveles SUPERIORES (para prohibirlas explícitamente). */
export function forbiddenVerbStructures(level: CilsLevel): string[] {
  const allowed = new Set(LEVEL_CONFIG[level].verbStructures);
  return LEVEL_CONFIG.C2.verbStructures.filter((s) => !allowed.has(s));
}

export const MIN_BLANKS = 5;
export const MAX_BLANKS = 8;
