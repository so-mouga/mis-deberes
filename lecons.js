// Les leçons. Chaque leçon = des cromos à gagner + une liste d'étapes.
// Types d'étapes : descubre, toca, elige, letras, papa, cuaderno (puis la fin : cromos + descanso).
// Un « item » : { img } (dessin) ou { texte } (nombre, mot), + nom (ce qu'on lit) et voz (ce qu'on dit).

const NOMBRES_FR = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt",
  "vingt et un", "vingt-deux", "vingt-trois", "vingt-quatre", "vingt-cinq", "vingt-six", "vingt-sept",
  "vingt-huit", "vingt-neuf", "trente", "trente et un"];
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const nombre = (n) => ({ texte: String(n), nom: NOMBRES_FR[n], voz: NOMBRES_FR[n] });

const LECONS = {
  "en-examen": {
    titre: "Inglés · Examen del jueves",
    court: "Inglés · examen",
    sujet: "Unit 2 · Home (examen)",
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

  "fr-calendario": {
    titre: "Francés · El calendario",
    court: "Francés",
    sujet: "Números, meses y estaciones",
    langue: "fr-FR",
    cromos: [
      { img: "printemps", nom: "le printemps" },
      { img: "ete", nom: "l'été" },
      { img: "automne", nom: "l'automne" },
      { img: "hiver", nom: "l'hiver" },
    ],
    etapes: [
      { type: "descubre", consigne: "Las cuatro estaciones", items: [
        { img: "printemps", nom: "le printemps", es: "la primavera", voz: "le printemps" },
        { img: "ete", nom: "l'été", es: "el verano", voz: "l'été" },
        { img: "automne", nom: "l'automne", es: "el otoño", voz: "l'automne" },
        { img: "hiver", nom: "l'hiver", es: "el invierno", voz: "l'hiver" },
      ] },
      { type: "toca", consigne: "Escucha y toca el número", n: 5, proches: true,
        items: Array.from({ length: 31 }, (_, i) => nombre(i + 1)),
        cibles: [11, 12, 13, 14, 15, 16, 17, 21, 31].map(nombre) },
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
        { q: "¿Cómo se dice «invierno»?", img: "hiver", bonne: "l'hiver", autres: ["l'été", "l'automne"] },
      ] },
      { type: "letras", consigne: "Completa la palabra", mots: [
        { item: { texte: "13" }, mot: "treize", trous: "tr__ze" },
        { item: { texte: "16" }, mot: "seize", trous: "s__ze" },
        { item: { img: "automne" }, mot: "automne", trous: "a_t_mne" },
      ] },
      { type: "papa", questions: [
        { q: "¿Cómo se dice «quince» en francés?", r: "quinze" },
        { q: "Di los meses de la primavera en francés.", r: "mars, avril, mai" },
        { q: "¿Qué número es?", item: { texte: "21" }, r: "vingt et un" },
        { q: "¿Qué día es tu cumpleaños? Dilo en francés.", r: "le … (número) + mes" },
      ] },
      { type: "cuaderno", consigne: "Escribe en tu cuaderno", voz: "Escribe en tu cuaderno los números del once al dieciséis, en letras. Despacio, con letra bonita.",
        items: [11, 12, 13, 14, 15, 16].map(nombre) },
    ],
  },

  "en-casa": {
    titre: "Inglés · La casa",
    court: "Inglés",
    sujet: "Unit 2 · Home",
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
const LECON_DU_JOUR = "en-examen"; // jusqu'à l'examen du jeudi 26 nov., puis "fr-calendario"
