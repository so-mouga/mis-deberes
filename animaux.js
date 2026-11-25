// Les cromos d'animaux : la récompense de fin de séance.
// Image : animaux/NN.png (générée par Kevin avec Gemini) ; sinon, carte provisoire.

const MILIEUX = {
  mar:      { nom: "El mar",            fond: "#CFE8FF", encre: "#1F4E8C" },
  selva:    { nom: "La selva",          fond: "#CFF2DD", encre: "#1F6B45" },
  polos:    { nom: "Los polos",         fond: "#E4DDF7", encre: "#4B3C8A" },
  gigantes: { nom: "Gigantes y bichos", fond: "#FFF1BF", encre: "#7A5A00" },
};

// 18 animaux, dans l'ordre des images animaux/01.png … 18.png (liste revue avec Kevin le 25 nov. 2026 :
// plus de ferme ni de bébé phoque, trop « petits » pour lui ; un 4e monde « Gigantes y bichos »).
// Un doré par monde : la ballena azul, el camaleón, el narval, el tiranosaurio.
const ANIMAUX = [
  { n: 1,  m: "mar",      es: "el pulpo",            en: "octopus",         fr: "la pieuvre",        dato: "¿Sabías que el pulpo tiene tres corazones y la sangre azul?" },
  { n: 2,  m: "mar",      es: "el tiburón",          en: "shark",           fr: "le requin",         dato: "¿Sabías que al tiburón se le caen los dientes y le salen nuevos toda la vida? ¡Puede tener miles!" },
  { n: 3,  m: "mar",      es: "la ballena azul",     en: "blue whale",      fr: "la baleine bleue",  dato: "¿Sabías que la ballena azul es el animal más grande que ha existido? ¡Más grande que los dinosaurios!", oro: true },
  { n: 4,  m: "mar",      es: "el caballito de mar", en: "seahorse",        fr: "l'hippocampe",      dato: "¿Sabías que en los caballitos de mar es el papá quien lleva a los bebés en una bolsa en la tripa?" },
  { n: 5,  m: "mar",      es: "la tortuga marina",   en: "sea turtle",      fr: "la tortue de mer",  dato: "¿Sabías que la tortuga marina vuelve a la misma playa donde nació para poner sus huevos?" },
  { n: 6,  m: "mar",      es: "el delfín",           en: "dolphin",         fr: "le dauphin",        dato: "¿Sabías que el delfín duerme con la mitad del cerebro despierta, para no olvidarse de respirar?" },
  { n: 7,  m: "selva",    es: "el perezoso",         en: "sloth",           fr: "le paresseux",      dato: "¿Sabías que el perezoso se mueve tan despacio que le crecen plantitas verdes en el pelo?" },
  { n: 8,  m: "selva",    es: "el camaleón",         en: "chameleon",       fr: "le caméléon",       dato: "¿Sabías que el camaleón puede mover cada ojo por separado y mirar a dos sitios a la vez?", oro: true },
  { n: 9,  m: "selva",    es: "el gorila",           en: "gorilla",         fr: "le gorille",        dato: "¿Sabías que el gorila se hace una cama nueva de hojas cada noche para dormir?" },
  { n: 10, m: "selva",    es: "el jaguar",           en: "jaguar",          fr: "le jaguar",         dato: "¿Sabías que al jaguar le encanta nadar? ¡No como a muchos gatos!" },
  { n: 11, m: "polos",    es: "el oso polar",        en: "polar bear",      fr: "l'ours polaire",    dato: "¿Sabías que el oso polar tiene la piel negra? Su pelo es transparente, ¡pero lo vemos blanco!" },
  { n: 12, m: "polos",    es: "el narval",           en: "narwhal",         fr: "le narval",         dato: "¿Sabías que el «cuerno» del narval en realidad es un diente muy, muy largo?", oro: true },
  { n: 13, m: "polos",    es: "la orca",             en: "orca",            fr: "l'orque",           dato: "¿Sabías que la orca, aunque la llamen ballena asesina, en realidad es un delfín? ¡El delfín más grande de todos!" },
  { n: 14, m: "polos",    es: "el zorro ártico",     en: "arctic fox",      fr: "le renard polaire", dato: "¿Sabías que el zorro ártico es blanco en invierno y marrón en verano, para esconderse mejor?" },
  { n: 15, m: "gigantes", es: "el escarabajo rinoceronte", en: "rhinoceros beetle", fr: "le scarabée rhinocéros", dato: "¿Sabías que el escarabajo rinoceronte es uno de los animales más fuertes del mundo para su tamaño? ¡Puede levantar cientos de veces su propio peso!" },
  { n: 16, m: "gigantes", es: "la mantis religiosa", en: "praying mantis",  fr: "la mante religieuse", dato: "¿Sabías que la mantis religiosa puede girar la cabeza para mirar por encima de su hombro, como nosotros?" },
  { n: 17, m: "gigantes", es: "el león",             en: "lion",            fr: "le lion",           dato: "¿Sabías que el rugido del león se puede oír desde ocho kilómetros de distancia?" },
  { n: 18, m: "gigantes", es: "el tiranosaurio",     en: "T. rex",          fr: "le tyrannosaure",   dato: "¿Sabías que el tiranosaurio vivió hace 66 millones de años y tenía la mordida más fuerte de todos los animales de tierra que conocemos?", oro: true },
];

// ---- La collection, gardée sur le téléphone ----
const CLE_COLLECTION = "dorian.animales";
// On ignore les numéros qui n'existent plus (l'ancienne liste allait jusqu'à 24).
const collection = () => { try { return (JSON.parse(localStorage.getItem(CLE_COLLECTION)) || []).filter((n) => ANIMAUX.some((a) => a.n === n)); } catch { return []; } };
// Un nouveau cromo part aussi vers le Sheet (sync.js), pour le retrouver sur ses autres téléphones.
const garder = (n) => {
  const c = collection();
  if (!c.includes(n)) { c.push(n); localStorage.setItem(CLE_COLLECTION, JSON.stringify(c)); }
  if (typeof Sync !== "undefined") Sync.synchroniserProgreso();
};

// Tire un animal jamais gagné (pas de doubles). Les dorés n'arrivent qu'après les 4 premiers.
function tirerAnimal() {
  const deja = collection();
  let reste = ANIMAUX.filter((a) => !deja.includes(a.n));
  if (!reste.length) return null;
  if (deja.length < 4 && reste.some((a) => !a.oro)) reste = reste.filter((a) => !a.oro);
  return reste[Math.floor(Math.random() * reste.length)];
}

// Le cromo d'un animal : image de Gemini si elle existe, sinon carte provisoire.
function cromoAnimal(a, { noms = true } = {}) {
  const M = MILIEUX[a.m];
  const el = document.createElement("div");
  el.className = "cromo animal" + (a.oro ? " oro" : "");
  const num = String(a.n).padStart(2, "0");
  el.innerHTML = `<div class="art" style="background:${M.fond}">
      <img src="animaux/${num}.png" alt="" onerror="this.remove()">
      <span class="provisoire" style="color:${M.encre}">${a.es.replace(/^(el|la|los|las) /, "")}</span>
    </div>${noms ? `<b>${a.es}</b>` : ""}`;
  return el;
}
