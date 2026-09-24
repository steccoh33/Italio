import type { CilsLevel } from "@/lib/types/profile";

export const CILS_LEVELS: CilsLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type CilsLevelInfo = {
  level: CilsLevel;
  label: string;
  minWords: number;
  maxWords: number;
  /** Strutture grammaticali attese a questo livello, in italiano: usate nel prompt di sistema di Gemini. */
  structures: string;
};

export const CILS_LEVEL_INFO: Record<CilsLevel, CilsLevelInfo> = {
  A1: {
    level: "A1",
    label: "A1",
    minWords: 40,
    maxWords: 60,
    structures:
      "presente indicativo dei verbi più comuni, frasi semplici e coordinate con 'e'/'ma', lessico di base per presentarsi e descrivere la vita quotidiana",
  },
  A2: {
    level: "A2",
    label: "A2",
    minWords: 60,
    maxWords: 100,
    structures:
      "presente e passato prossimo, prime subordinate semplici (perché, quando, se), lessico quotidiano un po' più ampio",
  },
  B1: {
    level: "B1",
    label: "B1 (UNO-B1)",
    minWords: 100,
    maxWords: 150,
    structures:
      "passato prossimo e imperfetto, futuro semplice, condizionale semplice, subordinate relative e causali, connettivi testuali di base",
  },
  B2: {
    level: "B2",
    label: "B2 (DUE-B2)",
    minWords: 150,
    maxWords: 220,
    structures:
      "tutti i tempi dell'indicativo, congiuntivo presente e passato, periodo ipotetico, subordinate più complesse, lessico specifico e connettivi testuali vari",
  },
  C1: {
    level: "C1",
    label: "C1 (TRE-C1)",
    minWords: 220,
    maxWords: 300,
    structures:
      "uso sicuro di congiuntivo e condizionale in tutte le forme, periodo ipotetico complesso, registro adattabile al contesto, lessico ricco e preciso, coesione testuale sofisticata",
  },
  C2: {
    level: "C2",
    label: "C2 (QUATTRO-C2)",
    minWords: 280,
    maxWords: 400,
    structures:
      "padronanza quasi nativa della sintassi, uso flessibile di registro e stile, lessico idiomatico e sfumato, piena coesione e coerenza anche in testi complessi",
  },
};

export function isCilsLevel(value: string): value is CilsLevel {
  return (CILS_LEVELS as string[]).includes(value);
}
