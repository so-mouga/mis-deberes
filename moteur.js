// Moteur de séance : lit une leçon (lecons.js) et enchaîne ses étapes.
const $ = (id) => document.getElementById(id);
const scene = $("scene");
const ID = LECONS[new URLSearchParams(location.search).get("lecon")] ? new URLSearchParams(location.search).get("lecon") : Deberes.leconDuJour().id;
const L = LECONS[ID];
const LANGUE = L.langue;
document.title = "Deberes · " + L.titre;
$("pause").innerHTML = ICONES.pause;
$("redire").innerHTML = ICONES.hautparleur;
$("finBandeau").textContent = L.titre;

const FAIRE = { descubre, toca, elige, vrai, letras, papa, cuaderno, palitos, problema };
const ETAPES = [...L.etapes, { type: "fin" }];
$("chemin").innerHTML = ETAPES.map((e) => `<span class="case" role="img" aria-label="${Deberes.nomEtape(e)}" title="${Deberes.nomEtape(e)}">${ICONES[Deberes.ICONE[e.type]]}</span>`).join("");
const cases = [...$("chemin").children];
const parle = (t, v = .8) => dire(t, LANGUE, v);

// --- Consigne : toujours visible, toujours redisable ---
let redire = () => {};
function consigne(texte, voix) {
  $("texte").textContent = texte;
  redire = voix || (() => dire(texte));
  return redire();
}
$("redire").addEventListener("click", () => redire());

function vider() { scene.innerHTML = ""; scene.classList.remove("entre"); void scene.offsetWidth; scene.classList.add("entre"); }
function bouton(texte, classe = "") { const b = document.createElement("button"); b.className = "gros " + classe; b.textContent = texte; return b; }
const clic = (el) => new Promise((ok) => el.addEventListener("click", ok, { once: true }));

// Note un point raté dans le journal de la séance (deberes.js). « e.origen » : la leçon d'origine, pour le Repaso.
const rate = (e, tipo, clave, txt) => Deberes.erreur((e && e.origen) || ID, tipo, clave, txt);

// Montre la bonne réponse sans punir : rien ne change sur le choix raté, la bonne se soulève.
function montrer(bonne) {
  bonne.classList.remove("montre"); void bonne.offsetWidth; bonne.classList.add("montre");
}

// ---------- Descubre ----------
async function descubre(e) {
  for (const it of e.items) {
    vider();
    const c = cromo(it); c.classList.add("grand");
    const sens = document.createElement("p"); sens.className = "sens"; sens.textContent = "= " + it.es;
    const suite = bouton("Siguiente"); suite.style.marginTop = "auto";
    scene.append(c, sens, suite);
    consigne(e.consigne, () => direSuite([[e.consigne + ".", "es-ES"], [it.es, "es-ES"], [it.voz, LANGUE, .8]]));
    c.addEventListener("click", () => parle(it.voz));
    await clic(suite); sonTouche();
  }
}

// ---------- Escucha y toca ----------
let demoFaite = false;
function distracteurs(cible, items, proches) {
  const autres = items.filter((i) => i.voz !== cible.voz);
  if (!proches) return melange(autres).slice(0, 3);
  // Nombres qui se ressemblent : ±1, ±10, même unité.
  const n = +cible.texte;
  const pres = autres.filter((i) => [1, 10].includes(Math.abs(+i.texte - n)) || +i.texte % 10 === n % 10);
  return melange(pres).concat(melange(autres)).filter((v, k, a) => a.indexOf(v) === k).slice(0, 3);
}
async function toca(e) {
  let simplifier = false;
  for (const cible of melange(e.cibles || e.items).slice(0, e.n || 4)) {
    vider();
    const grille = document.createElement("div"); grille.className = "grille";
    let options = melange([cible, ...distracteurs(cible, e.items, e.proches)]);
    if (simplifier) options = melange([cible, options.find((o) => o !== cible)]);
    const cartes = options.map((o) => {
      const b = document.createElement("button"); b.className = "cromo choix"; b.dataset.voz = o.voz;
      b.innerHTML = cromo(o, { nom: false }).innerHTML; b.setAttribute("aria-label", "Opción"); grille.append(b); return b;
    });
    scene.append(grille);
    await consigne(e.consigne, () => direSuite([[e.consigne + ".", "es-ES"], [cible.voz, LANGUE, .8]]));
    const bonne = cartes.find((c) => c.dataset.voz === cible.voz);
    if (!demoFaite) { demoFaite = true; await demo(bonne); }
    let erreurs = 0;
    await new Promise((fini) => cartes.forEach((b) => b.addEventListener("click", async () => {
      if (b === bonne) { b.classList.add("bonne"); sonBien(); await parle(cible.voz); await attendre(400); fini(); }
      else {
        erreurs++; montrer(bonne); rate(e, "mot", cible.voz);
        if (erreurs >= 2) cartes.filter((c) => c !== bonne && c !== b).forEach((c) => (c.style.visibility = "hidden"));
        parle(cible.voz);
      }
    })));
    simplifier = erreurs >= 2;
  }
}

// La main montre une fois quoi faire : écouter, puis toucher.
async function demo(cible) {
  const main = document.createElement("div"); main.className = "main"; main.innerHTML = ICONES.main;
  const bulle = document.createElement("div"); bulle.className = "bulle"; bulle.textContent = "Así: escucha…";
  document.body.append(main, bulle);
  const r1 = $("redire").getBoundingClientRect(), r2 = cible.getBoundingClientRect();
  main.style.left = r1.left + 20 + "px"; main.style.top = r1.top + 26 + "px";
  Object.assign(bulle.style, { left: r1.right + 8 + "px", top: r1.top + 70 + "px" });
  await main.animate([{ transform: "scale(1)" }, { transform: "scale(.85)" }, { transform: "scale(1)" }], { duration: 500 }).finished;
  await attendre(500);
  bulle.textContent = "…¡y toca!";
  const dx = r2.left + r2.width / 2 - (r1.left + 20), dy = r2.top + r2.height / 2 - (r1.top + 26);
  Object.assign(bulle.style, { left: r2.left + 10 + "px", top: r2.top - 46 + "px" });
  await main.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx}px,${dy}px)` }], { duration: 1100, easing: "cubic-bezier(.45,0,.2,1)", fill: "forwards" }).finished;
  await main.animate([{ transform: `translate(${dx}px,${dy}px) scale(1)` }, { transform: `translate(${dx}px,${dy}px) scale(.82)` }, { transform: `translate(${dx}px,${dy}px) scale(1)` }], { duration: 500 }).finished;
  await attendre(400);
  main.remove(); bulle.remove();
  await dire("Ahora tú.");
}

// ---------- Elige (question classique, ou le train des mois) ----------
async function elige(e) {
  for (const q of e.questions) {
    vider();
    if (q.wagons) {
      const tren = document.createElement("div"); tren.className = "tren";
      tren.innerHTML = q.wagons.map((w) => `<span class="wagon">${w}</span>`).join("") + `<span class="wagon vide">?</span>`;
      scene.append(tren);
    } else if (q.img) {
      const img = cromo({ img: q.img }, { nom: false }); img.classList.add("image"); scene.append(img);
    }
    const qt = document.createElement("p"); qt.className = "question"; qt.textContent = q.q; scene.append(qt);
    const liste = document.createElement("div"); liste.className = "mots";
    const boutons = melange([q.bonne, ...q.autres]).map((o) => { const b = document.createElement("button"); b.className = "mot"; b.textContent = o; liste.append(b); return b; });
    scene.append(liste);
    const enQuestion = q.dire || [[q.q, /^What/.test(q.q) ? LANGUE : "es-ES", .85]];
    const lire = async () => {
      await direSuite(enQuestion);
      for (const b of boutons) { b.classList.add("lu"); await parle(b.textContent); b.classList.remove("lu"); }
    };
    consigne(e.consigne, lire);
    const bonne = boutons.find((b) => b.textContent === q.bonne);
    await new Promise((fini) => boutons.forEach((b) => b.addEventListener("click", async () => {
      if (b === bonne) {
        speechSynthesis.cancel(); b.classList.add("bonne"); sonBien();
        const vide = scene.querySelector(".wagon.vide"); if (vide) { vide.classList.remove("vide"); vide.textContent = q.bonne; }
        await parle(q.bonne); await attendre(400); fini();
      } else { montrer(bonne); parle(q.bonne); rate(e, "mot", q.bonne); }
    })));
  }
}

// ---------- ¿Verdad o mentira? (Where's mum?) ----------
async function vrai(e) {
  for (const q of e.questions) {
    vider();
    const img = cromo({ casa: q.casa }, { nom: false }); img.classList.add("image");
    const qt = document.createElement("p"); qt.className = "question"; qt.textContent = q.phrase;
    const boutons = document.createElement("div"); boutons.className = "boutons";
    const si = bouton("Sí", "vert"); si.insertAdjacentHTML("afterbegin", ICONES.ok);
    const no = bouton("No", "clair"); no.insertAdjacentHTML("afterbegin", ICONES.croix);
    boutons.append(si, no);
    scene.append(img, qt, boutons);
    consigne(e.consigne, () => direSuite([["Where's mum?", LANGUE, .85], [q.phrase, LANGUE, .8], ["¿Es verdad?", "es-ES"]]));
    const bonne = q.vrai ? si : no;
    await new Promise((fini) => [si, no].forEach((b) => b.addEventListener("click", async () => {
      if (b === bonne) {
        b.classList.add("bonne"); sonBien();
        await direSuite(q.vrai ? [["Yes!", LANGUE], [q.phrase, LANGUE, .8]] : [["No.", LANGUE], [q.phrase, LANGUE, .8], [q.correction, LANGUE, .8]]);
        await attendre(300); fini();
      } else {
        montrer(bonne); rate(e, "frase", q.phrase);
        direSuite([["Mira bien dónde está mamá.", "es-ES"], [q.vrai ? q.phrase : q.correction, LANGUE, .8]]);
      }
    })));
  }
}

// ---------- Letras que faltan ----------
async function letras(e) {
  for (const m of e.mots) {
    vider();
    const img = cromo(m.item, { nom: false }); img.classList.add("petit");
    const rangee = document.createElement("div"); rangee.className = "cases";
    const trous = [];
    [...m.trous].forEach((ch, i) => {
      const s = document.createElement("span");
      if (ch === " ") s.className = "l espace";
      else if (ch === "_") { s.className = "l trou"; s.dataset.lettre = m.mot[i]; trous.push(s); }
      else { s.className = "l"; s.textContent = ch; }
      rangee.append(s);
    });
    const manquantes = trous.map((t) => t.dataset.lettre);
    const intrus = melange([..."aeiou"].filter((l) => !manquantes.includes(l))).slice(0, 2);
    const tuiles = document.createElement("div"); tuiles.className = "tuiles";
    melange([...manquantes, ...intrus]).forEach((l) => { const b = document.createElement("button"); b.className = "tuile"; b.textContent = l; tuiles.append(b); });
    scene.append(img, rangee, tuiles);
    consigne(e.consigne, () => direSuite([[e.consigne + ".", "es-ES"], [m.mot, LANGUE, .7]]));
    let n = 0; trous[0].classList.add("suivant");
    await new Promise((fini) => tuiles.querySelectorAll(".tuile").forEach((b) => b.addEventListener("click", async () => {
      if (b.classList.contains("partie")) return;
      const t = trous[n];
      if (b.textContent === t.dataset.lettre) {
        sonTouche(); b.classList.add("partie");
        t.textContent = b.textContent; t.classList.remove("suivant"); t.classList.add("rempli");
        n++;
        if (n < trous.length) trous[n].classList.add("suivant");
        else { sonBien(); await parle(m.mot); await attendre(500); fini(); }
      } else {
        b.classList.add("non"); rate(e, "mot", m.mot); setTimeout(() => b.classList.remove("non"), 900);
        parle(m.mot, .6);
      }
    })));
  }
}

// ---------- Con un mayor ----------
// Pensée pour l'adulte qui en sait le moins : la grand-mère de Dorian ne parle ni français ni anglais.
// La voix lit la question ; l'adulte écoute la réponse au haut-parleur et compare, à l'oreille, avec ce que dit Dorian.
const AIDE_MAYOR = "Pregúntale a Dorian. Luego toca el altavoz y escucha la respuesta. ¿Ha dicho lo mismo?";
const langueDe = (t) => (/^\s*[¿¡]/.test(t) || LANGUE === "es-ES" ? "es-ES" : LANGUE);

// La première fois sur ce téléphone : un écran qui explique la séance à l'adulte qui aide.
async function premiereFoisMayor() {
  const CLE = "dorian.mayor.visto";
  try { if (localStorage.getItem(CLE) && !PARAMS.has("mayor")) return; } catch {}
  if (DEMO && !PARAMS.has("mayor")) return;
  const v = $("voileMayor");
  v.querySelector(".icone-pause").innerHTML = ICONES.pause;
  v.hidden = false;
  direSuite([["Para el adulto que ayuda.", "es-ES"], ...[...v.querySelectorAll("li")].map((li) => [li.textContent, "es-ES"])]);
  await clic($("entendido"));
  speechSynthesis.cancel(); sonTouche();
  v.hidden = true;
  try { localStorage.setItem(CLE, "1"); } catch {}
}

async function papa(e) {
  await premiereFoisMayor();
  const qs = [...e.questions];
  let premiere = true;
  while (qs.length) {
    const item = qs.shift();
    vider();
    const carte = document.createElement("div"); carte.className = "carte-parent";
    carte.innerHTML = `<p class="pour-mayor">${AIDE_MAYOR}</p><p class="q">${item.q}</p>${item.item ? cromo(item.item, { nom: false }).outerHTML : ""}
      <div class="reponse"><span>Respuesta<br><b>${item.r}</b></span><button class="ecoute" aria-label="Escuchar la respuesta">${ICONES.hautparleur}<span>Escuchar</span></button></div>`;
    const boutons = document.createElement("div"); boutons.className = "boutons";
    const oui = bouton("Sí, lo ha dicho", "vert"); oui.insertAdjacentHTML("afterbegin", ICONES.ok);
    const encore = bouton("Otra vez", "clair"); encore.insertAdjacentHTML("afterbegin", ICONES.encore);
    boutons.append(oui, encore);
    scene.append(carte, boutons);
    carte.querySelector(".ecoute").addEventListener("click", () => { speechSynthesis.cancel(); parle(item.r.replace(/…|\(.*?\)|\+/g, "")); });
    // La consigne pour l'adulte est dite à la première question (et toujours avec le bouton « escuchar otra vez »).
    const question = [item.q, langueDe(item.q), .85];
    $("texte").textContent = "Con un mayor";
    redire = () => direSuite([[AIDE_MAYOR, "es-ES"], question]);
    if (premiere) redire(); else direSuite([question]);
    premiere = false;
    const choisi = await Promise.race([clic(oui).then(() => "oui"), clic(encore).then(() => "encore")]);
    speechSynthesis.cancel();
    if (choisi === "oui") { sonBien(); await attendre(500); }
    else { rate(e, "papa", item.q + " · " + item.r, item.q); item.repasse = (item.repasse || 0) + 1; if (item.repasse < 2) qs.push(item); await dire("Vale, luego otra vez."); }
  }
}

// ---------- En tu cuaderno ----------
async function cuaderno(e) {
  vider();
  let cahier;
  if (e.items.every((it) => !it.img)) {
    // Que des mots : une liste sur les lignes du cahier, à recopier.
    cahier = document.createElement("ol"); cahier.className = "lignes";
    e.items.forEach((it) => { const li = document.createElement("li"); li.textContent = it.nom; li.addEventListener("click", () => parle(it.nom)); cahier.append(li); });
  } else {
    cahier = document.createElement("div"); cahier.className = "cahier" + (e.items.length > 4 ? " trois" : "");
    e.items.forEach((it) => cahier.append(cromo(it)));
  }
  const note = document.createElement("p"); note.className = "note"; note.textContent = "Despacio y con letra bonita.";
  const fait = bouton("¡Hecho!", "vert"); fait.insertAdjacentHTML("afterbegin", ICONES.ok); fait.style.marginTop = "auto";
  scene.append(cahier, note, fait);
  consigne(e.consigne, () => direSuite([[e.voz, "es-ES"], [e.items.map((i) => i.nom).join(". "), LANGUE, .7]]));
  await clic(fait); sonBien();
}

// ---------- Fin : les cromos se collent, puis la pause ----------
async function fin() {
  Deberes.terminer(); // la séance part vers le suivi (ou en file d'attente), avant le sobre
  const v = $("voileFin");
  v.hidden = false;
  const a = tirerAnimal();
  if (!a) {
    v.innerHTML = `<h2>¡Álbum completo!</h2><p>Tienes los ${ANIMAUX.length} animales. ¡Eres un campeón!</p>`;
    await dire("¡Muy bien, Dorian! ¡Tu álbum de animales está completo!");
    await attendre(1500); return descanso();
  }
  // 1. Le paquet fermé
  v.innerHTML = `<h2>¡Muy bien, Dorian!</h2><p>Has terminado los deberes. Toca tu sobre para abrirlo.</p>
    <button class="sobre${a.oro ? " oro" : ""}" id="sobre" aria-label="Abrir el sobre"><span class="rabat"></span><span class="etoile">${ICONES.etoile}</span></button>`;
  dire("¡Muy bien, Dorian! Has terminado. Toca tu sobre para abrirlo.");
  await clic($("sobre"));
  speechSynthesis.cancel();
  $("sobre").classList.add("ouvre"); sonPegar();
  await attendre(700);
  // 2. L'animal
  const carte = cromoAnimal(a); carte.classList.add("revele");
  v.innerHTML = "";
  const titre = document.createElement("h2"); titre.textContent = a.oro ? "¡Cromo dorado!" : "¡Cromo nuevo!";
  const noms = document.createElement("p"); noms.className = "langues"; noms.textContent = `${a.en} · ${a.fr}`;
  const dato = document.createElement("p"); dato.className = "dato"; dato.textContent = a.dato;
  const ok = bouton("¡A mi álbum!");
  v.append(titre, carte, noms, dato, ok);
  sonBien();
  await direSuite([[a.oro ? "¡Un cromo dorado!" : "¡Un cromo nuevo!", "es-ES"], [a.es + ".", "es-ES"], [a.dato, "es-ES"]]);
  carte.addEventListener("click", () => dire(a.dato));
  await clic(ok);
  garder(a.n); sonTouche();
  descanso();
}

function descanso() {
  const v = $("voileFin");
  v.innerHTML = `<div class="horloge"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="68" stroke="rgba(255,255,255,.15)"/><circle id="arc" cx="75" cy="75" r="68" stroke="#F2B90F" stroke-linecap="round" stroke-dasharray="427" stroke-dashoffset="0"/></svg><span id="reste">5:00</span></div>
    <h2>¡Descanso!</h2><p>Ahora: 5 minutos de tu juego, o salta y muévete un poco. Te aviso cuando acabe.</p><a class="gros clair" href="album-animales.html">Ver mis animales</a>`;
  dire("¡Descanso! Ahora tienes cinco minutos para tu juego. Te aviso cuando acabe.");
  // Une 2e séance, seulement proposée (jamais une 3e) : à la fin du minuteur, ou plus tôt avec « Ya he descansado ».
  const propo = Deberes.deuxiemeSeance(ID);
  let tic;
  if (propo) {
    const b = bouton("Ya he descansado", "clair");
    b.addEventListener("click", () => { clearInterval(tic); proposer(propo); });
    v.append(b);
  }
  const debut = Date.now(), total = 5 * 60 * 1000;
  tic = setInterval(() => {
    const r = Math.max(0, total - (Date.now() - debut)), s = Math.ceil(r / 1000);
    $("reste").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    $("arc").style.strokeDashoffset = 427 * (1 - r / total);
    if (!r) {
      clearInterval(tic); sonBien();
      if (propo) proposer(propo); else dire("¡Fin del descanso! Deja el juego, ¿seguimos?");
    }
  }, 500);
}

// « ¿Hacemos también el inglés hoy? » : Dorian peut toujours dire non, sans rien perdre.
function proposer(p) {
  const v = $("voileFin");
  v.innerHTML = `<h2>¡Muy bien, Dorian!</h2><p>Has terminado ${Deberes.matiere(ID)}. Tu descanso ha acabado.</p>
    <p class="propo">${p.question}<br><span>${p.raison}</span></p>
    <a class="gros" href="seance.html?lecon=${p.id}">${p.oui}</a><a class="gros clair" href="index.html">No, hoy ya está</a>`;
  direSuite([["¡Muy bien, Dorian! Tu descanso ha acabado.", "es-ES"], [p.question, "es-ES"], [p.raison, "es-ES"]]);
}

// ---------- Pause demandée par Dorian ----------
let souffleTic;
$("pause").addEventListener("click", () => {
  speechSynthesis.cancel();
  Deberes.pause();
  $("voilePause").hidden = false;
  dire("Vale. Una pausa. Respira conmigo.");
  let dedans = true; $("souffle").textContent = "Inhala";
  souffleTic = setInterval(() => { dedans = !dedans; $("souffle").textContent = dedans ? "Inhala" : "Exhala"; }, 4000);
});
$("seguir").addEventListener("click", () => { clearInterval(souffleTic); $("voilePause").hidden = true; redire(); });

// ---------- Déroulé ----------
// Mode démo (pour les captures) : ?demo&etape=N ouvre directement l'étape N, sans voix.
const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.has("demo");
// En démo, rien n'est enregistré, sauf avec « &registro » (pour tester le suivi).
const REGISTRAR = !DEMO || PARAMS.has("registro");
Deberes.recuperer(); // une séance d'avant restée inachevée part dans la file
Sync.vider();
Sync.synchroniserProgreso(); // les cromos des autres téléphones : le sobre ne donnera pas un animal déjà gagné ailleurs
if (DEMO) { window.dire = async () => {}; demoFaite = true; if (PARAMS.has("pause")) setTimeout(() => $("pause").click(), 300); }

(async () => {
  vider();
  const depart = DEMO ? +PARAMS.get("etape") || 0 : 0;
  if (!DEMO) {
    const go = bouton("¡Empezamos!"); go.style.marginTop = "auto";
    scene.append(go);
    $("texte").textContent = "Hoy: " + L.sujet;
    await clic(go); sonTouche(); // le premier toucher autorise la voix
  }
  if (REGISTRAR) Deberes.commencer(ID);
  for (const [i, e] of ETAPES.entries()) {
    if (i < depart) continue;
    cases.forEach((c, j) => { c.classList.toggle("faite", j < i); c.classList.toggle("ici", j === i); });
    if (e.type === "fin") await fin(); else await FAIRE[e.type](e);
  }
})();
