import type { CilsLevel } from "@/lib/types/profile";

/** Fichas del sillabo CILS por nivel (A1..C2). Las comparten el corrector y el tutor de escritura guiada. */
export const SYLLABUS = `=== SILLABO PER LIVELLO (cosa si richiede a ogni livello) ===
A1: essere/avere, modali (potere/dovere/volere), verbi regolari all'indicativo presente, passato prossimo (scelta dell'ausiliare; NON si richiede l'accordo del participio), infinito presente, imperativo. Frase semplice; coordinate e/ma; subordinate causali (perché), temporali (quando), finali implicite (per+infinito), relative, ipotetiche con se. Testi molto brevi (20-40 / 15-30 parole).
A2: AGGIUNGE accordo nome-aggettivo, pronomi atoni (lo/la/li/le), preposizioni articolate (di/a/da/su), imperfetto, subordinate con "che" (oggettive, relative con che), ipotetiche con se. NON ancora: condizionale, futuro, congiuntivo, passato remoto. (30-60 / 25-50 parole).
B1: AGGIUNGE comparativo/superlativo, pronomi relativi, riflessivi, indefiniti (ogni/ciascuno/nessuno/qualche), possessivi/dimostrativi/interrogativi, CONDIZIONALE PRESENTE, subordinate relative esplicite, oggettive implicite, temporali/causali/dichiarative. NON ancora: CONGIUNTIVO (è B2), futuro, condizionale passato, passato remoto. (100-120 / 50-80 parole). Descrizione/narrazione/lettera informale, breve saggio.
B2: AGGIUNGE CONGIUNTIVO presente e imperfetto, condizionale passato, futuro semplice e anteriore, passato remoto, trapassato prossimo, forma passiva (riconoscimento), pronomi combinati, verbi impersonali; subordinate soggettive, finali, comparative, condizionali ipotesi reale, concessive/consecutive esplicite. REGISTRO FORMALE. NON ancora: congiuntivo passato/trapassato, gerundio, nominalizzazione, ipotesi irreale (C1). (120-140 / 80-100 parole). Saggio breve + lettera formale.
C1: AGGIUNGE congiuntivo passato e trapassato, gerundio, participio, forma passiva completa, verbi pronominali/difettivi/fraseologici, periodo ipotetico completo (possibile e irreale), concessive/consecutive implicite, NOMINALIZZAZIONE, discorso diretto e indiretto. Lessico ampio, parafrasi, idiomatico. (160-180 / 100-120 parole). Saggio + lettera formale.
C2: padronanza piena: profili sintattici dell'italiano contemporaneo, meccanismi del parlato (dislocazioni a sinistra, frasi scisse, segnali discorsivi), registri, sinonimi, connotazione, idiomatico. (200-250 / 120-150 parole). Saggio + lettera formale.`;

const LEVEL_ORDER: CilsLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Sillabo hasta el nivel dado (incluido), sin fichas de niveles superiores. */
export function getSyllabusUpTo(level: CilsLevel): string {
  const lines = SYLLABUS.split(/\r?\n/);
  const [header, ...levelLines] = lines;
  const kept = levelLines.filter((line) => {
    const lineLevel = line.slice(0, 2) as CilsLevel;
    return LEVEL_ORDER.indexOf(lineLevel) <= LEVEL_ORDER.indexOf(level);
  });
  return [header, ...kept].join("\n");
}
