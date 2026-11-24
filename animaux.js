// Les cromos d'animaux : la récompense de fin de séance.
// Image : animaux/NN.png (générée par Kevin avec Gemini) ; sinon, carte provisoire.

const MILIEUX = {
  mar:    { nom: "El mar",    fond: "#CFE8FF", encre: "#1F4E8C" },
  selva:  { nom: "La selva",  fond: "#CFF2DD", encre: "#1F6B45" },
  polos:  { nom: "Los polos", fond: "#E4DDF7", encre: "#4B3C8A" },
  granja: { nom: "La granja", fond: "#FFF1BF", encre: "#7A5A00" },
};

const ANIMAUX = [
  { n: 1,  m: "mar",    es: "el pulpo",            en: "octopus",        fr: "la pieuvre",        dato: "¿Sabías que el pulpo tiene tres corazones y la sangre azul?" },
  { n: 2,  m: "mar",    es: "el tiburón",          en: "shark",          fr: "le requin",         dato: "¿Sabías que al tiburón se le caen los dientes y le salen nuevos toda la vida? ¡Puede tener miles!" },
  { n: 3,  m: "mar",    es: "la ballena azul",     en: "blue whale",     fr: "la baleine bleue",  dato: "¿Sabías que la ballena azul es el animal más grande que ha existido? ¡Más grande que los dinosaurios!", oro: true },
  { n: 4,  m: "mar",    es: "el caballito de mar", en: "seahorse",       fr: "l'hippocampe",      dato: "¿Sabías que en los caballitos de mar es el papá quien lleva a los bebés en una bolsa en la tripa?" },
  { n: 5,  m: "mar",    es: "la tortuga marina",   en: "sea turtle",     fr: "la tortue de mer",  dato: "¿Sabías que la tortuga marina vuelve a la misma playa donde nació para poner sus huevos?" },
  { n: 6,  m: "mar",    es: "el delfín",           en: "dolphin",        fr: "le dauphin",        dato: "¿Sabías que el delfín duerme con la mitad del cerebro despierta, para no olvidarse de respirar?" },
  { n: 7,  m: "selva",  es: "el perezoso",         en: "sloth",          fr: "le paresseux",      dato: "¿Sabías que el perezoso se mueve tan despacio que le crecen plantitas verdes en el pelo?" },
  { n: 8,  m: "selva",  es: "el camaleón",         en: "chameleon",      fr: "le caméléon",       dato: "¿Sabías que el camaleón puede mover cada ojo por separado y mirar a dos sitios a la vez?", oro: true },
  { n: 9,  m: "selva",  es: "el tucán",            en: "toucan",         fr: "le toucan",         dato: "¿Sabías que el pico del tucán es enorme pero muy ligero, y le ayuda a no pasar calor?" },
  { n: 10, m: "selva",  es: "el jaguar",           en: "jaguar",         fr: "le jaguar",         dato: "¿Sabías que al jaguar le encanta nadar? ¡No como a muchos gatos!" },
  { n: 11, m: "selva",  es: "la rana dardo",       en: "poison dart frog", fr: "la grenouille dendrobate", dato: "¿Sabías que la rana dardo es pequeñita, pero sus colores avisan a todos: «¡no me comas, soy venenosa!»?" },
  { n: 12, m: "selva",  es: "el gorila",           en: "gorilla",        fr: "le gorille",        dato: "¿Sabías que el gorila se hace una cama nueva de hojas cada noche para dormir?" },
  { n: 13, m: "polos",  es: "el pingüino emperador", en: "emperor penguin", fr: "le manchot empereur", dato: "¿Sabías que el papá pingüino emperador cuida el huevo encima de sus patas, en pleno invierno, durante semanas?" },
  { n: 14, m: "polos",  es: "el oso polar",        en: "polar bear",     fr: "l'ours polaire",    dato: "¿Sabías que el oso polar tiene la piel negra? Su pelo es transparente, ¡pero lo vemos blanco!" },
  { n: 15, m: "polos",  es: "la morsa",            en: "walrus",         fr: "le morse",          dato: "¿Sabías que la morsa usa sus colmillos como ganchos para subirse al hielo?" },
  { n: 16, m: "polos",  es: "la cría de foca",     en: "seal pup",       fr: "le bébé phoque",    dato: "¿Sabías que algunas crías de foca nacen con el pelo blanco para esconderse en la nieve?" },
  { n: 17, m: "polos",  es: "el zorro ártico",     en: "arctic fox",     fr: "le renard polaire", dato: "¿Sabías que el zorro ártico es blanco en invierno y marrón en verano, para esconderse mejor?" },
  { n: 18, m: "polos",  es: "el narval",           en: "narwhal",        fr: "le narval",         dato: "¿Sabías que el «cuerno» del narval en realidad es un diente muy, muy largo?", oro: true },
  { n: 19, m: "granja", es: "la vaca",             en: "cow",            fr: "la vache",          dato: "¿Sabías que la vaca tiene un estómago con cuatro partes?" },
  { n: 20, m: "granja", es: "el cerdo",            en: "pig",            fr: "le cochon",         dato: "¿Sabías que el cerdo casi no suda? Por eso se revuelca en el barro: ¡para refrescarse!" },
  { n: 21, m: "granja", es: "la gallina",          en: "hen",            fr: "la poule",          dato: "¿Sabías que los pollitos ya pían desde dentro del huevo, y su mamá les contesta?" },
  { n: 22, m: "granja", es: "el caballo",          en: "horse",          fr: "le cheval",         dato: "¿Sabías que el caballo puede dormir de pie?", oro: true },
  { n: 23, m: "granja", es: "la oveja",            en: "sheep",          fr: "le mouton",         dato: "¿Sabías que la lana de la oveja no para de crecer? Por eso hay que cortársela." },
  { n: 24, m: "granja", es: "la cabra",            en: "goat",           fr: "la chèvre",         dato: "¿Sabías que la cabra tiene las pupilas rectangulares? Así ve casi todo lo que pasa a su alrededor." },
];

// ---- La collection, gardée sur le téléphone ----
const CLE_COLLECTION = "dorian.animales";
const collection = () => { try { return JSON.parse(localStorage.getItem(CLE_COLLECTION)) || []; } catch { return []; } };
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
