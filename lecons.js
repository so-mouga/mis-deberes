// Les leçons. Chaque leçon = des cromos à gagner + une liste d'étapes.
// Types d'étapes : descubre, toca, elige, letras (palier 1-3), papa, cuaderno (dictee + tirage pour une dictée), palitos, problema.
// Un « item » : { img } (dessin) ou { texte } (nombre, mot), + nom (ce qu'on lit) et voz (ce qu'on dit).

const NOMBRES_FR = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt",
  "vingt et un", "vingt-deux", "vingt-trois", "vingt-quatre", "vingt-cinq", "vingt-six", "vingt-sept",
  "vingt-huit", "vingt-neuf", "trente", "trente et un"];
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const JOURS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const DIAS_ES = ["el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado", "el domingo"];
const nombre = (n) => ({ texte: String(n), nom: NOMBRES_FR[n], voz: NOMBRES_FR[n] });
const NUMEROS_ES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
  "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete",
  "veintiocho", "veintinueve", "treinta", "treinta y uno"];
const COLORES = [["rouge", "rojo"], ["bleu", "azul"], ["jaune", "amarillo"], ["vert", "verde"], ["orange", "naranja"], ["rose", "rosa"],
  ["violet", "morado"], ["noir", "negro"], ["blanc", "blanco"], ["marron", "marrón"], ["gris", "gris"]];
const SAISONS = [["printemps", "le printemps"], ["ete", "l'été"], ["automne", "l'automne"], ["hiver", "l'hiver"]];

const LECONS = {
  "en-examen": {
    titre: "Inglés · Examen del jueves",
    court: "Inglés · examen",
    sujet: "Unit 2 · Home (examen)",
    unidad: "Unit 2",
    mezcla: true, // tout mélangé : seulement la veille et le jour de l'examen
    langue: "en-GB",
    cromos: ["house", "flat", "attic", "cellar", "garage", "chimney"].map((m) => ({ img: m, nom: m })),
    etapes: [
      { type: "descubre", consigne: "Mira y escucha", items: [
        { img: "house", nom: "house", es: "la casa", voz: "house" },
        { img: "flat", nom: "flat", es: "el piso", voz: "flat" },
        { img: "attic", nom: "attic", es: "el ático, arriba del todo", voz: "attic" },
        { img: "cellar", nom: "cellar", es: "el sótano, debajo de la casa", voz: "cellar" },
        { img: "garage", nom: "garage", es: "el garaje", voz: "garage" },
        { img: "chimney", nom: "chimney", es: "la chimenea, en el tejado", voz: "chimney" },
      ] },
      { type: "toca", consigne: "Escucha y toca el dibujo", n: 6,
        items: ["house", "flat", "attic", "cellar", "garage", "chimney"].map((m) => ({ img: m, nom: m, voz: m })) },
      { type: "elige", consigne: "What's this? · ¿Qué es?", questions: [
        { img: "attic", q: "What's this?", bonne: "attic", autres: ["cellar", "chimney"] },
        { img: "cellar", q: "What's this?", bonne: "cellar", autres: ["attic", "garage"] },
        { img: "chimney", q: "What's this?", bonne: "chimney", autres: ["house", "attic"] },
      ] },
      { type: "vrai", consigne: "Where's mum? · ¿Es verdad?", questions: [
        { casa: "kitchen", phrase: "She's in the kitchen.", vrai: true },
        { casa: "bathroom", phrase: "She's in the bedroom.", vrai: false, correction: "She isn't in the bedroom. She's in the bathroom." },
        { casa: "living room", phrase: "She isn't in the kitchen.", vrai: true },
        { casa: "bedroom", phrase: "She isn't in the bedroom.", vrai: false, correction: "She's in the bedroom!" },
      ] },
      { type: "letras", consigne: "Completa la palabra", mots: [
        { item: { img: "attic" }, mot: "attic", trous: "a_t_c" },
        { item: { img: "cellar" }, mot: "cellar", trous: "c_ll_r" },
        { item: { img: "garage" }, mot: "garage", trous: "g_r_ge" },
        { item: { img: "chimney" }, mot: "chimney", trous: "ch_mn_y" },
      ] },
      { type: "papa", questions: [
        { q: "Where's mum?", item: { casa: "kitchen" }, r: "She's in the kitchen." },
        { q: "Where's mum?", item: { casa: "bedroom" }, r: "She's in the bedroom." },
        { q: "Is mum in the bathroom?", item: { casa: "living room" }, r: "No, she isn't in the bathroom. She's in the living room." },
        { q: "¿Cómo se dice «el sótano» en inglés?", r: "cellar" },
        { q: "¿Cómo se dice «el ático» en inglés?", r: "attic" },
      ] },
      { type: "cuaderno", consigne: "Escribe en tu cuaderno", voz: "Escribe estas seis palabras en tu cuaderno, como en el examen. Despacio, con letra bonita.",
        items: ["house", "flat", "attic", "cellar", "garage", "chimney"].map((m) => ({ img: m, nom: m })) },
    ],
  },

  // ---------- Francés (26 nov. 2026, d'après Blanca) ----------
  // À l'écrit : les nombres de 1 à 31 et les couleurs. À l'oral : les jours, les mois, les saisons.
  // Écrire va par paliers : 1 lettre, la moitié, le mot entier (6 lettres au plus), puis une dictée au cahier.

  "fr-numeros-1": {
    titre: "Francés · Números del 1 al 10",
    court: "Francés · 1 a 10",
    sujet: "Escribir los números del 1 al 10",
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "descubre", consigne: "Los números del 1 al 10", items: Array.from({ length: 10 }, (_, i) => ({ ...nombre(i + 1), es: NUMEROS_ES[i + 1] })) },
      { type: "toca", consigne: "Escucha y toca el número", n: 5, proches: true, items: Array.from({ length: 10 }, (_, i) => nombre(i + 1)) },
      { type: "letras", palier: 1, consigne: "Completa la palabra", mots: [
        { item: { texte: "2" }, mot: "deux", trous: "de_x" },
        { item: { texte: "3" }, mot: "trois", trous: "tro_s" },
        { item: { texte: "4" }, mot: "quatre", trous: "quat_e" },
      ] },
      { type: "letras", palier: 2, consigne: "Completa la palabra", mots: [
        { item: { texte: "5" }, mot: "cinq", trous: "c__q" },
        { item: { texte: "7" }, mot: "sept", trous: "s__t" },
        { item: { texte: "9" }, mot: "neuf", trous: "n__f" },
      ] },
      { type: "letras", palier: 3, consigne: "Escribe la palabra entera", mots: [
        { item: { texte: "6" }, mot: "six", trous: "___" },
        { item: { texte: "8" }, mot: "huit", trous: "____" },
        { item: { texte: "10" }, mot: "dix", trous: "___" },
      ] },
      { type: "papa", questions: [
        { q: "¿Cómo se dice este número en francés?", item: { texte: "3" }, r: "trois" },
        { q: "¿Cómo se dice este número en francés?", item: { texte: "8" }, r: "huit" },
        { q: "¿Cómo se dice este número en francés?", item: { texte: "5" }, r: "cinq" },
        { q: "Cuenta del 1 al 10 en francés.", r: "un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix" },
      ] },
      { type: "cuaderno", dictee: true, tirage: 4, consigne: "Dictado en tu cuaderno",
        voz: "Dictado. Escucha cada número y escríbelo en letras en tu cuaderno, sin mirar.",
        items: Array.from({ length: 10 }, (_, i) => nombre(i + 1)) },
    ],
  },

  "fr-numeros-2": {
    titre: "Francés · Números del 11 al 20",
    court: "Francés · 11 a 20",
    sujet: "Escribir los números del 11 al 20",
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "descubre", consigne: "Los números del 11 al 20", items: Array.from({ length: 10 }, (_, i) => ({ ...nombre(i + 11), es: NUMEROS_ES[i + 11] })) },
      { type: "toca", consigne: "Escucha y toca el número", n: 5, proches: true, items: Array.from({ length: 20 }, (_, i) => nombre(i + 1)),
        cibles: Array.from({ length: 10 }, (_, i) => nombre(i + 11)) },
      { type: "letras", palier: 1, consigne: "Completa la palabra", mots: [
        { item: { texte: "11" }, mot: "onze", trous: "on_e" },
        { item: { texte: "14" }, mot: "quatorze", trous: "quat_rze" },
        { item: { texte: "18" }, mot: "dix-huit", trous: "dix-h_it" },
      ] },
      { type: "letras", palier: 2, consigne: "Completa la palabra", mots: [
        { item: { texte: "12" }, mot: "douze", trous: "d__ze" },
        { item: { texte: "15" }, mot: "quinze", trous: "qu__ze" },
        { item: { texte: "19" }, mot: "dix-neuf", trous: "d_x-n__f" },
      ] },
      { type: "letras", palier: 3, consigne: "Escribe la palabra entera", mots: [
        { item: { texte: "16" }, mot: "seize", trous: "_____" },
        { item: { texte: "13" }, mot: "treize", trous: "______" },
        { item: { texte: "20" }, mot: "vingt", trous: "_____" },
      ] },
      { type: "papa", questions: [
        { q: "¿Cómo se dice este número en francés?", item: { texte: "17" }, r: "dix-sept" },
        { q: "¿Cómo se dice este número en francés?", item: { texte: "14" }, r: "quatorze" },
        { q: "¿Cómo se dice este número en francés?", item: { texte: "12" }, r: "douze" },
        { q: "Cuenta del 11 al 15 en francés.", r: "onze, douze, treize, quatorze, quinze" },
        { q: "Cuenta del 16 al 20 en francés.", r: "seize, dix-sept, dix-huit, dix-neuf, vingt" },
      ] },
      { type: "cuaderno", dictee: true, tirage: 4, consigne: "Dictado en tu cuaderno",
        voz: "Dictado. Escucha cada número y escríbelo en letras en tu cuaderno, sin mirar.",
        items: Array.from({ length: 10 }, (_, i) => nombre(i + 11)) },
    ],
  },

  "fr-numeros-3": {
    titre: "Francés · Números del 21 al 31",
    court: "Francés · 21 a 31",
    sujet: "Escribir los números del 21 al 31",
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "descubre", consigne: "Vingt + un número que ya sabes", items: Array.from({ length: 11 }, (_, i) => ({ ...nombre(i + 21), es: NUMEROS_ES[i + 21] })) },
      { type: "toca", consigne: "Escucha y toca el número", n: 5, proches: true, items: Array.from({ length: 31 }, (_, i) => nombre(i + 1)),
        cibles: Array.from({ length: 11 }, (_, i) => nombre(i + 21)) },
      { type: "letras", palier: 1, consigne: "Completa la palabra", mots: [
        { item: { texte: "22" }, mot: "vingt-deux", trous: "vingt-d_ux" },
        { item: { texte: "23" }, mot: "vingt-trois", trous: "vingt-tro_s" },
        { item: { texte: "30" }, mot: "trente", trous: "tr_nte" },
      ] },
      { type: "letras", palier: 2, consigne: "Completa la palabra", mots: [
        { item: { texte: "21" }, mot: "vingt et un", trous: "v__gt _t un" },
        { item: { texte: "25" }, mot: "vingt-cinq", trous: "v__gt-c__q" },
        { item: { texte: "31" }, mot: "trente et un", trous: "tr__te _t un" },
      ] },
      { type: "letras", palier: 3, consigne: "Escribe la palabra entera", mots: [
        { item: { texte: "26" }, mot: "vingt-six", trous: "vingt-___" },
        { item: { texte: "28" }, mot: "vingt-huit", trous: "_____-huit" },
        { item: { texte: "30" }, mot: "trente", trous: "______" },
      ] },
      { type: "papa", questions: [
        { q: "¿Cómo se dice este número en francés?", item: { texte: "21" }, r: "vingt et un" },
        { q: "¿Cómo se dice este número en francés?", item: { texte: "27" }, r: "vingt-sept" },
        { q: "¿Cómo se dice este número en francés?", item: { texte: "31" }, r: "trente et un" },
        { q: "Cuenta del 21 al 25 en francés.", r: "vingt et un, vingt-deux, vingt-trois, vingt-quatre, vingt-cinq" },
        { q: "Cuenta del 26 al 31 en francés.", r: "vingt-six, vingt-sept, vingt-huit, vingt-neuf, trente, trente et un" },
      ] },
      { type: "cuaderno", dictee: true, tirage: 4, consigne: "Dictado en tu cuaderno",
        voz: "Dictado. Escucha cada número y escríbelo en letras en tu cuaderno, sin mirar.",
        items: Array.from({ length: 11 }, (_, i) => nombre(i + 21)) },
    ],
  },

  "fr-colores": {
    titre: "Francés · Los colores",
    court: "Francés · colores",
    sujet: "Escribir los colores",
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "descubre", consigne: "Los colores", items: COLORES.map(([fr, es]) => ({ img: "c-" + fr, nom: fr, es, voz: fr })) },
      { type: "toca", consigne: "Escucha y toca el color", n: 5, items: COLORES.map(([fr]) => ({ img: "c-" + fr, voz: fr })) },
      { type: "letras", palier: 1, consigne: "Completa la palabra", mots: [
        { item: { img: "c-rouge" }, mot: "rouge", trous: "ro_ge" },
        { item: { img: "c-noir" }, mot: "noir", trous: "no_r" },
        { item: { img: "c-blanc" }, mot: "blanc", trous: "bl_nc" },
      ] },
      { type: "letras", palier: 2, consigne: "Completa la palabra", mots: [
        { item: { img: "c-jaune" }, mot: "jaune", trous: "j__ne" },
        { item: { img: "c-orange" }, mot: "orange", trous: "o_a_g_" },
        { item: { img: "c-marron" }, mot: "marron", trous: "m_rr_n" },
      ] },
      { type: "letras", palier: 3, consigne: "Escribe la palabra entera", mots: [
        { item: { img: "c-vert" }, mot: "vert", trous: "____" },
        { item: { img: "c-bleu" }, mot: "bleu", trous: "____" },
        { item: { img: "c-gris" }, mot: "gris", trous: "____" },
      ] },
      { type: "papa", questions: [
        { q: "¿De qué color es? En francés.", item: { img: "c-jaune" }, r: "jaune" },
        { q: "¿De qué color es? En francés.", item: { img: "c-violet" }, r: "violet" },
        { q: "¿De qué color es? En francés.", item: { img: "c-rose" }, r: "rose" },
        { q: "¿De qué color es tu camiseta? En francés.", r: "… (el color de su camiseta)" },
      ] },
      { type: "cuaderno", dictee: true, tirage: 4, consigne: "Dictado en tu cuaderno",
        voz: "Dictado. Escucha cada color y escríbelo en tu cuaderno, sin mirar.",
        items: COLORES.map(([fr]) => ({ img: "c-" + fr, nom: fr, voz: fr })) },
    ],
  },

  "fr-semana": {
    titre: "Francés · Los días de la semana",
    court: "Francés · días",
    sujet: "Los días de la semana (oral)",
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "descubre", consigne: "Los siete días", items: JOURS_FR.map((j, i) => ({ texte: j, nom: j, es: DIAS_ES[i], voz: j })) },
      { type: "toca", consigne: "Escucha y toca el día", n: 5, items: JOURS_FR.map((j) => ({ texte: j, voz: j })) },
      { type: "elige", consigne: "El tren de los días", questions: [1, 3, 4, 6].map((i) => ({
        wagons: JOURS_FR.slice(i - 2 < 0 ? 0 : i - 2, i),
        q: `Después de ${JOURS_FR[i - 1]}, ¿qué día viene?`,
        dire: [["Después de", "es-ES"], [JOURS_FR[i - 1], "fr-FR", .8], ["¿qué día viene?", "es-ES"]],
        bonne: JOURS_FR[i],
        autres: [JOURS_FR[(i + 2) % 7], JOURS_FR[(i + 4) % 7]],
      })) },
      { type: "elige", consigne: "¿Cómo se dice en francés?", questions: [
        { q: "¿Cómo se dice «miércoles»?", bonne: "mercredi", autres: ["mardi", "vendredi"] },
        { q: "¿Cómo se dice «viernes»?", bonne: "vendredi", autres: ["mercredi", "samedi"] },
        { q: "¿Cómo se dice «domingo»?", bonne: "dimanche", autres: ["lundi", "jeudi"] },
      ] },
      { type: "papa", questions: [
        { q: "Di los días de la semana en francés, en orden.", r: "lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche" },
        { q: "¿Qué día es hoy? Dilo en francés.", r: "aujourd'hui, c'est … (el día de hoy)" },
        { q: "¿Qué días no hay cole? En francés.", r: "samedi et dimanche" },
        { q: "¿Cómo se dice «lunes» en francés?", r: "lundi" },
        { q: "¿Cómo se dice «jueves» en francés?", r: "jeudi" },
      ] },
    ],
  },

  "fr-meses": {
    titre: "Francés · Los meses",
    court: "Francés · meses",
    sujet: "Los doce meses (oral)",
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "descubre", consigne: "Los doce meses", items: MOIS_FR.map((m, i) => ({ texte: m, nom: m, es: MESES_ES[i], voz: m })) },
      { type: "toca", consigne: "Escucha y toca el mes", n: 5, items: MOIS_FR.map((m) => ({ texte: m, voz: m })) },
      { type: "elige", consigne: "El tren de los meses", tren: true, questions: [2, 5, 8, 11].map((i) => ({
        wagons: MOIS_FR.slice(i - 2, i),
        q: `Después de ${MOIS_FR[i - 1]}, ¿qué mes viene?`,
        dire: [[`Después de`, "es-ES"], [MOIS_FR[i - 1], "fr-FR", .8], ["¿qué mes viene?", "es-ES"]],
        bonne: MOIS_FR[i],
        autres: [MOIS_FR[(i + 2) % 12], MOIS_FR[(i + 5) % 12]],
      })) },
      { type: "elige", consigne: "¿Cómo se dice en francés?", questions: [
        { q: "¿Cómo se dice «marzo»?", bonne: "mars", autres: ["mai", "avril"] },
        { q: "¿Cómo se dice «julio»?", bonne: "juillet", autres: ["juin", "janvier"] },
        { q: "¿Cómo se dice «agosto»?", bonne: "août", autres: ["avril", "octobre"] },
      ] },
      { type: "papa", questions: [
        { q: "Di los meses de enero a junio en francés.", r: "janvier, février, mars, avril, mai, juin" },
        { q: "Di los meses de julio a diciembre en francés.", r: "juillet, août, septembre, octobre, novembre, décembre" },
        { q: "¿En qué mes es Navidad? En francés.", r: "décembre" },
        { q: "¿En qué mes es tu cumpleaños? En francés.", r: "… (el mes de su cumpleaños)" },
        { q: "¿Cómo se dice «enero» en francés?", r: "janvier" },
      ] },
    ],
  },

  "fr-calendario": {
    titre: "Francés · Las estaciones",
    court: "Francés · estaciones",
    sujet: "Las cuatro estaciones (oral)",
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "descubre", consigne: "Las cuatro estaciones", items: [
        { img: "printemps", nom: "le printemps", es: "la primavera", voz: "le printemps" },
        { img: "ete", nom: "l'été", es: "el verano", voz: "l'été" },
        { img: "automne", nom: "l'automne", es: "el otoño", voz: "l'automne" },
        { img: "hiver", nom: "l'hiver", es: "el invierno", voz: "l'hiver" },
      ] },
      { type: "toca", consigne: "Escucha y toca la estación", n: 4, items: SAISONS.map(([img, voz]) => ({ img, voz })) },
      { type: "elige", consigne: "¿Qué estación es?", questions: [
        { img: "hiver", q: "¿Qué estación es?", bonne: "l'hiver", autres: ["l'été", "le printemps"] },
        { img: "printemps", q: "¿Qué estación es?", bonne: "le printemps", autres: ["l'automne", "l'hiver"] },
        { img: "ete", q: "¿Qué estación es?", bonne: "l'été", autres: ["l'hiver", "l'automne"] },
      ] },
      { type: "elige", consigne: "El tren de las estaciones", questions: [1, 2, 3].map((i) => ({
        wagons: SAISONS.slice(0, i).map(([, v]) => v),
        q: `Después de ${SAISONS[i - 1][1]}, ¿qué estación viene?`,
        dire: [["Después de", "es-ES"], [SAISONS[i - 1][1], "fr-FR", .8], ["¿qué estación viene?", "es-ES"]],
        bonne: SAISONS[i][1],
        autres: SAISONS.filter((_, k) => k !== i && k !== i - 1).map(([, v]) => v),
      })).map((q) => ({ ...q, wagons: q.wagons.slice(-2) })) },
      { type: "papa", questions: [
        { q: "Di las cuatro estaciones en francés.", r: "le printemps, l'été, l'automne, l'hiver" },
        { q: "¿En qué estación hace mucho frío? En francés.", r: "l'hiver" },
        { q: "¿En qué estación vamos a la playa? En francés.", r: "l'été" },
        { q: "¿En qué estación caen las hojas? En francés.", item: { img: "automne" }, r: "l'automne" },
      ] },
    ],
  },

  "fr-examen": {
    titre: "Francés · Examen",
    court: "Francés · examen",
    sujet: "Todo mezclado: números, colores, días, meses y estaciones",
    mezcla: true, // tout mélangé : seulement la veille et le jour de l'examen
    langue: "fr-FR",
    cromos: [],
    etapes: [
      { type: "toca", consigne: "Escucha y toca el número", n: 5, proches: true, items: Array.from({ length: 31 }, (_, i) => nombre(i + 1)),
        cibles: [12, 13, 14, 15, 16, 21, 24, 27, 31].map(nombre) },
      { type: "toca", consigne: "Escucha y toca el color", n: 3, items: COLORES.map(([fr]) => ({ img: "c-" + fr, voz: fr })) },
      { type: "letras", palier: 2, consigne: "Completa la palabra", mots: [
        { item: { texte: "14" }, mot: "quatorze", trous: "qua_or_e" },
        { item: { texte: "21" }, mot: "vingt et un", trous: "v__gt et un" },
        { item: { img: "c-jaune" }, mot: "jaune", trous: "j__ne" },
        { item: { texte: "16" }, mot: "seize", trous: "s__ze" },
      ] },
      { type: "elige", consigne: "El tren", questions: [
        { wagons: ["lundi", "mardi"], q: "Después de mardi, ¿qué día viene?", dire: [["Después de", "es-ES"], ["mardi", "fr-FR", .8], ["¿qué día viene?", "es-ES"]], bonne: "mercredi", autres: ["vendredi", "samedi"] },
        { wagons: ["janvier", "février"], q: "Después de février, ¿qué mes viene?", dire: [["Después de", "es-ES"], ["février", "fr-FR", .8], ["¿qué mes viene?", "es-ES"]], bonne: "mars", autres: ["mai", "avril"] },
        { wagons: ["vendredi", "samedi"], q: "Después de samedi, ¿qué día viene?", dire: [["Después de", "es-ES"], ["samedi", "fr-FR", .8], ["¿qué día viene?", "es-ES"]], bonne: "dimanche", autres: ["lundi", "jeudi"] },
      ] },
      { type: "papa", questions: [
        { q: "Di los días de la semana en francés.", r: "lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche" },
        { q: "Di los meses de enero a junio en francés.", r: "janvier, février, mars, avril, mai, juin" },
        { q: "Di los meses de julio a diciembre en francés.", r: "juillet, août, septembre, octobre, novembre, décembre" },
        { q: "Di las cuatro estaciones en francés.", r: "le printemps, l'été, l'automne, l'hiver" },
        { q: "¿Qué estación es? En francés.", item: { img: "automne" }, r: "l'automne" },
      ] },
      { type: "cuaderno", dictee: true, tirage: 4, consigne: "Dictado en tu cuaderno",
        voz: "Dictado. Escucha y escribe cada palabra en tu cuaderno, sin mirar.",
        items: [...[11, 12, 13, 14, 15, 16, 17, 21, 25, 31].map(nombre), ...COLORES.map(([fr]) => ({ img: "c-" + fr, nom: fr, voz: fr }))] },
    ],
  },

  "en-casa": {
    titre: "Inglés · La casa",
    court: "Inglés",
    sujet: "Unit 2 · Home",
    unidad: "Unit 2",
    langue: "en-GB",
    cromos: ["kitchen", "bedroom", "bathroom", "living room"].map((m) => ({ img: m, nom: m })),
    etapes: [
      { type: "descubre", consigne: "Mira y escucha", items: [
        { img: "kitchen", nom: "kitchen", es: "la cocina", voz: "kitchen" },
        { img: "bedroom", nom: "bedroom", es: "el dormitorio", voz: "bedroom" },
        { img: "bathroom", nom: "bathroom", es: "el cuarto de baño", voz: "bathroom" },
        { img: "living room", nom: "living room", es: "el salón", voz: "living room" },
      ] },
      { type: "toca", consigne: "Escucha y toca el dibujo", n: 4,
        items: ["kitchen", "bedroom", "bathroom", "living room"].map((m) => ({ img: m, nom: m, voz: m })) },
      { type: "elige", consigne: "What's this? · ¿Qué es?", questions: [
        { img: "living room", q: "What's this?", bonne: "living room", autres: ["bedroom", "bathroom"] },
        { img: "bathroom", q: "What's this?", bonne: "bathroom", autres: ["kitchen", "bedroom"] },
        { img: "bedroom", q: "What's this?", bonne: "bedroom", autres: ["living room", "kitchen"] },
      ] },
      { type: "letras", consigne: "Completa la palabra", mots: [
        { item: { img: "kitchen" }, mot: "kitchen", trous: "k_tch_n" },
        { item: { img: "bedroom" }, mot: "bedroom", trous: "b_dr__m" },
      ] },
      { type: "papa", questions: [
        { q: "¿Cómo se dice «la cocina» en inglés?", r: "kitchen" },
        { q: "¿Cómo se dice «el cuarto de baño» en inglés?", r: "bathroom" },
        { q: "What's this?", item: { img: "living room" }, r: "living room" },
      ] },
      { type: "cuaderno", consigne: "Escribe en tu cuaderno", voz: "Ahora, escribe estas dos palabras en tu cuaderno. Despacio, con letra bonita.",
        items: [{ img: "kitchen", nom: "kitchen" }, { img: "bedroom", nom: "bedroom" }] },
    ],
  },
};
// La séance du jour n'est plus écrite ici : elle est choisie par deberes.js, selon les réglages des parents.
