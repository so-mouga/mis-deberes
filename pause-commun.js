// Boîte à outils commune aux jeux de la pause : version de l'APPLI (copiée de .impeccable/maquettes/pause-commun.js).
// En plus de la maquette : le verrou « après les devoirs » et les boutons de fin (retour à la séance ou à l'accueil).
// À charger après commun.js, animaux.js et sync.js.
// Un jeu n'a à écrire que son terrain : le reste (durée, minuteur, choix de l'animal, sons, fin) est ici.

const PARAMS_JEU = new URLSearchParams(location.search);
const TEST_RAPIDE = PARAMS_JEU.has("duree");

// ---- Le verrou (décidé avec Kevin le 25 nov. 2026) ----
// Les jeux s'ouvrent à l'accueil une fois une séance finie aujourd'hui (sur ce téléphone ou un autre, via la progression),
// ou si un adulte les a ouverts pour la journée (un calcul, sur l'accueil). Pendant la pause entre deux séances (?pausa=ID), toujours.
const JEUX_OUVERTS_CLE = "dorian.juegos.abiertos"; // « AAAA-MM-JJ » : le jour où un adulte les a ouverts
const aujourdhuiJeu = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function juegosAbiertos() {
  const hoy = aujourdhuiJeu();
  try {
    if (localStorage.getItem(JEUX_OUVERTS_CLE) === hoy) return true;
    return Object.values(JSON.parse(localStorage.getItem("dorian.hechas")) || {}).includes(hoy);
  } catch { return false; }
}
const ouvrirJuegosHoy = () => { try { localStorage.setItem(JEUX_OUVERTS_CLE, aujourdhuiJeu()); } catch {} };
const EN_PAUSE = PARAMS_JEU.get("pausa"); // l'id de la leçon qu'on vient de finir, si on vient de la pause
// Une page de jeu ouverte sans droit (adresse tapée, ancien onglet) ramène à l'accueil.
if (typeof NE_PAS_VERROUILLER === "undefined" && !EN_PAUSE && !TEST_RAPIDE && !juegosAbiertos()) location.replace("index.html");

// ---- Durée ----
// La durée suit le réglage des parents (Sync.pausa(), espace parent) : pause de 5 min → 3 min de jeu, 10 min → 8 min.
// Une partie bonus (?bonus, ticket offert) peut durer jusqu'à maxMinutos si les parents l'ont permis.
// ?duree=N force N secondes, pour tester.
const PARTIE_BONUS = PARAMS_JEU.has("bonus");
function dureeDuJeu({ bonus = PARTIE_BONUS } = {}) {
  if (TEST_RAPIDE) return (+PARAMS_JEU.get("duree") || 180) * 1000;
  const reglage = typeof Sync !== "undefined" && Sync.pausa ? Sync.pausa() : { minutos: 5, libreEnBonus: false, maxMinutos: 15 };
  if (bonus && reglage.libreEnBonus) return reglage.maxMinutos * 60000;
  return (reglage.minutos >= 10 ? 8 : 3) * 60000; // le reste de la pause : défi physique + ballena
}
const DUREE_JEU = dureeDuJeu();

// ---- Animaux ----
const AVEC_IMAGE = ANIMAUX.map((a) => a.n); // les 18 ont leur image (liste du 25 nov. 2026)
const imgAnimal = (n) => `img/${String(n).padStart(2, "0")}.jpg`;
const animalN = (n) => ANIMAUX.find((a) => a.n === n);
const nomCourt = (a) => a.es.replace(/^(el|la) /, "");
const nomMaj = (a) => a.es.charAt(0).toUpperCase() + a.es.slice(1); // « El jaguar »
// Ses animaux à lui (s'il en a au moins `min`), sinon tous : en maquette, ou chez la grand-mère avant toute séance.
function mesAnimaux(min = 3) {
  const siens = collection().filter((n) => AVEC_IMAGE.includes(n));
  return siens.length >= min ? siens : AVEC_IMAGE.slice();
}
// Images prêtes à dessiner dans une toile : chargerImages([1, 4]) → { 1: Image, 4: Image }
// Une image qui n'arrive pas (réseau lent, serveur occupé) est redemandée jusqu'à 4 fois.
// imageSure(src) remplace new Image() ; on peut aussi lui donner son src plus tard (img.src = …).
function imageSure(src) {
  const i = new Image(); let essais = 0;
  i.addEventListener("load", () => (essais = 0));
  i.addEventListener("error", () => {
    if (++essais > 4) return;
    const base = i.src.replace(/[?&]r=\d+$/, "");
    setTimeout(() => (i.src = base + (base.includes("?") ? "&" : "?") + "r=" + essais), 700 * essais);
  });
  if (src) i.src = src;
  return i;
}
function chargerImages(liste) { const o = {}; liste.forEach((n) => (o[n] = imageSure(imgAnimal(n)))); return o; }
// Pareil pour les <img> de la page (cromos, compteur) : on les redemande aussi.
function redemanderImg(i) {
  if (!(i instanceof HTMLImageElement) || !i.src) return;
  const essais = +(i.dataset.essais || 0) + 1; if (essais > 4) return;
  i.dataset.essais = essais;
  const base = i.src.replace(/[?&]r=\d+$/, "");
  setTimeout(() => (i.src = base + (base.includes("?") ? "&" : "?") + "r=" + essais), 700 * essais);
}
document.addEventListener("error", (e) => redemanderImg(e.target), true);
document.addEventListener("load", (e) => { if (e.target instanceof HTMLImageElement) delete e.target.dataset.essais; }, true); // une image arrivée remet le compteur à zéro
// celles qui ont raté avant que ce fichier soit chargé (les <img> écrites dans la page)
document.querySelectorAll("img").forEach((i) => { if (i.complete && !i.naturalWidth) redemanderImg(i); });
const imagePrete = (i) => !!(i && i.complete && i.naturalWidth); // une image cassée ne doit jamais figer le jeu

// ---- Sprites : l'animal détouré, sans fond (img/sprite/NN.webp, faits depuis animaux/detoure/NN.png) ----
// Pour un personnage qui court, nage ou saute « en vrai ». Le rond (dessinerRond) reste pour les cromos et les compteurs.
const spriteAnimal = (n) => `img/sprite/${String(n).padStart(2, "0")}.webp`;
// Ceux-là regardent vers la gauche sur leur image : dessinerSprite les retourne pour qu'ils avancent vers la droite.
const REGARDE_A_GAUCHE = [6, 12, 13]; // delfín, narval, orca
function chargerSprites(liste) { const o = {}; liste.forEach((n) => (o[n] = imageSure(spriteAnimal(n)))); return o; }
// dessinerSprite(g, img, n, x, y, h) : l'animal posé sur (x, y) = le milieu de ses pieds, haut de h pixels.
// vers : 1 = il regarde à droite (défaut), -1 = à gauche. ecrase : <1 écrasé (atterrissage), >1 étiré (saut). rotation en radians.
function dessinerSprite(g, img, n, x, y, h, { vers = 1, ecrase = 1, rotation = 0, ombre = true } = {}) {
  if (!imagePrete(img)) return false;
  const w = h * img.naturalWidth / img.naturalHeight;
  if (ombre) { g.fillStyle = "rgba(0,0,0,.16)"; g.beginPath(); g.ellipse(x, y, w * .38, h * .06, 0, 0, 7); g.fill(); }
  g.save(); g.translate(x, y); g.rotate(rotation);
  g.scale((REGARDE_A_GAUCHE.includes(n) ? -1 : 1) * vers / Math.sqrt(ecrase), ecrase);
  g.drawImage(img, -w / 2, -h, w, h);
  g.restore();
  return true;
}

// Un animal dans un rond à bord blanc (comme les cromos), dessiné dans une toile.
// anneau : une couleur, ou "arc" pour l'arc-en-ciel (niveau max, super pouvoir).
function dessinerRond(g, img, a, x, y, r, { anneau = "#FFFFFF", bord = 5, t = 0 } = {}) {
  if (anneau === "arc" && g.createConicGradient) {
    const gr = g.createConicGradient(t / 300, x, y);
    ["#E0453F", "#F08A1C", "#F2B90F", "#2E9E57", "#3FB8E8", "#B05BE0", "#E0453F"].forEach((c, i) => gr.addColorStop(i / 6, c));
    g.fillStyle = gr;
  } else g.fillStyle = anneau === "arc" ? "#F2B90F" : anneau;
  g.beginPath(); g.arc(x, y, r + bord, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
  g.fillStyle = MILIEUX[a.m].fond; g.fillRect(x - r, y - r, r * 2, r * 2);
  if (imagePrete(img)) g.drawImage(img, x - r, y - r, r * 2, r * 2);
  g.restore();
}

// ---- Écran « elige tu animal » ----
// choixAnimal(conteneur, { sousTitre: (a) => "Salta doble", surChoix: (a) => … })
function choixAnimal(conteneur, { sousTitre, surChoix }) {
  conteneur.innerHTML = "";
  mesAnimaux().forEach((n) => {
    const a = animalN(n), b = document.createElement("button");
    b.style.background = MILIEUX[a.m].fond;
    b.innerHTML = `<span class="ani"><img src="${imgAnimal(n)}" alt=""></span><b>${nomCourt(a)}</b>${sousTitre ? `<small>${sousTitre(a)}</small>` : ""}`;
    b.addEventListener("click", () => { try { audio().resume?.(); } catch {} surChoix(a); });
    conteneur.append(b);
  });
}

// ---- Petit message en haut du terrain (« ¡Nivel 2! ») ----
function messageJeu(el, texte, ms = 2000, or = false) {
  el.textContent = texte; el.className = "bulle" + (or ? " or" : ""); el.hidden = false;
  clearTimeout(el._t); el._t = setTimeout(() => (el.hidden = true), ms);
}
// Le compteur qui saute quand on ramasse quelque chose
function compteurPop(el, valeur, nombre) { if (nombre) nombre.textContent = valeur; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }

// ---- Sons et vibrations (jamais de son d'échec) ----
let BRUIT_BLANC;
function bruitFiltre(frequence, q, duree, volume) {
  try {
    const a = audio();
    if (!BRUIT_BLANC) { BRUIT_BLANC = a.createBuffer(1, a.sampleRate * .4, a.sampleRate); const d = BRUIT_BLANC.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = a.createBufferSource(), f = a.createBiquadFilter(), gg = a.createGain(), t = a.currentTime;
    s.buffer = BRUIT_BLANC; f.type = "bandpass"; f.frequency.value = frequence; f.Q.value = q;
    gg.gain.setValueAtTime(volume, t); gg.gain.exponentialRampToValueAtTime(.0001, t + duree);
    s.connect(f).connect(gg).connect(a.destination); s.start(t); s.stop(t + duree + .02);
  } catch {}
}
const SONS_JEU = {
  item: () => note(1046, 1568, .1, .09),
  gemme: () => { note(1175, 1568, .14, .14); setTimeout(() => note(1568, 2093, .18, .12), 80); },
  boing: () => { note(260, 520, .16, .13, "triangle"); setTimeout(() => note(520, 300, .12, .07, "triangle"), 110); }, // une erreur = un son rigolo
  casse: () => { bruitFiltre(700, 1.5, .22, 1); note(200, 110, .16, .22, "triangle"); },
  saut: () => note(420, 760, .14, .1),
};
const vibrer = (ms) => { try { navigator.vibrate?.(ms); } catch {} };
const DOUX_JEU = matchMedia("(prefers-reduced-motion: reduce)").matches;
const RIRES = ["¡Boing!", "¡Uy! ¡Jijí!", "¡Qué risa!"];
const rireAuHasard = () => RIRES[Math.floor(Math.random() * RIRES.length)];

// ---- Éclats et confettis, pour une toile ----
// const e = new Eclats(); e.jaillir(x, y, "#F2B90F", 12); puis à chaque image : e.dessiner(g, dt)
class Eclats {
  constructor() { this.liste = []; }
  jaillir(x, y, couleur, n, force = 1, taille = 1) {
    if (DOUX_JEU) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = (2 + Math.random() * 5) * force; this.liste.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3 * force, t: 1, s: (4 + Math.random() * 6) * taille, c: couleur, r: Math.random() * 6 }); }
  }
  dessiner(g, dt, { gravite = .4, decalageY = 0 } = {}) {
    for (let i = this.liste.length - 1; i >= 0; i--) {
      const e = this.liste[i]; e.x += e.vx; e.y += e.vy; e.vy += gravite; e.t -= dt * 1.6; e.r += .2;
      if (e.t <= 0) { this.liste.splice(i, 1); continue; }
      g.save(); g.globalAlpha = Math.min(1, e.t * 2); g.translate(e.x, e.y - decalageY); g.rotate(e.r); g.fillStyle = e.c; g.fillRect(-e.s / 2, -e.s / 2, e.s, e.s); g.restore();
    }
  }
}

// ---- Minuteur doux : une barre qui se vide (sans chiffres), « ¡Último minuto! » 30 s avant la fin ----
// minuteurJeu({ barre, bandeau, annonce: "¡Último minuto! …", surFin }) → fonction pour l'arrêter
function minuteurJeu({ barre, bandeau, annonce = "¡Último minuto! Casi es hora de seguir.", surFin, duree = DUREE_JEU }) {
  const debut = Date.now(); let avise = false;
  const avant = Math.min(30000, duree * .25);
  const tic = setInterval(() => {
    const reste = Math.max(0, duree - (Date.now() - debut));
    barre.style.transform = `scaleX(${reste / duree})`;
    if (!avise && reste <= avant) { avise = true; bandeau.hidden = false; dire(annonce); }
    if (!reste) { clearInterval(tic); surFin(); }
  }, 250);
  return () => clearInterval(tic);
}
// Ancien nom, gardé pour ¡A casa! et Mi mundo
const minuteurPause = ({ barre, bandeau, surFin }) => minuteurJeu({ barre, bandeau, surFin, annonce: "¡Último juego! Casi es hora de seguir." });

// ---- Fin : bravo, puis on respire avec la ballena, puis « ¡Seguimos! » ----
function finDePause(conteneur, titre, phrase) {
  conteneur.innerHTML = `<div class="centre"><h2>${titre}</h2><p>${phrase}</p></div>`;
  conteneur.hidden = false;
  sonBien(); dire(titre.replace(/<[^>]+>/g, "") + " " + phrase + " Ahora, respira como una ballena.");
  setTimeout(() => {
    conteneur.innerHTML = `<div class="centre"><div class="souffle" id="souffleFin">Inhala</div><h2>Respira como una ballena</h2><p>Coge mucho aire… y sopla despacio.</p></div>`;
    let dedans = true;
    const tic = setInterval(() => { dedans = !dedans; const s = document.getElementById("souffleFin"); if (s) s.textContent = dedans ? "Inhala" : "Sopla"; }, 4000);
    setTimeout(() => {
      clearInterval(tic);
      // Pendant la pause : retour à la séance (2e séance proposée, ou « ¡Hasta mañana! »).
      // Depuis l'accueil : un autre jeu (le choix), ou l'accueil. Chaque partie s'arrête toujours seule.
      if (EN_PAUSE) {
        conteneur.innerHTML = `<div class="centre"><h2>¡Pausa terminada!</h2><p>Tu cerebro está listo.</p><a class="gros" href="seance.html?lecon=${encodeURIComponent(EN_PAUSE)}&despues">¡Seguimos!</a></div>`;
        dire("¡Pausa terminada! ¿Seguimos?");
      } else {
        conteneur.innerHTML = `<div class="centre"><h2>¡Muy bien!</h2><p>Tu cerebro está listo.</p><a class="gros" href="juegos.html">Otro juego</a><a class="gros clair" href="index.html">Volver</a></div>`;
        dire("¡Muy bien! ¿Otro juego, o volvemos?");
      }
    }, TEST_RAPIDE ? 4000 : 20000);
  }, 3500);
}
