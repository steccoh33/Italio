// Documentos legales de Italio. Texto fijo, en español (normativa argentina):
// no pasa por next-intl ni por IA. Si se modifica el contenido, actualizar
// LEGAL_LAST_UPDATED.

export const LEGAL_LAST_UPDATED = "26 de septiembre de 2026";

// Versión de los documentos (AAAA-MM-DD). Se guarda en profiles.terms_version
// al registrarse. Cambiarla junto con LEGAL_LAST_UPDATED.
export const LEGAL_VERSION = "2026-09-26";

export type LegalSection = {
  number: string;
  /** Encabezado corto que abre el párrafo (se muestra en negrita). */
  title: string;
  body?: string;
  /** Subpuntos (4.1, 4.2, …) o incisos que se muestran como lista. */
  items?: { number: string; text: string }[];
};

export type LegalDocument = {
  title: string;
  sections: LegalSection[];
  closing?: { title: string; body: string };
};

export const TERMS: LegalDocument = {
  title: "Términos y Condiciones de Uso — Italio",
  sections: [
    {
      number: "1",
      title: "Responsable.",
      body: 'La plataforma Italio es operada por Pedro Hernán Stecco Galleguillo (en adelante, "el Responsable"), Bariloche, Río Negro, Argentina. Contacto: steccoh88@gmail.com',
    },
    {
      number: "2",
      title: "Qué es Italio.",
      body: "Italio es una plataforma educativa para practicar y mejorar la escritura en italiano y prepararse para certificaciones de idioma (como CILS y PLIDA), mediante corrección orientada al nivel del usuario, ejercicios y herramientas de seguimiento para docentes. Es una herramienta de apoyo al aprendizaje.",
    },
    {
      number: "3",
      title: "Naturaleza de las correcciones.",
      body: "Las correcciones, veredictos de nivel y ejercicios de Italio son generados mediante inteligencia artificial y tienen carácter meramente orientativo. No sustituyen la evaluación de un docente ni constituyen un resultado oficial de ninguna certificación, y pueden contener errores. El juicio final sobre el nivel y la preparación de un alumno corresponde exclusivamente a su docente.",
    },
    {
      number: "4",
      title: "Usuarios y registro.",
      items: [
        {
          number: "4.1",
          text: "Docentes: se registran y su cuenta debe ser aprobada por el administrador. Cada docente recibe un código para compartir con sus alumnos.",
        },
        {
          number: "4.2",
          text: "Alumnos: se registran con el código de su docente y su cuenta debe ser aprobada por él.",
        },
        {
          number: "4.3",
          text: "Alumnos particulares (fuera de una institución educativa): el registro está reservado exclusivamente a personas mayores de 18 años. Al registrarse, el usuario declara bajo su responsabilidad ser mayor de edad; el Responsable no está obligado a verificar esta declaración y no responde por su falsedad.",
        },
        {
          number: "4.4",
          text: "Alumnos menores de edad: solo pueden utilizar Italio en el marco de una institución educativa o de clases a cargo de un docente responsable, conforme al punto 6.",
        },
      ],
    },
    {
      number: "5",
      title: "Código de acceso.",
      body: "El acceso se realiza mediante un código personal e intransferible. El usuario es responsable de mantenerlo en reserva y del uso que se haga con él.",
    },
    {
      number: "6",
      title:
        "Menores de edad y responsabilidad del docente o institución.",
      body: "Italio puede ser utilizado por alumnos menores de edad únicamente a través de una institución educativa o de un docente responsable, que actúa como intermediario y responsable frente a las familias. La institución o el docente que incorpora a un alumno menor declara y garantiza contar con la autorización de los padres, madres o tutores para el tratamiento de los datos del menor con fines educativos, conforme a la Ley N.° 25.326 y al principio del interés superior del niño. La obtención, validez y conservación de dicha autorización son responsabilidad exclusiva de la institución o del docente, y no del Responsable de la plataforma. El Responsable pone a disposición un modelo de autorización a título de mera colaboración, sin que ello implique asumir responsabilidad por su gestión.",
    },
    {
      number: "7",
      title: "Finalidad educativa y no comercial.",
      body: "Los datos y los textos de los alumnos se utilizan exclusivamente con fines educativos. No se utilizan con fines comerciales, publicitarios ni de perfilado, ni se ceden ni divulgan a terceros con esos fines.",
    },
    {
      number: "8",
      title: "Obligaciones del usuario.",
      body: "El usuario se compromete a: (a) usar Italio de buena fe y con fines educativos; (b) no cargar en sus textos datos personales sensibles ni información innecesaria; (c) no cargar contenido ilícito, ofensivo o que infrinja derechos de terceros; (d) no usar la plataforma de forma que perjudique a otros usuarios, al servicio o a terceros.",
    },
    {
      number: "9",
      title: "Contenido cargado por los usuarios.",
      body: "Los textos y contenidos que los usuarios cargan en Italio son de su exclusiva responsabilidad. El Responsable no controla previamente dichos contenidos y no responde por ellos ni por los datos que los usuarios decidan incluir en sus producciones.",
    },
    {
      number: "10",
      title: "Disponibilidad.",
      body: "El Responsable procura mantener el servicio disponible, pero no garantiza su funcionamiento ininterrumpido, libre de errores o de interrupciones. La plataforma puede sufrir cambios, suspensiones o discontinuidad, sin que ello genere responsabilidad ni derecho a indemnización.",
    },
    {
      number: "11",
      title: "Limitación de responsabilidad.",
      body: 'Italio se ofrece "tal cual" y "según disponibilidad", como herramienta de apoyo al aprendizaje, sin garantías de ningún tipo. En la máxima medida permitida por la ley, el Responsable no será responsable por daños directos ni indirectos derivados de: el uso o la imposibilidad de uso de la plataforma; errores en las correcciones o devoluciones automáticas; decisiones adoptadas únicamente sobre la base de dichas devoluciones; el uso indebido de la plataforma por parte de terceros; ni el contenido o los datos que los usuarios carguen.',
    },
    {
      number: "12",
      title: "Indemnidad.",
      body: "El usuario (y, en el caso de menores, la institución o el docente que lo incorpora) se compromete a mantener indemne al Responsable frente a cualquier reclamo, daño, sanción o gasto —incluidos honorarios legales— que derive del incumplimiento de estos Términos, del uso indebido de la plataforma, de la falta de autorización de los padres o tutores de un alumno menor, o de la carga de contenido o datos en infracción a la ley o a derechos de terceros.",
    },
    {
      number: "13",
      title: "Modificaciones.",
      body: "El Responsable puede modificar estos Términos; los cambios se publicarán en esta página.",
    },
    {
      number: "14",
      title: "Ley aplicable y jurisdicción.",
      body: "Estos Términos se rigen por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a los tribunales ordinarios competentes de la ciudad de San Carlos de Bariloche, Provincia de Río Negro.",
    },
  ],
  closing: {
    title: "Aceptación.",
    body: "Al registrarse y utilizar Italio, el usuario declara haber leído y aceptado estos Términos y Condiciones y la Política de Privacidad.",
  },
};

export const PRIVACY: LegalDocument = {
  title: "Política de Privacidad — Italio",
  sections: [
    {
      number: "1",
      title: "Responsable del tratamiento.",
      body: "Pedro Hernán Stecco Galleguillo, Bariloche, Río Negro, Argentina. Contacto: steccoh88@gmail.com",
    },
    {
      number: "2",
      title: "Datos que recogemos.",
      body: "Nombre y apellido del usuario; su rol (alumno, docente o administrador); el nivel de italiano que desea alcanzar; y, en el caso de los alumnos, los textos que escriben en la plataforma junto con sus correcciones, los ejercicios realizados y la clase a la que pertenecen. Italio no solicita correo electrónico ni contraseña: el acceso se realiza mediante un código personal. No recogemos datos sensibles.",
    },
    {
      number: "3",
      title: "Finalidad.",
      body: "Los datos se tratan con una única finalidad educativa: (a) corregir los textos de los alumnos y darles devolución según su nivel; (b) permitir que su docente haga el seguimiento de su progreso mediante estadísticas e informes. No se usan con fines comerciales, publicitarios ni de perfilado.",
    },
    {
      number: "4",
      title: "Consentimiento.",
      body: "Conforme al artículo 5 de la Ley N.° 25.326, el tratamiento se realiza con el consentimiento libre, expreso e informado del titular, que se presta al aceptar esta Política y los Términos al registrarse. En el caso de alumnos menores de edad, el consentimiento es prestado por sus padres, madres o tutores, gestionado a través de la institución educativa o el docente responsable.",
    },
    {
      number: "5",
      title: "Procesamiento mediante inteligencia artificial.",
      body: "Para corregir los textos y generar ejercicios, Italio los procesa a través del servicio de inteligencia artificial de Google (Gemini). El texto del alumno se envía a Google para su procesamiento, sujeto a las políticas de privacidad de Google; no se envían junto con el texto el nombre ni otros datos identificatorios del alumno.",
    },
    {
      number: "6",
      title: "Quién accede a los datos.",
      body: "Cada alumno accede solo a sus propios datos. Cada docente accede únicamente a los datos de sus propios alumnos. El administrador gestiona las cuentas de los docentes. Ningún usuario puede acceder a datos de alumnos que no le corresponden.",
    },
    {
      number: "7",
      title: "Almacenamiento y seguridad.",
      body: "Los datos se almacenan de forma segura en servidores de Supabase, con medidas de seguridad que restringen el acceso a personas no autorizadas.",
    },
    {
      number: "8",
      title: "Derechos del titular (habeas data).",
      body: "Conforme a la Ley N.° 25.326, el titular (o sus padres/tutores, en el caso de menores) tiene derecho a acceder, rectificar, actualizar y suprimir sus datos, y a revocar el consentimiento en cualquier momento. Para ejercerlos, escribir a steccoh88@gmail.com. La autoridad de control es la Agencia de Acceso a la Información Pública (AAIP), ante la cual el titular puede presentar reclamos.",
    },
    {
      number: "9",
      title: "Conservación.",
      body: "Los datos se conservan mientras la cuenta esté activa y sean necesarios para la finalidad educativa. El usuario puede solicitar su eliminación en cualquier momento.",
    },
    {
      number: "10",
      title: "Cambios.",
      body: "Esta política puede actualizarse; los cambios se publicarán en esta página.",
    },
  ],
};
