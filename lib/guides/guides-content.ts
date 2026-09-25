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
  A2: [
    {
      id: "a2-descrizione",
      level: "A2",
      title: {
        it: "Descrizione",
        es: "Descripción",
      },
      whatIsIt: {
        it: "Un testo per descrivere un luogo, una persona o un'esperienza semplice. Lunghezza: 40-60 parole.",
        es: "Un texto para describir un lugar, una persona o una experiencia simple. Extensión: 40-60 palabras.",
      },
      register: {
        it: "Neutro/informale, con frasi semplici ma già collegate tra loro.",
        es: "Neutro/informal, con frases sencillas pero ya conectadas entre sí.",
      },
      structure: {
        start: {
          it: "Presenta l'argomento: «Ti parlo di… / La mia città è…»",
          es: "Presentá el tema: «Ti parlo di… / La mia città è…»",
        },
        development: {
          it: "Aggiungi dettagli con «c'è / ci sono», gli aggettivi e l'imperfetto per il passato.",
          es: "Sumá detalles con «c'è / ci sono», adjetivos y el imperfetto para el pasado.",
        },
        end: {
          it: "Chiudi con un'impressione: «Mi piace molto / È stato bello.»",
          es: "Cerrá con una impresión: «Mi piace molto / È stato bello.»",
        },
      },
      usefulPhrases: [
        "C'è",
        "Ci sono",
        "è",
        "era",
        "molto",
        "perché",
        "anche",
        "un po'",
        "secondo me",
      ],
      modelExample:
        "La mia città si chiama Bariloche ed è in Argentina. È una città piccola ma molto bella, perché c'è un lago grande e ci sono le montagne. In inverno fa freddo e nevica. Mi piace passeggiare vicino al lago con i miei amici. Secondo me è un posto perfetto per le vacanze.",
      commonMistakes: [
        {
          it: "Dimenticare l'accordo tra aggettivo e nome: «città piccolo» → «città piccola».",
          es: "Olvidar la concordancia entre adjetivo y sustantivo: «città piccolo» → «città piccola».",
        },
        {
          it: "Scrivere frasi tutte staccate, senza connettori (e, ma, perché).",
          es: "Escribir frases todas sueltas, sin conectores (e, ma, perché).",
        },
      ],
    },
    {
      id: "a2-email-informale",
      level: "A2",
      title: {
        it: "Email / messaggio informale",
        es: "Email / mensaje informal",
      },
      whatIsIt: {
        it: "Un'email o un messaggio a un amico per raccontare qualcosa, invitare o rispondere. Lunghezza: 25-40 parole.",
        es: "Un email o mensaje a un amigo para contar algo, invitar o responder. Extensión: 25-40 palabras.",
      },
      register: {
        it: "Informale, con il «tu».",
        es: "Informal, tratando al otro de «tu» (tuteo).",
      },
      structure: {
        start: {
          it: "Saluta e apri la conversazione: «Ciao…! Come stai?»",
          es: "Saludá y abrí la conversación: «Ciao…! Come stai?»",
        },
        development: {
          it: "Spiega il motivo: «Ti scrivo perché…»",
          es: "Explicá el motivo: «Ti scrivo perché…»",
        },
        end: {
          it: "Congedati: «A presto! Un abbraccio.»",
          es: "Despedite: «A presto! Un abbraccio.»",
        },
      },
      usefulPhrases: [
        "Ciao",
        "Come stai?",
        "Ti scrivo perché",
        "Che ne dici?",
        "Fammi sapere",
        "Un abbraccio",
      ],
      modelExample:
        "Ciao Giulia! Come stai? Ti scrivo perché sabato è il mio compleanno e faccio una festa a casa mia. Vengono anche Marco e Lucia. Iniziamo alle otto. Che ne dici, vieni? Fammi sapere! Un abbraccio, Ana",
      commonMistakes: [
        {
          it: "Usare un registro formale con un amico.",
          es: "Usar un registro formal con un amigo.",
        },
        {
          it: "Dimenticare il saluto iniziale o il congedo finale.",
          es: "Olvidar el saludo inicial o la despedida final.",
        },
      ],
    },
    {
      id: "a2-email-richiesta-informazioni",
      level: "A2",
      title: {
        it: "Email breve di richiesta d'informazioni",
        es: "Email breve de pedido de información",
      },
      whatIsIt: {
        it: "Un messaggio corto per chiedere informazioni su un servizio (un corso, un hotel). È ancora informale/neutro: NON è la lettera formale complessa (quella arriva a B2). Lunghezza: 25-40 parole.",
        es: "Un mensaje corto para pedir información sobre un servicio (un curso, un hotel). Sigue siendo informal/neutro: NO es la carta formal compleja (esa llega en B2). Extensión: 25-40 palabras.",
      },
      register: {
        it: "Neutro, cortese ma semplice.",
        es: "Neutro, cortés pero simple.",
      },
      structure: {
        start: {
          it: "Saluta e spiega perché scrivi: «Salve, scrivo per avere informazioni su…»",
          es: "Saludá y explicá por qué escribís: «Salve, scrivo per avere informazioni su…»",
        },
        development: {
          it: "Fai le domande concrete che ti interessano.",
          es: "Hacé las preguntas concretas que te interesan.",
        },
        end: {
          it: "Ringrazia: «Grazie! Aspetto una risposta.»",
          es: "Agradecé: «Grazie! Aspetto una risposta.»",
        },
      },
      usefulPhrases: [
        "Salve",
        "Quando inizia?",
        "Quanto costa?",
        "A che ora…?",
        "Come posso…?",
        "Ho bisogno di sapere",
        "Grazie",
      ],
      modelExample:
        "Salve, scrivo per avere informazioni sul corso di italiano. Quando inizia il corso? Quanto costa? A che ora sono le lezioni? Ho bisogno di sapere anche come posso iscrivermi. Grazie mille! Ana Pérez",
      commonMistakes: [
        {
          it: "Fare domande troppo complicate: a livello A2 meglio domande semplici e dirette.",
          es: "Hacer preguntas demasiado complicadas: en A2 es mejor hacer preguntas simples y directas.",
        },
        {
          it: "Dimenticare di ringraziare alla fine.",
          es: "Olvidar agradecer al final.",
        },
      ],
    },
  ],
  B1: [
    {
      id: "b1-lettera-informale",
      level: "B1",
      title: {
        it: "Email / lettera informale",
        es: "Email / carta informal",
      },
      whatIsIt: {
        it: "Un messaggio a un amico per raccontare un'esperienza, invitare, chiedere o dare un'opinione, con più sviluppo rispetto ad A2. Lunghezza: 100-120 parole.",
        es: "Un mensaje a un amigo para contar una experiencia, invitar, pedir o dar una opinión, con más desarrollo que en A2. Extensión: 100-120 palabras.",
      },
      register: {
        it: "Informale, con il «tu».",
        es: "Informal, tratando al otro de «tu» (tuteo).",
      },
      structure: {
        start: {
          it: "Saluta e apri: «Caro/a… Come stai?»",
          es: "Saludá y abrí la carta: «Caro/a… Come stai?»",
        },
        development: {
          it: "Spiega il motivo e sviluppa il contenuto con connettivi: «Ti scrivo perché… prima… poi… però…»",
          es: "Explicá el motivo y desarrollá el contenido con conectores: «Ti scrivo perché… prima… poi… però…»",
        },
        end: {
          it: "Chiudi e congedati: «Fammi sapere! Un abbraccio.»",
          es: "Cerrá y despedite: «Fammi sapere! Un abbraccio.»",
        },
      },
      usefulPhrases: [
        "Caro/a",
        "Come stai?",
        "Ti scrivo per…",
        "prima… poi… alla fine",
        "però",
        "quindi",
        "anche se",
        "secondo me",
        "Fammi sapere",
        "Un abbraccio",
      ],
      modelExample:
        "Caro Marco, come stai? Spero tutto bene. Ti scrivo per raccontarti della mia settimana a Roma. Sono arrivata lunedì e ho visitato subito il Colosseo: è enorme e bellissimo! Poi ho passeggiato per il centro e ho mangiato una pizza buonissima. Il giorno dopo sono andata ai Musei Vaticani, però c'era troppa gente. Anche se ero stanca, mi sono divertita tantissimo. Mi piacerebbe tornare con più tempo. La prossima volta dovresti venire anche tu! Fammi sapere se ti va. Un abbraccio, Ana",
      commonMistakes: [
        {
          it: "Usare un registro formale con un amico.",
          es: "Usar un registro formal con un amigo.",
        },
        {
          it: "Scrivere tutto in un unico blocco, senza separare inizio, sviluppo e chiusura.",
          es: "Escribir todo en un único bloque, sin separar inicio, desarrollo y cierre.",
        },
      ],
    },
    {
      id: "b1-racconto-esperienza",
      level: "B1",
      title: {
        it: "Racconto di un'esperienza (narrazione)",
        es: "Relato de una experiencia (narración)",
      },
      whatIsIt: {
        it: "Raccontare qualcosa che ti è successo, in ordine, con dettagli e sensazioni. Lunghezza: 100-120 parole.",
        es: "Contar algo que te pasó, en orden, con detalles y sensaciones. Extensión: 100-120 palabras.",
      },
      register: {
        it: "Informale/neutro.",
        es: "Informal/neutro.",
      },
      structure: {
        start: {
          it: "Colloca la storia nel tempo e nello spazio: «L'estate scorsa… / Un giorno…»",
          es: "Ubicá la historia en el tiempo y el espacio: «L'estate scorsa… / Un giorno…»",
        },
        development: {
          it: "Racconta i fatti in ordine, con passato prossimo e imperfetto.",
          es: "Contá los hechos en orden, con passato prossimo e imperfetto.",
        },
        end: {
          it: "Di' come è finita e cosa hai provato: «Alla fine… È stata un'esperienza…»",
          es: "Decí cómo terminó y qué sentiste: «Alla fine… È stata un'esperienza…»",
        },
      },
      usefulPhrases: [
        "L'anno scorso",
        "Un giorno",
        "prima… poi… dopo… infine",
        "mentre",
        "all'improvviso",
        "perché",
        "così",
        "alla fine",
        "è stato/a",
      ],
      modelExample:
        "L'estate scorsa ho fatto un viaggio indimenticabile in montagna con i miei amici. Siamo partiti presto la mattina e abbiamo camminato per ore. Mentre salivamo, il paesaggio diventava sempre più bello. All'improvviso ha iniziato a piovere e ci siamo riparati sotto un albero. Non avevamo l'ombrello, però abbiamo riso tantissimo. Quando siamo arrivati in cima, il sole è tornato e abbiamo mangiato insieme. Alla fine è stata un'esperienza fantastica che non dimenticherò.",
      commonMistakes: [
        {
          it: "Confondere passato prossimo e imperfetto.",
          es: "Confundir passato prossimo e imperfetto.",
        },
        {
          it: "Raccontare senza un ordine temporale chiaro.",
          es: "Contar sin un orden temporal claro.",
        },
      ],
    },
    {
      id: "b1-opinione",
      level: "B1",
      title: {
        it: "Opinione (esprimere e giustificare)",
        es: "Opinión (expresar y justificar)",
      },
      whatIsIt: {
        it: "Dare la tua opinione su un tema vicino a te e spiegare perché, con un paio di ragioni. Lunghezza: 100-120 parole.",
        es: "Dar tu opinión sobre un tema cercano y explicar por qué, con un par de razones. Extensión: 100-120 palabras.",
      },
      register: {
        it: "Neutro.",
        es: "Neutro.",
      },
      structure: {
        start: {
          it: "Presenta il tema e la tua posizione: «Secondo me… A mio parere…»",
          es: "Presentá el tema y tu postura: «Secondo me… A mio parere…»",
        },
        development: {
          it: "Dai due ragioni con esempi: «Prima di tutto… Inoltre…»",
          es: "Dá dos razones con ejemplos: «Prima di tutto… Inoltre…»",
        },
        end: {
          it: "Concludi: «Per questo motivo…»",
          es: "Concluí: «Per questo motivo…»",
        },
      },
      usefulPhrases: [
        "Secondo me",
        "Per me",
        "A mio parere",
        "Sono convinto/a che",
        "prima di tutto",
        "inoltre",
        "per esempio",
        "invece",
        "però",
        "per questo motivo",
        "in conclusione",
      ],
      modelExample:
        "Secondo me lo sport è molto importante per i giovani. Prima di tutto, fare sport aiuta a stare in salute e a sentirsi bene. Per esempio, io gioco a pallavolo due volte alla settimana e ho più energia. Inoltre, lo sport insegna a lavorare in gruppo e a rispettare gli altri. Certo, a volte è difficile trovare il tempo per studiare e allenarsi, ma con un po' di organizzazione si può fare tutto. Per questo motivo, sono convinta che tutti dovrebbero praticare uno sport.",
      commonMistakes: [
        {
          it: "Dare un'opinione senza spiegare il perché.",
          es: "Dar una opinión sin explicar el porqué.",
        },
        {
          it: "Usare «penso che / credo che» (richiedono il congiuntivo, che è B2): a livello B1 è meglio «secondo me / per me / a mio parere».",
          es: "Usar «penso che / credo che» (piden el congiuntivo, que es de B2): en B1 es mejor «secondo me / per me / a mio parere».",
        },
      ],
    },
  ],
  B2: [
    {
      id: "b2-lettera-formale",
      level: "B2",
      title: {
        it: "Email / lettera formale",
        es: "Email / carta formal",
      },
      whatIsIt: {
        it: "Un messaggio formale a una persona che non conosci o a un'istituzione (azienda, ufficio, professore): chiedere, reclamare, richiedere informazioni. Lunghezza: 80-100 parole.",
        es: "Un mensaje formal a alguien que no conocés o a una institución (empresa, oficina, profesor): pedir, reclamar, solicitar información. Extensión: 80-100 palabras.",
      },
      register: {
        it: "FORMALE. Si usa il «Lei», non il «tu». Si usa il condizionale di cortesia («Vorrei», non «Voglio»). Saluto e congedo formali.",
        es: "FORMAL. Se trata de «Lei» (usted), no de «tu». Se usa el condizionale de cortesía («Vorrei», no «Voglio»). Saludo y despedida formales.",
      },
      structure: {
        start: {
          it: "Saluto formale e motivo: «Gentile Signor/Signora… / Egregio Dottor…» + «Le scrivo in merito a…»",
          es: "Saludo formal y motivo: «Gentile Signor/Signora… / Egregio Dottor…» + «Le scrivo in merito a…»",
        },
        development: {
          it: "Esponi la questione con cortesia e con il condizionale: «Vorrei sapere… Le sarei grato/a se…»",
          es: "Exponé el asunto con cortesía y con el condicional: «Vorrei sapere… Le sarei grato/a se…»",
        },
        end: {
          it: "Formula di chiusura e congedo formale: «In attesa di una Sua risposta, La ringrazio. Distinti saluti,»",
          es: "Fórmula de cierre y despedida formal: «In attesa di una Sua risposta, La ringrazio. Distinti saluti,»",
        },
      },
      usefulPhrases: [
        "Gentile",
        "Egregio",
        "Le scrivo per",
        "in merito a",
        "Vorrei",
        "Le sarei grato/a se…",
        "In attesa di una Sua risposta",
        "La ringrazio",
        "Distinti saluti",
        "Cordiali saluti",
      ],
      modelExample:
        "Gentile Direttore, Le scrivo in merito al corso di italiano avanzato pubblicizzato sul vostro sito. Vorrei ricevere maggiori informazioni riguardo alle date d'inizio e ai costi d'iscrizione. Inoltre, Le sarei grata se potesse indicarmi se sono previste borse di studio per studenti stranieri. Sono molto interessata a partecipare, se gli orari sono compatibili con i miei impegni. In attesa di una Sua cortese risposta, La ringrazio per la disponibilità. Distinti saluti, Ana Pérez",
      commonMistakes: [
        {
          it: "Usare «tu / Caro» invece del registro formale («Lei / Gentile»).",
          es: "Usar «tu / Caro» en lugar del registro formal («Lei / Gentile»).",
        },
        {
          it: "Chiudere con «Ciao» invece di «Distinti saluti».",
          es: "Cerrar con «Ciao» en lugar de «Distinti saluti».",
        },
        {
          it: "Usare «Voglio» invece di «Vorrei».",
          es: "Usar «Voglio» en lugar de «Vorrei».",
        },
      ],
    },
    {
      id: "b2-testo-argomentativo",
      level: "B2",
      title: {
        it: "Testo argomentativo (opinione con vantaggi e svantaggi)",
        es: "Texto argumentativo (opinión con ventajas y desventajas)",
      },
      whatIsIt: {
        it: "Un testo in cui esprimi la tua opinione, confronti due opzioni o sviluppi vantaggi e svantaggi, e giustifichi la tua posizione. Lunghezza: 120-140 parole.",
        es: "Un texto donde exponés tu opinión, comparás dos opciones o desarrollás ventajas y desventajas, y justificás tu postura. Extensión: 120-140 palabras.",
      },
      register: {
        it: "Neutro/formale.",
        es: "Neutro/formal.",
      },
      structure: {
        start: {
          it: "Introduzione: presenta il tema: «Oggi si discute molto se… / Il tema di… è molto attuale.»",
          es: "Introducción: presentá el tema: «Oggi si discute molto se… / Il tema di… è molto attuale.»",
        },
        development: {
          it: "Sviluppo: i due lati e i tuoi argomenti: «Da un lato… dall'altro… / Un vantaggio è che… Tuttavia…»",
          es: "Desarrollo: los dos lados y tus argumentos: «Da un lato… dall'altro… / Un vantaggio è che… Tuttavia…»",
        },
        end: {
          it: "Conclusione: la tua posizione motivata: «In conclusione, ritengo che…»",
          es: "Conclusión: tu postura razonada: «In conclusione, ritengo che…»",
        },
      },
      usefulPhrases: [
        "Da un lato… dall'altro lato",
        "un vantaggio",
        "uno svantaggio",
        "Tuttavia",
        "D'altra parte",
        "Inoltre",
        "È vero che… ma…",
        "Ritengo che… (+ congiuntivo)",
        "In conclusione",
        "A mio avviso",
      ],
      modelExample:
        "Oggi si discute molto se sia meglio lavorare da casa o in ufficio. Entrambe le opzioni presentano vantaggi e svantaggi. Da un lato, lavorare da casa permette di risparmiare tempo negli spostamenti e di organizzare la giornata con più libertà. Dall'altro lato, il lavoro in ufficio favorisce i rapporti con i colleghi e una comunicazione più diretta. È vero che a casa si è più tranquilli, ma a volte è difficile concentrarsi. A mio avviso, la soluzione ideale sarebbe un sistema misto, che permetta di combinare i benefici di entrambe. In conclusione, ritengo che la flessibilità sia oggi la scelta migliore.",
      commonMistakes: [
        {
          it: "Dare l'opinione senza argomentare e senza esempi.",
          es: "Dar la opinión sin argumentar y sin ejemplos.",
        },
        {
          it: "Scrivere senza una struttura chiara (introduzione, sviluppo, conclusione).",
          es: "Escribir sin una estructura clara (introducción, desarrollo, conclusión).",
        },
        {
          it: "Dimenticare la posizione personale nella conclusione.",
          es: "Olvidar la postura personal en la conclusión.",
        },
      ],
    },
  ],
  C1: [
    {
      id: "c1-saggio-breve",
      level: "C1",
      title: {
        it: "Testo argomentativo / saggio breve",
        es: "Texto argumentativo / ensayo breve",
      },
      whatIsIt: {
        it: "Un testo argomentativo strutturato su un tema sociale o di attualità: presentare il problema, mostrare diverse prospettive, sviluppare argomenti con esempi e arrivare a una conclusione ragionata. Lunghezza: 160-180 parole.",
        es: "Un texto argumentativo estructurado sobre un tema social o de actualidad: presentar el problema, mostrar distintas perspectivas, desarrollar argumentos con ejemplos y llegar a una conclusión razonada. Extensión: 160-180 palabras.",
      },
      register: {
        it: "Formale e curato. Lessico preciso, connettivi vari.",
        es: "Formal y cuidado. Léxico preciso, conectores variados.",
      },
      structure: {
        start: {
          it: "Introduzione: presenta il tema e la sua rilevanza: «Negli ultimi anni si assiste a… / Il dibattito su… è sempre più attuale.»",
          es: "Introducción: presentá el tema y su relevancia: «Negli ultimi anni si assiste a… / Il dibattito su… è sempre più attuale.»",
        },
        development: {
          it: "Sviluppo (2-3 paragrafi): prospettive e argomenti con sfumature: «Da una parte… / Non bisogna dimenticare che… / Pur riconoscendo che…»",
          es: "Desarrollo (2-3 párrafos): perspectivas y argumentos con matices: «Da una parte… / Non bisogna dimenticare che… / Pur riconoscendo che…»",
        },
        end: {
          it: "Conclusione: sintesi e posizione: «Alla luce di quanto detto, si può affermare che…»",
          es: "Conclusión: síntesis y postura: «Alla luce di quanto detto, si può affermare che…»",
        },
      },
      usefulPhrases: [
        "Negli ultimi anni",
        "occorre considerare che",
        "pur + gerundio (pur riconoscendo)",
        "da una parte… dall'altra",
        "non bisogna dimenticare che",
        "di conseguenza",
        "sebbene",
        "benché (+ congiuntivo)",
        "alla luce di quanto detto",
        "in definitiva",
      ],
      modelExample:
        "Negli ultimi anni il ruolo della tecnologia nella vita dei giovani è diventato oggetto di un acceso dibattito. Se da una parte gli strumenti digitali offrono opportunità straordinarie di apprendimento e comunicazione, dall'altra sollevano non pochi interrogativi. Occorre considerare, infatti, che un uso eccessivo dei dispositivi può compromettere la capacità di concentrazione e i rapporti umani diretti. Pur riconoscendo i benefici dell'innovazione, non bisogna dimenticare che essa richiede un impiego consapevole. Sebbene molti sostengano che i giovani sappiano gestire autonomamente questi mezzi, sarebbe opportuno che le scuole promuovessero un'educazione digitale più solida. Alla luce di quanto detto, si può affermare che la tecnologia non rappresenti di per sé un pericolo, bensì uno strumento la cui utilità dipende dal modo in cui viene utilizzato. In definitiva, la vera sfida consiste nell'imparare a coniugare progresso e responsabilità.",
      commonMistakes: [
        {
          it: "Limitarsi a esprimere un'opinione senza articolare gli argomenti.",
          es: "Limitarse a expresar una opinión sin articular los argumentos.",
        },
        {
          it: "Usare connettivi troppo semplici (ma, però) invece di connettivi più elaborati.",
          es: "Usar conectores demasiado simples (ma, però) en lugar de conectores más elaborados.",
        },
        {
          it: "Trascurare la coesione tra i paragrafi.",
          es: "Descuidar la cohesión entre los párrafos.",
        },
      ],
    },
    {
      id: "c1-lettera-formale",
      level: "C1",
      title: {
        it: "Lettera formale / comunicazione formale",
        es: "Carta formal / comunicación formal",
      },
      whatIsIt: {
        it: "Una comunicazione formale più elaborata di quella di B2: lettera di presentazione, richiesta argomentata, reclamo dettagliato a un'istituzione. Lunghezza: 100-120 parole.",
        es: "Una comunicación formal más elaborada que la de B2: carta de presentación, solicitud argumentada, reclamo detallado a una institución. Extensión: 100-120 palabras.",
      },
      register: {
        it: "Formale, professionale/accademico.",
        es: "Formal, profesional/académico.",
      },
      structure: {
        start: {
          it: "Saluto formale e riferimento chiaro al motivo: «Egregio Dottor… / In riferimento a…»",
          es: "Saludo formal y referencia clara al motivo: «Egregio Dottor… / In riferimento a…»",
        },
        development: {
          it: "Esposizione ordinata e argomentata: «Mi permetto di sottolineare che… / Come avrà modo di constatare…»",
          es: "Exposición ordenada y argumentada: «Mi permetto di sottolineare che… / Come avrà modo di constatare…»",
        },
        end: {
          it: "Formula professionale di chiusura: «Confidando in un Suo riscontro… Distinti saluti,»",
          es: "Fórmula profesional de cierre: «Confidando in un Suo riscontro… Distinti saluti,»",
        },
      },
      usefulPhrases: [
        "Egregio/Gentile",
        "In riferimento a",
        "Con la presente",
        "Mi permetto di",
        "Le sarei grato/a qualora (+ congiuntivo)",
        "Come avrà modo di constatare",
        "Resto a Sua disposizione",
        "Confidando in un Suo riscontro",
        "Distinti saluti",
      ],
      modelExample:
        "Egregio Direttore, con la presente desidero sottoporre alla Sua attenzione la mia candidatura per il corso di alta formazione in traduzione letteraria. Laureata in Lingue e con un'esperienza pluriennale nell'insegnamento dell'italiano, ritengo che tale percorso rappresenti un'occasione preziosa per approfondire le mie competenze. Le sarei grata qualora potesse fornirmi ulteriori dettagli riguardo alle modalità di selezione e all'eventuale assegnazione di borse di studio. Resto a Sua completa disposizione per un colloquio conoscitivo. Confidando in un Suo cortese riscontro, porgo distinti saluti. Ana Pérez",
      commonMistakes: [
        {
          it: "Usare un registro troppo informale o colloquiale.",
          es: "Usar un registro demasiado informal o coloquial.",
        },
        {
          it: "Costruire frasi troppo brevi e sconnesse per una comunicazione formale.",
          es: "Construir frases demasiado cortas y desconectadas para una comunicación formal.",
        },
        {
          it: "Dimenticare la formula di chiusura professionale.",
          es: "Olvidar la fórmula de cierre profesional.",
        },
      ],
    },
  ],
  C2: [
    {
      id: "c2-saggio-complesso",
      level: "C2",
      title: {
        it: "Saggio argomentativo complesso",
        es: "Ensayo argumentativo complejo",
      },
      whatIsIt: {
        it: "Un saggio su un tema astratto o di dibattito, in cui non ci si limita ad argomentare: si sfumano le posizioni, si contrappongono le idee con finezza, si portano esempi e si arriva a una sintesi personale elaborata. Lunghezza: 200-250 parole.",
        es: "Un ensayo sobre un tema abstracto o de debate, donde no solo se argumenta: se matiza, se contraponen ideas con finura, se usan ejemplos y se llega a una síntesis personal elaborada. Extensión: 200-250 palabras.",
      },
      register: {
        it: "Formale e colto, con varietà stilistica e precisione lessicale.",
        es: "Formal y culto, con variedad estilística y precisión léxica.",
      },
      structure: {
        start: {
          it: "Introduzione: inquadra il tema in modo ampio, con una domanda o un paradosso: «Raramente un tema come… ha suscitato tanto dibattito quanto…»",
          es: "Introducción: enmarcá el tema con amplitud, con una pregunta o una paradoja: «Raramente un tema come… ha suscitato tanto dibattito quanto…»",
        },
        development: {
          it: "Sviluppo: tesi, antitesi e sfumature, con esempi e forte coesione: «Se è vero che… è altrettanto innegabile che… / Ciò non toglie che…»",
          es: "Desarrollo: tesis, antítesis y matices, con ejemplos y fuerte cohesión: «Se è vero che… è altrettanto innegabile che… / Ciò non toglie che…»",
        },
        end: {
          it: "Conclusione: una sintesi personale, non un semplice riassunto: «In ultima analisi, ciò che emerge è…»",
          es: "Conclusión: una síntesis personal, no un simple resumen: «In ultima analisi, ciò che emerge è…»",
        },
      },
      usefulPhrases: [
        "Raramente… quanto",
        "Se è vero che… è altrettanto vero che",
        "ciò non toglie che (+ congiuntivo)",
        "lungi dall'essere",
        "a ben guardare",
        "vale la pena sottolineare",
        "in ultima analisi",
        "non a caso",
        "per quanto (+ congiuntivo)",
      ],
      modelExample:
        "Raramente un concetto come quello di \"libertà\" ha attraversato la storia del pensiero suscitando interpretazioni tanto divergenti. Se è vero che ogni epoca ne ha rivendicato una propria definizione, è altrettanto innegabile che tale nozione resti sfuggente, quasi refrattaria a qualsiasi tentativo di sistematizzazione. A ben guardare, ciò che chiamiamo libertà non coincide quasi mai con l'assenza di vincoli: è piuttosto nella capacità di scegliere consapevolmente, pur dentro i limiti imposti dalla realtà, che essa trova la sua espressione più autentica. Lungi dall'essere un dato acquisito, la libertà si configura come una conquista continua, che richiede responsabilità e discernimento. Non a caso, i pensatori più lucidi ne hanno sempre sottolineato la natura paradossale: più la si insegue come pura indipendenza, più essa sembra sottrarsi. Ciò non toglie che aspirare a essa rimanga uno dei tratti più nobili dell'esperienza umana. In ultima analisi, ciò che emerge non è una definizione, bensì un invito: quello a interrogarsi, senza sosta, su ciò che davvero ci rende liberi.",
      commonMistakes: [
        {
          it: "Accumulare paroloni senza una reale coesione.",
          es: "Acumular palabras rebuscadas sin una cohesión real.",
        },
        {
          it: "Limitarsi a riassumere le posizioni senza una sintesi personale.",
          es: "Limitarse a resumir las posturas sin una síntesis personal.",
        },
        {
          it: "Perdere il filo logico in un testo lungo.",
          es: "Perder el hilo lógico en un texto largo.",
        },
      ],
    },
    {
      id: "c2-lettera-registro-elevato",
      level: "C2",
      title: {
        it: "Lettera / testo formale di registro elevato",
        es: "Carta / texto formal de registro elevado",
      },
      whatIsIt: {
        it: "Una comunicazione formale di alto registro: lettera istituzionale, argomentazione formale persuasiva, un testo in cui ciò che si valuta è il dominio del registro e della sfumatura. Lunghezza: 120-150 parole.",
        es: "Una comunicación formal de alto registro: carta institucional, argumentación formal persuasiva, un texto donde lo que se evalúa es el dominio del registro y del matiz. Extensión: 120-150 palabras.",
      },
      register: {
        it: "Formale elevato, persuasivo, impeccabilmente coeso.",
        es: "Formal elevado, persuasivo, impecablemente cohesionado.",
      },
      structure: {
        start: {
          it: "Apertura formale precisa, con il motivo inquadrato: «Mi pregio di rivolgermi a Lei in qualità di…»",
          es: "Apertura formal precisa, con el motivo enmarcado: «Mi pregio di rivolgermi a Lei in qualità di…»",
        },
        development: {
          it: "Argomentazione persuasiva e articolata: «Consapevole dell'importanza che… / Mi permetto di far presente che…»",
          es: "Argumentación persuasiva y articulada: «Consapevole dell'importanza che… / Mi permetto di far presente che…»",
        },
        end: {
          it: "Formula elevata di chiusura: «Nell'auspicio di un positivo riscontro, Le porgo i miei più cordiali saluti.»",
          es: "Fórmula elevada de cierre: «Nell'auspicio di un positivo riscontro, Le porgo i miei più cordiali saluti.»",
        },
      },
      usefulPhrases: [
        "Mi pregio di",
        "in qualità di",
        "Consapevole di / che",
        "Mi permetto di far presente che",
        "Sarebbe mia premura",
        "qualora Ella ritenesse opportuno",
        "Nell'auspicio di",
        "Voglia gradire (registro molto alto, quasi cerimonioso)",
        "i miei più distinti saluti",
      ],
      modelExample:
        "Egregio Presidente, mi pregio di rivolgermi a Lei in qualità di rappresentante dell'Associazione dei Docenti di Italiano, al fine di sottoporre alla Sua attenzione una proposta che riteniamo di sicuro interesse. Consapevoli dell'impegno che codesta istituzione dedica alla promozione della lingua e della cultura italiane, ci permettiamo di far presente l'opportunità di istituire un programma di scambio rivolto ai giovani studenti stranieri. Sarebbe nostra premura fornire ogni dettaglio operativo, qualora Ella ritenesse la proposta meritevole di approfondimento. Certi che tale iniziativa possa rappresentare un arricchimento reciproco, restiamo in attesa di un Suo cortese riscontro. Nell'auspicio di una fattiva collaborazione, Le porgiamo i nostri più distinti saluti. Ana Pérez",
      commonMistakes: [
        {
          it: "Scadere in un registro burocratico o arcaico fuori luogo.",
          es: "Caer en un registro burocrático o arcaico fuera de lugar.",
        },
        {
          it: "Mescolare formule di registri diversi.",
          es: "Mezclar fórmulas de registros distintos.",
        },
        {
          it: "Usare «Voglia gradire» o simili in contesti che non lo richiedono.",
          es: "Usar «Voglia gradire» o fórmulas similares en contextos que no las requieren.",
        },
      ],
    },
  ],
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
