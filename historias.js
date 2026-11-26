// Las aventuras de Dorian en el Mundo de Bloques : les histoires du soir (brief : BRIEF-historias.md, idée de Blanca).
// Les chapitres sont écrits à l'avance ici. Rien n'est généré dans l'appli.
//
// Un chapitre = des « pasos » joués dans l'ordre :
//   { t: "D" | "M", txt }      un paragraphe, « Turno de Dorian » ou « Turno de mamá »
//   { tipo: "companero" }      Dorian choisit son compagnon (chapitre 1, pour toute la saison)
//   { tipo: "eleccion", id, pregunta, opciones: [{ v, txt }] }   un choix de chemin, mémorisé sous « id »
//   { tipo: "puerta", nombre, rondas: [{ frase, buena, trampa }] } une porte magique : le bon mot parmi une paire piège
// Un paso avec « si: { id: valeur } » n'est joué que sur cette branche. Un « txt » peut être { var: id, valeur: "…" }.
// Dans le texte : {un} (un pulpo / una orca), {comp} (el pulpo), {Comp} (El pulpo), {del} (del pulpo / de la orca),
// {al} (al pulpo / a la orca), {gesto} (ce que fait ce compagnon quand il a un peu peur, pour rire).
//
// La saison 1 (10 chapitres prévus) : cette nuit, des étoiles du ciel de blocs sont tombées un peu partout.
// Dorian et son compagnon les ramassent, une par chapitre, pour rallumer le ciel. Fin de saison : le ciel est complet.
// Monde de blocs « le plus proche possible » (Blanca) : pico, mesa de crear, cofres, antorchas, minerais, jour/nuit, refugio,
// inventaire ; criaturas à nous (Brincón, la bolita de lava, Bruno). Chapitre 4 : « Dorian diseña una criatura ».

const HISTORIAS = {
  titulo: "Las aventuras de Dorian en el Mundo de Bloques",
  temporada: 1,
  capitulos: [
    {
      n: 1,
      titulo: "El mundo de bloques",
      // Les syllabes travaillées (consignes de la maîtresse) : trabadas et mixtas, avec la paire bra/bar.
      silabas: { trabadas: ["bl", "br", "cr", "fl", "tr"], mixtas: ["ar", "bar", "bol", "an", "es"], pares: ["bra/bar", "bla/bal"] },
      maxPalabras: 25,
      magicas: [
        { p: "bloques", s: ["blo", "ques"] },
        { p: "brazo", s: ["bra", "zo"] },
        { p: "barco", s: ["bar", "co"] },
        { p: "árbol", s: ["ár", "bol"] },
      ],
      pasos: [
        { t: "D", txt: "Dorian abre los ojos. ¡Qué raro! La hierba, los árboles, las nubes… todo es de bloques. ¡Hasta su brazo es cuadrado!" },
        { t: "M", txt: "Está en el Mundo de Bloques. Aquí se pica, se construye y se crea. De pronto, un arbusto se mueve: «¡ñam, ñam!». ¿Quién será?" },
        { tipo: "companero", pregunta: "¿Quién sale del arbusto?" },
        { t: "D", txt: "¡Es {un}! Tiene migas de galleta en la boca. Mira a Dorian y le da la otra mitad. Desde hoy, son compañeros." },
        { t: "M", txt: "{Comp} le enseña una mesa de crear. Dorian pone tres tablas… ¡y fabrica un pico! Entonces, una estrella cae del cielo. ¡Plof!" },
        { tipo: "eleccion", id: "camino1", pregunta: "¿Por dónde van a buscar la estrella?", opciones: [
          { v: "bosque", txt: "Por el bosque, entre los árboles." },
          { v: "rio", txt: "En barco, por el río." },
        ] },
        { si: { camino1: "bosque" }, t: "D", txt: "El bosque está oscuro, pero unas flores brillan como antorchas. Dorian pica un bloque de tierra y encuentra un cofre. Dentro: ¡una brújula!" },
        { si: { camino1: "rio" }, t: "D", txt: "Dorian rema en el barco con los brazos. {Comp} va delante, de capitán. En el agua flota un cofre. Dentro: ¡una brújula!" },
        { t: "M", txt: "La flecha de la brújula señala las montañas. Pero el sol se esconde, y de noche salen criaturas… ¡Hay que construir un refugio!" },
      ],
    },
    {
      n: 2,
      titulo: "La puerta que se ríe",
      silabas: { trabadas: ["tr", "pr", "bl", "br", "cr"], mixtas: ["es", "en", "car", "per", "tar"], pares: ["tra/tar", "pre/per"] },
      maxPalabras: 28,
      magicas: [
        { p: "estrella", s: ["es", "tre", "lla"] },
        { p: "entrar", s: ["en", "trar"] },
        { p: "pregunta", s: ["pre", "gun", "ta"] },
        { p: "carbón", s: ["car", "bón"] },
      ],
      pasos: [
        { t: "D", txt: "Dorian pica bloques de piedra y construye un refugio con una puerta. {Comp} pone una antorcha. ¡Ya está! Fuera, la noche es oscura." },
        { t: "M", txt: "De pronto, algo salta en la ventana. ¡Boing, boing! Es un cubo verde con ojos de botón. «¡Soy Brincón!», dice, y se ríe. Solo quiere jugar." },
        { t: "D", txt: { var: "camino1",
          bosque: "Por la mañana, la brújula del bosque los lleva a las montañas. Brincón va también. Allí hay una puerta de piedra con cara. «¿Queréis entrar?», pregunta.",
          rio: "Por la mañana, la brújula del río los lleva a las montañas. Brincón va también. Allí hay una puerta de piedra con cara. «¿Queréis entrar?», pregunta." } },
        { t: "M", txt: "«¡Sí, por favor!», dice Dorian. «Muy bien», dice la puerta. «Pero antes, una pregunta. Si te equivocas… ¡me río!»" },
        { tipo: "puerta", nombre: "la puerta", pregunta: "Toca la palabra buena.", rondas: [
          { frase: "Por las vías pasa un…", buena: "tren", trampa: "tern" },
          { frase: "Si aciertas, te doy un…", buena: "premio", trampa: "permio" },
        ] },
        { t: "D", txt: "La puerta se abre. Dentro hay un túnel. Dorian pica con su pico: ¡carbón, hierro y un trozo de oro! Lo guarda todo en su inventario." },
        { tipo: "eleccion", id: "camino2", pregunta: "Al final del túnel hay dos caminos. ¿Por dónde siguen?", opciones: [
          { v: "cristal", txt: "Subir por la escalera de cristal." },
          { v: "volcan", txt: "Bajar por el tobogán del volcán." },
        ] },
        { si: { camino2: "cristal" }, t: "M", txt: "Suben por la escalera de cristal. ¡Cric, crac! Cada escalón suena como una campanita. Brincón da saltitos detrás, muy contento." },
        { si: { camino2: "volcan" }, t: "M", txt: "Bajan por el tobogán, al lado de un río de lava. ¡Qué rápido! Una bolita de lava les guiña un ojo y se ríe: «¡Glu, glu!»." },
        { t: "D", txt: "Al final hay una cueva enorme. En el centro brilla la estrella… ¡pero alguien duerme encima! Se oye un ronquido gigante. ¿Quién será?" },
      ],
    },
    {
      n: 3,
      titulo: "El dinosaurio dormilón",
      silabas: { trabadas: ["gr", "cr", "br", "tr", "bl", "pl"], mixtas: ["gran", "lar", "dor", "cos", "ron"], pares: ["gra/gar", "cro/cor"] },
      maxPalabras: 30,
      magicas: [
        { p: "grande", s: ["gran", "de"] },
        { p: "dormido", s: ["dor", "mi", "do"] },
        { p: "croquetas", s: ["cro", "que", "tas"] },
        { p: "cosquillas", s: ["cos", "qui", "llas"] },
      ],
      pasos: [
        { t: "D", txt: "Es un dinosaurio grande, grandísimo. Tiene el cuello largo y la cola larga. Y está dormido encima de la estrella." },
        { t: "M", txt: "Es un braquiosaurio. Ronca tan fuerte que las piedras tiemblan. {Comp} {gesto} «¿Y ahora qué hacemos?», susurra Dorian." },
        { tipo: "eleccion", id: "despertar", pregunta: "¿Cómo lo despiertan?", opciones: [
          { v: "cosquillas", txt: "Le hacen cosquillas con una pluma." },
          { v: "trompeta", txt: "Fabrican una trompeta de hierro." },
        ] },
        { si: { despertar: "cosquillas" }, t: "D", txt: "Dorian le hace cosquillas en la cola con una pluma. El dinosaurio se ríe: «¡Ji, ji, ji!». Se estira… y abre un ojo." },
        { si: { despertar: "trompeta" }, t: "D", txt: "Dorian pone el hierro en la mesa de crear y fabrica una trompeta. Sopla: ¡Tururú! El dinosaurio da un salto. Y abre un ojo." },
        { t: "M", txt: "«Perdón, perdón», dice con voz de abuelo. «Me llamo Bruno. Esta estrella me cayó en la cabeza. Estaba tan calentita que me quedé dormido.»" },
        { t: "D", txt: "«Te la devuelvo», dice Bruno. «Pero está en mi cofre mágico. Y mi cofre solo se abre si lees bien.»" },
        { tipo: "puerta", nombre: "el cofre", pregunta: "Toca la palabra buena.", rondas: [
          { frase: "Bruno es muy…", buena: "grande", trampa: "garnde" },
          { frase: "Para cenar, Bruno come…", buena: "croquetas", trampa: "corquetas" },
        ] },
        { t: "M", txt: "El cofre se abre con una carcajada. Dorian coge la estrella con las dos manos. Está tibia y brilla con una luz blanca, muy suave." },
        { t: "D", txt: "Bruno mira al techo. «Esa estrella no es la única», dice. «Hay otra en el desierto. Y para llegar, vais a necesitar un amigo nuevo… uno que todavía no existe.»" },
      ],
    },
  ],
};

// Ce que fait chaque compagnon quand il a un peu peur (chapitre 3). Pour rire, jamais pour faire peur.
const GESTOS = {
  1: "se tapa las orejas con cuatro brazos. ¡Y aún le sobran cuatro!",
  2: "se tapa los ojos con las aletas.",
  3: "suelta un chorro de agua por la cabeza. ¡Fsss!",
  4: "se esconde en el bolsillo de Dorian.",
  5: "mete la cabeza dentro del caparazón.",
  6: "hace burbujas de los nervios. ¡Blub, blub!",
  7: "empieza a taparse las orejas… muy… muy… despacio.",
  8: "se pone de color gris, como las piedras.",
  9: "se tapa las orejas con sus manos grandes.",
  10: "pone las orejas hacia atrás.",
  11: "se tapa la cara con las patas.",
  12: "se esconde detrás de Dorian. Pero el cuerno se ve.",
  13: "se tapa los ojos con las aletas.",
  14: "se tapa la cara con la cola.",
  15: "se esconde debajo de una piedra.",
  16: "gira la cabeza para no mirar.",
  17: "intenta rugir, pero le sale un «miau».",
  18: "intenta taparse las orejas, pero sus brazos son muy cortos.",
};

// ---- Le texte avec le compagnon ----
function remplir(txt, etat) {
  const a = (typeof ANIMAUX !== "undefined" && etat.companero) ? ANIMAUX.find((x) => x.n === etat.companero.n) : null;
  const es = a ? a.es : "el amigo";
  const fem = /^la /.test(es), nom = es.replace(/^(el|la) /, "");
  const v = {
    un: (fem ? "una " : "un ") + nom,
    comp: es,
    Comp: es[0].toUpperCase() + es.slice(1),
    del: fem ? "de la " + nom : "del " + nom,
    al: fem ? "a la " + nom : "al " + nom,
    gesto: (a && GESTOS[a.n]) || "se esconde detrás de Dorian.",
  };
  return txt.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);
}
function texteDuPaso(p, etat) {
  let t = p.txt;
  if (t && typeof t === "object") t = t[(etat.elecciones[t.var] || {}).v] || Object.values(t).find((x) => x !== t.var);
  return remplir(t || "", etat);
}
const pasoActivo = (p, etat) => !p.si || Object.entries(p.si).every(([k, v]) => (etat.elecciones[k] || {}).v === v);

// ---- Les syllabes (espagnol) ----
// Règles de 2º de Primaria : une consonne entre deux voyelles va avec la seconde (ca-sa) ; deux consonnes se séparent
// (bar-co), sauf les « trabadas » de la maîtresse (bl br cl cr dr fl fr gl gr pl pr tr tl) et ch, ll, rr, qu, gu (+e/i).
const TRABADAS = ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "tr", "tl", "kl", "kr"];
const VOY = "aeiouáéíóúü", FORTES = "aeoáéíóú";
function silabas(mot) {
  const w = mot.toLowerCase();
  // Les unités : digraphes d'abord.
  const u = [];
  for (let i = 0; i < w.length;) {
    const d = w.slice(i, i + 2), suiv = w[i + 2] || "";
    if (["ch", "ll", "rr"].includes(d) || ((d === "qu" || d === "gu") && "eiéí".includes(suiv))) { u.push(d); i += 2; continue; }
    u.push(w[i]); i++;
  }
  // y : voyelle en fin de mot ou devant une consonne (hoy, muy) ; consonne devant une voyelle (yo, playa).
  const estV = (k) => {
    const c = u[k];
    if (c === "y") { const s = u[k + 1]; return !s || !VOY.includes(s[0]); }
    return c.length === 1 && VOY.includes(c);
  };
  const noyaux = []; // [début, fin] des groupes vocaliques (diphtongues gardées, hiatus coupés)
  for (let k = 0; k < u.length; k++) {
    if (!estV(k)) continue;
    const prec = noyaux[noyaux.length - 1];
    const voisin = prec && prec[1] === k - 1;
    const h = voisin && FORTES.includes(u[k - 1]) && FORTES.includes(u[k]) && u[k - 1] !== "y";
    if (voisin && !h) prec[1] = k; else noyaux.push([k, k]);
  }
  if (noyaux.length < 2) return [mot];
  const coupes = [];
  for (let j = 0; j < noyaux.length - 1; j++) {
    const a = noyaux[j][1], b = noyaux[j + 1][0], n = b - a - 1; // n consonnes entre deux noyaux
    const groupe = (x, y) => TRABADAS.includes(u[x] + u[y]);
    let c;
    if (n <= 1) c = a + 1;
    else if (n === 2) c = groupe(a + 1, a + 2) ? a + 1 : a + 2;
    else if (n === 3) c = groupe(a + 2, a + 3) ? a + 2 : a + 3;
    else c = a + 3;
    coupes.push(c);
  }
  // On recoupe le mot d'origine (avec ses majuscules) aux mêmes endroits.
  const pos = []; let p = 0;
  u.forEach((x) => { pos.push(p); p += x.length; });
  const res = []; let deb = 0;
  coupes.forEach((c) => { res.push(mot.slice(deb, pos[c])); deb = pos[c]; });
  res.push(mot.slice(deb));
  return res;
}
// Une syllabe que la maîtresse fait travailler : trabada (deux consonnes puis la voyelle) ou mixta (finit par une consonne).
function genreSilaba(s) {
  const x = s.toLowerCase();
  const tr = TRABADAS.includes(x.slice(0, 2));
  const mx = !VOY.includes(x[x.length - 1]) && x[x.length - 1] !== "y" && /[aeiouáéíóú]/.test(x);
  return tr ? "trabada" : mx ? "mixta" : "";
}

// ---- La progression (localStorage « dorian.historias », clé « historias » de la progression du Sheet) ----
// { companero: { n, fecha }, elecciones: { id: { v, fecha } }, leidos: { "1": fecha }, enCurso: { cap, paso, fecha } }
// Fusion entre téléphones (à garder identique dans sync.js et outils/deberes.gs) : le premier choix gagne toujours
// (« como lo ha elegido él, no tiene marcha atrás »), un chapitre lu le reste, le chapitre en cours le plus récent gagne.
function fusionnerHistorias(a, b) {
  a = a || {}; b = b || {};
  const premier = function (x, y) { if (!x) return y; if (!y) return x; return (x.fecha || "") <= (y.fecha || "") ? x : y; };
  const dernier = function (x, y) { if (!x) return y; if (!y) return x; return (x.fecha || "") >= (y.fecha || "") ? x : y; };
  const min = function (x, y) { if (!x) return y; if (!y) return x; return x <= y ? x : y; };
  const elecciones = Object.assign({}, a.elecciones);
  Object.keys(b.elecciones || {}).forEach(function (k) { elecciones[k] = premier(elecciones[k], b.elecciones[k]); });
  const leidos = Object.assign({}, a.leidos);
  Object.keys(b.leidos || {}).forEach(function (k) { leidos[k] = min(leidos[k], b.leidos[k]); });
  const r = { elecciones: elecciones, leidos: leidos };
  const comp = premier(a.companero, b.companero); if (comp) r.companero = comp;
  const cours = dernier(a.enCurso, b.enCurso); if (cours) r.enCurso = cours;
  return r;
}

const Historias = (() => {
  const CLE = "dorian.historias";
  const lire = () => { try { const e = JSON.parse(localStorage.getItem(CLE)) || {}; return { elecciones: {}, leidos: {}, ...e }; } catch { return { elecciones: {}, leidos: {} }; } };
  const ecrire = (e) => { try { localStorage.setItem(CLE, JSON.stringify(e)); } catch {} };
  const jour = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const jourDe = (iso) => iso ? jour(new Date(iso)) : "";
  const envoyer = () => { if (typeof Sync !== "undefined") Sync.synchroniserProgreso(); };

  // Le chapitre de ce soir : le premier pas encore lu. Un seul par soir : s'il en a déjà fini un aujourd'hui,
  // le suivant attend demain (sauf en test, ?prueba).
  function chapitreDuSoir(e = lire(), test = false) {
    const prochain = HISTORIAS.capitulos.find((c) => !e.leidos[c.n]);
    const lusAujourdhui = Object.entries(e.leidos).filter(([, f]) => jourDe(f) === jour()).map(([n]) => +n);
    if (!prochain) return { fin: true, lusAujourdhui };
    if (lusAujourdhui.length && !test) return { attendre: prochain, lusAujourdhui };
    return { cap: prochain, lusAujourdhui };
  }
  function choisir(id, v) {
    const e = lire();
    if (e.elecciones[id]) return e; // pas de retour en arrière
    e.elecciones[id] = { v, fecha: new Date().toISOString() };
    ecrire(e); envoyer(); return e;
  }
  function choisirCompagnon(n) {
    const e = lire();
    if (!e.companero) { e.companero = { n, fecha: new Date().toISOString() }; ecrire(e); envoyer(); }
    return e;
  }
  function position(cap, paso) { const e = lire(); e.enCurso = { cap, paso, fecha: new Date().toISOString() }; ecrire(e); }
  function terminer(cap) {
    const e = lire();
    e.leidos[cap] = e.leidos[cap] || new Date().toISOString();
    delete e.enCurso;
    ecrire(e); envoyer(); return e;
  }
  return { lire, ecrire, chapitreDuSoir, choisir, choisirCompagnon, position, terminer, jour, CLE };
})();

if (typeof module !== "undefined") module.exports = { HISTORIAS, GESTOS, silabas, genreSilaba, remplir, texteDuPaso, pasoActivo, fusionnerHistorias };
