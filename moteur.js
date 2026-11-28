// Moteur de séance : lit une leçon (lecons.js) et enchaîne ses étapes.
const $ = (id) => document.getElementById(id);
const scene = $("scene");
const ID = LECONS[new URLSearchParams(location.search).get("lecon")] ? new URLSearchParams(location.search).get("lecon") : Deberes.leconDuJour().id;
const L = LECONS[ID];
let LANGUE = L.langue; // change pendant la révision, selon la leçon d'origine de l'exercice
document.title = "Deberes · " + L.titre;
$("pause").innerHTML = ICONES.pause;
$("redire").innerHTML = ICONES.hautparleur;
$("finBandeau").textContent = L.titre;

const FAIRE = { descubre, toca, elige, vrai, letras, papa, cuaderno, palitos, problema };
const ETAPES = [...L.etapes, { type: "fin" }];
$("chemin").innerHTML = ETAPES.map((e) => `<span class="case" role="img" aria-label="${Deberes.nomEtape(e)}" title="${Deberes.nomEtape(e)}">${ICONES[Deberes.ICONE[e.type]]}</span>`).join("");
const cases = [...$("chemin").children];
MiniPartidas.decorer($("chemin"), ETAPES.length - 1); // mode mini-parties : une manette entre les blocs, le paquet au bout
const parle = (t, v = .8) => dire(t, LANGUE, v);

// --- Consigne : toujours visible, toujours redisable ---
let redire = () => {};
function consigne(texte, voix) {
  $("texte").textContent = texte;
  redire = voix || (() => dire(texte));
  return redire();
}
$("redire").addEventListener("click", () => redire());

// La consigne complète au premier coup ; ensuite, seulement ce qui change (le mot, le nombre…).
// Elle reste affichée, et son haut-parleur la redit toujours en entier.
function consigneSuite(texte, toutDire, seulement, premiere) {
  if (premiere) return consigne(texte, toutDire);
  $("texte").textContent = texte; redire = toutDire;
  return seulement();
}

function vider() { scene.innerHTML = ""; scene.classList.remove("entre"); void scene.offsetWidth; scene.classList.add("entre"); }
function bouton(texte, classe = "") { const b = document.createElement("button"); b.className = "gros " + classe; b.textContent = texte; return b; }
const clic = (el) => new Promise((ok) => el.addEventListener("click", ok, { once: true }));

// Note un point raté dans le journal de la séance (deberes.js). « e.origen » : la leçon d'origine, pour le Repaso.
const rate = (e, tipo, clave, txt) => Deberes.erreur((e && e.origen) || ID, tipo, clave, txt);

// Montre la bonne réponse sans punir : rien ne change sur le choix raté, la bonne se soulève.
function montrer(bonne) {
  bonne.classList.remove("montre"); void bonne.offsetWidth; bonne.classList.add("montre");
}

// ---------- Anti-précipitation (sans punition) ----------
// Les réponses ne réagissent qu'une fois la voix finie (léger état « attente ») ; après une erreur, environ 1,5 s
// de calme pendant que la voix redit la bonne réponse. Cliquer au hasard ne fait donc plus gagner de temps.
// On compte les erreurs très rapides (moins d'1 s) : drapeau « respuestas al azar » dans le suivi parent.
const Rythme = { reponses: 0, hasard: 0 };
// « Ritmo tranquilo » (page parents, ou ?tranquilo pour tester) : toutes les attentes sont plus longues.
const TRANQUILO = PARAMS_T().has("tranquilo") || !!(typeof Sync !== "undefined" && Sync.pausa().tranquilo);
function PARAMS_T() { return new URLSearchParams(location.search); }
const LENT = TRANQUILO ? 1.7 : 1;
function garde(elements) {
  let ouvert = false, calme = false, depuis = 0;
  const marquer = (on) => elements.forEach((el) => el.classList.toggle("attente", on));
  marquer(true);
  return {
    // S'ouvre quand la voix a fini (filet : jamais plus de 12 s d'attente).
    ouvrir(voix) {
      return Promise.race([Promise.resolve(voix), attendre(12000)]).then(() => attendre(TRANQUILO ? 1200 : 0)).then(() => { ouvert = true; depuis = Date.now(); if (!calme) marquer(false); });
    },
    peut: () => ouvert && !calme,
    async reponse(juste, voix) {
      Rythme.reponses++;
      if (juste) return;
      if (Date.now() - depuis < 1000) Rythme.hasard++;
      calme = true; marquer(true);
      await Promise.race([Promise.all([Promise.resolve(voix), attendre(1500 * LENT)]), attendre(4000 * LENT)]);
      calme = false; depuis = Date.now(); if (ouvert) marquer(false);
    },
  };
}

// ---------- Le temps de travail (hors pauses demandées) ----------
const Travail = {
  debut: 0, pauses: 0, depuis: 0,
  ms() { return this.debut ? Date.now() - this.debut - this.pauses - (this.depuis ? Date.now() - this.depuis : 0) : 0; },
};

// ---------- Descubre ----------
async function descubre(e) {
  for (const [rang, it] of e.items.entries()) {
    vider();
    const c = cromo(it); c.classList.add("grand");
    const sens = document.createElement("p"); sens.className = "sens"; sens.textContent = "= " + it.es;
    // Un gros bouton clair « Escúchalo y repítelo » (plus intuitif que toucher le dessin, qui marche aussi).
    const repetir = document.createElement("button"); repetir.className = "repetir";
    repetir.innerHTML = `${ICONES.hautparleur}<span>Escúchalo y repítelo</span>`;
    const dilo = document.createElement("p"); dilo.className = "dilo";
    const suite = bouton("Siguiente"); suite.style.marginTop = "auto";
    scene.append(c, sens, repetir, dilo, suite);
    // Pour éviter de passer en tapant vite : il écoute, touche le dessin, réentend le mot et le répète à voix haute.
    // « Siguiente » ne s'active qu'ensuite (jamais de blocage : filet de 20 s).
    suite.classList.add("attente"); repetir.classList.add("a-toucher");
    // La consigne n'est dite qu'au premier mot ; ensuite, seulement le mot (« Doce… douze »).
    // Le haut-parleur de la consigne redit toujours tout.
    const toutDire = () => direSuite([[e.consigne + ".", "es-ES"], [it.es, "es-ES"], [it.voz, LANGUE, .8]]);
    let voix;
    if (rang === 0) voix = consigne(e.consigne, toutDire);
    else { $("texte").textContent = e.consigne; redire = toutDire; voix = direSuite([[it.es, "es-ES"], [it.voz, LANGUE, .8]]); }
    let touche = false;
    const pret = new Promise((ok) => {
      const ecouter = async () => {
        speechSynthesis.cancel();
        repetir.classList.add("joue");
        await parle(it.voz);
        repetir.classList.remove("joue");
        if (touche) return;
        touche = true; repetir.classList.remove("a-toucher"); repetir.classList.add("fait");
        dilo.textContent = "¡Dilo tú!"; dilo.classList.add("a-toi");
        // « Siguiente » s'active peu après « ¡Dilo tú! » (le temps de répéter), sans attendre la fin de la voix.
        dire("¡Dilo tú!");
        await attendre(1200 * LENT);
        ok();
      };
      repetir.addEventListener("click", ecouter);
      c.addEventListener("click", ecouter);
      Promise.resolve(voix).then(() => attendre(20000)).then(ok);
    });
    await pret;
    suite.classList.remove("attente");
    await clic(suite);
    sonTouche();
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
  for (const [rang, cible] of melange(e.cibles || e.items).slice(0, e.n || 4).entries()) {
    vider();
    const grille = document.createElement("div"); grille.className = "grille";
    let options = melange([cible, ...distracteurs(cible, e.items, e.proches)]);
    if (simplifier) options = melange([cible, options.find((o) => o !== cible)]);
    const cartes = options.map((o) => {
      const b = document.createElement("button"); b.className = "cromo choix"; b.dataset.voz = o.voz;
      b.innerHTML = cromo(o, { nom: false }).innerHTML; b.setAttribute("aria-label", "Opción"); grille.append(b); return b;
    });
    scene.append(grille);
    const g = garde(cartes);
    await g.ouvrir(consigneSuite(e.consigne, () => direSuite([[e.consigne + ".", "es-ES"], [cible.voz, LANGUE, .8]]),
      () => direSuite([[cible.voz, LANGUE, .8]]), rang === 0));
    const bonne = cartes.find((c) => c.dataset.voz === cible.voz);
    if (!demoFaite) { demoFaite = true; await demo(bonne); }
    let erreurs = 0, finie = false;
    await new Promise((fini) => cartes.forEach((b) => b.addEventListener("click", async () => {
      if (!g.peut() || finie) return;
      if (b === bonne) { finie = true; g.reponse(true); b.classList.add("bonne"); sonBien(); await parle(cible.voz); await attendre(400); fini(); }
      else {
        erreurs++; montrer(bonne); rate(e, "mot", cible.voz);
        if (erreurs >= 2) cartes.filter((c) => c !== bonne && c !== b).forEach((c) => (c.style.visibility = "hidden"));
        g.reponse(false, parle(cible.voz));
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
    // Les réponses ne s'activent qu'une fois la question et les mots entendus.
    const g = garde(boutons);
    g.ouvrir(consigne(e.consigne, lire));
    const bonne = boutons.find((b) => b.textContent === q.bonne);
    let finie = false;
    await new Promise((fini) => boutons.forEach((b) => b.addEventListener("click", async () => {
      if (!g.peut() || finie) return;
      if (b === bonne) {
        finie = true; g.reponse(true);
        speechSynthesis.cancel(); b.classList.add("bonne"); sonBien();
        const vide = scene.querySelector(".wagon.vide"); if (vide) { vide.classList.remove("vide"); vide.textContent = q.bonne; }
        await parle(q.bonne); await attendre(400); fini();
      } else { montrer(bonne); rate(e, "mot", q.bonne); g.reponse(false, parle(q.bonne)); }
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
    const g = garde([si, no]);
    g.ouvrir(consigne(e.consigne, () => direSuite([["Where's mum?", LANGUE, .85], [q.phrase, LANGUE, .8], ["¿Es verdad?", "es-ES"]])));
    const bonne = q.vrai ? si : no;
    let finie = false;
    await new Promise((fini) => [si, no].forEach((b) => b.addEventListener("click", async () => {
      if (!g.peut() || finie) return;
      if (b === bonne) {
        finie = true; g.reponse(true);
        b.classList.add("bonne"); sonBien();
        await direSuite(q.vrai ? [["Yes!", LANGUE], [q.phrase, LANGUE, .8]] : [["No.", LANGUE], [q.phrase, LANGUE, .8], [q.correction, LANGUE, .8]]);
        await attendre(300); fini();
      } else {
        montrer(bonne); rate(e, "frase", q.phrase);
        g.reponse(false, direSuite([["Mira bien dónde está mamá.", "es-ES"], [q.vrai ? q.phrase : q.correction, LANGUE, .8]]));
      }
    })));
  }
}

// ---------- Letras que faltan ----------
// Lettres manquantes, du palier 1 (une lettre) au palier 3 (le mot entier).
// Les mots composés passent à la ligne entre les mots ou après un trait d'union, jamais au milieu.
const LETTRES_INTRUS = "aeiourstnlcdmpv";
async function letras(e) {
  let rangL = 0;
  for (const m of e.mots) {
    vider();
    const img = cromo(m.item, { nom: false }); img.classList.add("petit");
    if (/[ -]/.test(m.trous)) img.classList.add("mini"); // mot composé (sur 2 lignes) : dessin plus petit pour tout faire tenir
    const rangee = document.createElement("div"); rangee.className = "cases";
    const groupes = m.trous.match(/[^ -]+-?|-/g) || [];
    if (Math.max(...groupes.map((x) => x.length)) > 7) rangee.classList.add("serre");
    const trous = [];
    let i = 0;
    for (const gr of groupes) {
      while (m.trous[i] === " ") i++;
      const bloc = document.createElement("span"); bloc.className = "bloc";
      for (const ch of gr) {
        const s = document.createElement("span");
        if (ch === "_") { s.className = "l trou"; s.dataset.lettre = m.mot[i]; trous.push(s); }
        else { s.className = "l"; s.textContent = ch; }
        bloc.append(s); i++;
      }
      rangee.append(bloc);
    }
    const manquantes = trous.map((t) => t.dataset.lettre);
    // Deux fausses lettres, voyelles ou consonnes : jamais une lettre du mot.
    const intrus = melange([...LETTRES_INTRUS].filter((l) => !m.mot.includes(l))).slice(0, 2);
    const tuiles = document.createElement("div"); tuiles.className = "tuiles";
    melange([...manquantes, ...intrus]).forEach((l) => { const b = document.createElement("button"); b.className = "tuile"; b.textContent = l; tuiles.append(b); });
    if (e.palier) {
      const p = document.createElement("div"); p.className = "palier"; p.setAttribute("aria-hidden", "true");
      p.innerHTML = [1, 2, 3].map((n) => `<i${n <= e.palier ? ' class="on"' : ""}></i>`).join("");
      scene.append(img, p, rangee, tuiles);
    } else scene.append(img, rangee, tuiles);
    const g = garde([tuiles]);
    g.ouvrir(consigneSuite(e.consigne, () => direSuite([[e.consigne + ".", "es-ES"], [m.voz || m.mot, LANGUE, .7]]),
      () => direSuite([[m.voz || m.mot, LANGUE, .7]]), rangL++ === 0));
    let n = 0; trous[0].classList.add("suivant");
    await new Promise((fini) => tuiles.querySelectorAll(".tuile").forEach((b) => b.addEventListener("click", async () => {
      if (b.classList.contains("partie") || !g.peut() || n >= trous.length) return;
      const t = trous[n];
      if (b.textContent === t.dataset.lettre) {
        sonTouche(); b.classList.add("partie"); g.reponse(true);
        t.textContent = b.textContent; t.classList.remove("suivant"); t.classList.add("rempli");
        n++;
        if (n < trous.length) trous[n].classList.add("suivant");
        else { sonBien(); await parle(m.voz || m.mot); await attendre(500); fini(); }
      } else {
        b.classList.add("non"); rate(e, "mot", m.mot); setTimeout(() => b.classList.remove("non"), 900);
        g.reponse(false, parle(m.voz || m.mot, .6));
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
    carte.innerHTML = `<p class="pour-mayor">Para el adulto: pregunta, toca « Escuchar » y compara.</p><p class="q">${item.q}</p>${item.item ? cromo(item.item, { nom: false }).outerHTML : ""}
      <div class="reponse${item.r.length > 28 ? " long" : ""}"><span>Respuesta<br><b>${item.r}</b></span><button class="ecoute" aria-label="Escuchar la respuesta">${ICONES.hautparleur}<span>Escuchar</span></button></div>`;
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
  // « tirage » : la dictée pioche quelques mots au hasard, différents à chaque séance.
  const items = e.tirage ? melange(e.items).slice(0, e.tirage) : e.items;
  vider();
  let cahier;
  if (e.dictee) {
    // Dictado : l'appli dit le mot, Dorian l'écrit sans modèle ; l'adulte découvre la solution pour comparer.
    cahier = document.createElement("ul"); cahier.className = "dictee";
    items.forEach((it) => {
      const li = document.createElement("li");
      const vu = it.img ? `<span class="pastille">${DESSINS[it.img]}</span>` : `<span class="n">${it.texte}</span>`;
      li.innerHTML = `${vu}<button class="ecoute-mot" aria-label="Escuchar">${ICONES.hautparleur}</button><span class="trait"></span>`;
      li.querySelector(".ecoute-mot").addEventListener("click", () => { speechSynthesis.cancel(); parle(it.voz || it.nom, .7); });
      cahier.append(li);
    });
  } else if (items.every((it) => !it.img)) {
    // Que des mots : une liste sur les lignes du cahier, à recopier.
    cahier = document.createElement("ol"); cahier.className = "lignes";
    items.forEach((it) => { const li = document.createElement("li"); li.textContent = it.nom; li.addEventListener("click", () => parle(it.nom)); cahier.append(li); });
  } else {
    cahier = document.createElement("div"); cahier.className = "cahier" + (items.length > 4 ? " trois" : "");
    items.forEach((it) => cahier.append(cromo(it)));
  }
  const note = document.createElement("p"); note.className = "note"; note.textContent = e.dictee ? "Escríbelo sin mirar." : "Despacio y con letra bonita.";
  let voir = null;
  if (e.dictee) {
    voir = document.createElement("button"); voir.className = "voir";
    voir.innerHTML = `${ICONES.oeil}<span>Para el adulto: ver la solución</span>`;
    voir.addEventListener("click", () => {
      cahier.querySelectorAll(".trait").forEach((t, i) => { t.className = "sol"; t.textContent = items[i].nom; });
      note.textContent = "Mirad juntos: ¿está igual en el cuaderno?"; voir.remove();
    });
  }
  const fait = bouton("¡Hecho!", "vert"); fait.insertAdjacentHTML("afterbegin", ICONES.ok); fait.style.marginTop = "auto";
  // « ¡Hecho! » se remplit comme une jauge, le temps réel d'écrire (environ 8 s par mot), puis s'active.
  fait.classList.add("jauge", "attente");
  const dureeEcriture = items.length * 8000 * LENT;
  fait.style.setProperty("--duree", dureeEcriture + "ms");
  requestAnimationFrame(() => fait.classList.add("remplit"));
  setTimeout(() => fait.classList.remove("attente"), dureeEcriture);
  scene.append(...[cahier, note, voir, fait].filter(Boolean));
  // Dictado : chaque mot, puis un temps pour l'écrire.
  if (e.dictee) consigne(e.consigne, async () => { await dire(e.voz, "es-ES"); for (const i of items) { await dire(i.voz || i.nom, LANGUE, .7); await attendre(4000 * LENT); } });
  else consigne(e.consigne, () => direSuite([[e.voz, "es-ES"], [items.map((i) => i.nom).join(". "), LANGUE, .7]]));
  await new Promise((ok) => fait.addEventListener("click", () => { if (!fait.classList.contains("attente")) ok(); }));
  sonBien();
}

// ---------- Fin : le sobre, puis (si la séance a été trop rapide) de la révision, puis la pause ----------
async function fin() {
  const base = Travail.ms(); // le temps passé sur les étapes de la leçon
  const v = $("voileFin");
  v.hidden = false;
  const a = tirerAnimal();
  if (!a) {
    v.innerHTML = `<h2>¡Álbum completo!</h2><p>Tienes los ${ANIMAUX.length} animales. ¡Eres un campeón!</p>`;
    await dire("¡Muy bien, Dorian! ¡Tu álbum de animales está completo!");
    await attendre(1500);
  } else {
    // 1. Le paquet fermé : la récompense de la séance, toujours donnée.
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
  }
  // 3. La pause se mérite au temps de travail : sinon, un peu de révision d'abord.
  //    Pas en mode mini-parties : là, chaque bloc fini a déjà donné sa partie, et la séance s'arrête toute seule.
  if (!MiniPartidas.actif) await revision();
  // 4. La séance part vers le suivi (avec ses drapeaux), le ticket de jeu est gagné, puis la pause.
  const avisos = [];
  if (base < 3 * 60 * 1000 && L.etapes.length >= 4) avisos.push("rapida");
  if (Rythme.reponses >= 4 && Rythme.hasard * 2 > Rythme.reponses) avisos.push("azar");
  Deberes.terminer({ avisos });
  if (MiniPartidas.actif) return deberesTerminados();
  descanso();
}

// Mode mini-parties : la fin automatique. La 2e séance est seulement proposée, comme après la grande pause.
function deberesTerminados() {
  const v = $("voileFin");
  v.hidden = false;
  const propo = Deberes.deuxiemeSeance(ID);
  if (propo) return proposer(propo, "¡Deberes terminados!");
  v.innerHTML = `<h2>¡Deberes terminados!</h2><p>¡Muy bien, Dorian! Hasta mañana.</p>
    <a class="gros" href="index.html">Volver</a><a class="gros clair" href="album-animales.html">Ver mis animales</a>`;
  dire("¡Deberes terminados! Muy bien, Dorian. ¡Hasta mañana!");
}

// La révision : des exercices autonomes jusqu'au temps de travail réglé par les parents (10 min par défaut).
// Pas de chrono visible ; la barre d'étapes repart, et la pause arrive à la fin de l'exercice en cours, jamais au milieu.
// En démo, seulement avec « &trabajo=N » (N secondes de travail demandées, pour les tests).
async function revision() {
  if (DEMO && !PARAMS.has("trabajo")) return;
  const minMs = PARAMS.has("trabajo") ? +PARAMS.get("trabajo") * 1000 : Sync.pausa().trabajo * 60000;
  if (Travail.ms() >= minMs) return;
  const file = Deberes.etapesRevision(ID);
  if (!file.length) return;
  $("voileFin").hidden = true;
  vider();
  $("texte").textContent = "Un poco de repaso";
  await dire("¡Muy bien! Antes de la pausa, repasamos un poco.");
  for (let k = 0; Travail.ms() < minMs; k++) {
    // La barre d'étapes : 4 exercices de révision à la fois.
    if (k % 4 === 0) {
      const lot = [0, 1, 2, 3].map((j) => file[(k + j) % file.length]);
      $("chemin").innerHTML = lot.map((e) => `<span class="case" role="img" aria-label="${Deberes.nomEtape(e)}">${ICONES[Deberes.ICONE[e.type]]}</span>`).join("");
    }
    [...$("chemin").children].forEach((c, j) => { c.classList.toggle("faite", j < k % 4); c.classList.toggle("ici", j === k % 4); });
    const e = file[k % file.length];
    LANGUE = (LECONS[e.origen] || L).langue;
    if (k > 0 && k % 2 === 0) await dire("¡Un poco más y llega la pausa!");
    await FAIRE[e.type](e);
  }
  LANGUE = L.langue;
}

function descanso() {
  const v = $("voileFin");
  v.hidden = false;
  const min = Sync.pausa().minutos; // 5 ou 10 min, réglé par les parents
  v.innerHTML = `<div class="horloge"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="68" stroke="rgba(255,255,255,.15)"/><circle id="arc" cx="75" cy="75" r="68" stroke="#F2B90F" stroke-linecap="round" stroke-dasharray="427" stroke-dashoffset="0"/></svg><span id="reste">${min}:00</span></div>
    <h2>¡Descanso!</h2><p>Ahora: ${min} minutos de descanso. ¿Jugamos?</p>
    <a class="gros vert" href="juegos.html?pausa=${encodeURIComponent(ID)}">¡A jugar!</a><a class="gros clair" href="album-animales.html">Ver mis animales</a>`;
  // « ¡A jugar! » : défi physique de 30 s, choix du jeu, jeu qui s'arrête seul, ballena, puis retour ici (&despues).
  dire(`¡Descanso! Ahora tienes ${min === 10 ? "diez" : "cinco"} minutos. ¿Jugamos? Te aviso cuando acabe.`);
  // Une 2e séance, seulement proposée (jamais une 3e) : à la fin du minuteur, ou plus tôt avec « Ya he descansado ».
  const propo = Deberes.deuxiemeSeance(ID);
  let tic;
  if (propo) {
    const b = bouton("Ya he descansado", "clair");
    b.addEventListener("click", () => { clearInterval(tic); proposer(propo); });
    v.append(b);
  }
  const debut = Date.now(), total = min * 60 * 1000;
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

// Retour d'un jeu de la pause (seance.html?lecon=ID&despues) : la 2e séance proposée, ou « ¡Hasta mañana! ».
function apresLaPause() {
  const v = $("voileFin");
  v.hidden = false;
  const propo = Deberes.deuxiemeSeance(ID);
  if (propo) return proposer(propo);
  v.innerHTML = `<h2>¡Muy bien, Dorian!</h2><p>Has terminado los deberes de hoy. ¡Hasta mañana!</p>
    <a class="gros" href="index.html">Volver</a><a class="gros clair" href="album-animales.html">Ver mis animales</a>`;
  dire("¡Muy bien, Dorian! Has terminado los deberes de hoy. ¡Hasta mañana!");
}

// « ¿Hacemos también el inglés hoy? » : Dorian peut toujours dire non, sans rien perdre.
function proposer(p, titre = "") {
  const v = $("voileFin");
  v.innerHTML = `<h2>${titre || "¡Muy bien, Dorian!"}</h2><p>Has terminado ${Deberes.matiere(ID)}.${titre ? "" : " Tu descanso ha acabado."}</p>
    <p class="propo">${p.question}<br><span>${p.raison}</span></p>
    <a class="gros" href="seance.html?lecon=${p.id}">${p.oui}</a><a class="gros clair" href="index.html">No, hoy ya está</a>`;
  direSuite([[titre ? titre + " ¡Muy bien, Dorian!" : "¡Muy bien, Dorian! Tu descanso ha acabado.", "es-ES"], [p.question, "es-ES"], [p.raison, "es-ES"]]);
}

// ---------- Démarrage sans écran « ¡Empezamos! » ----------
// Chrome peut refuser de parler tant que la page n'a pas été touchée : l'erreur « not-allowed » arrive tout de suite.
function voixAutorisee(texte) {
  if (!("speechSynthesis" in window)) return Promise.resolve(true);
  speechSynthesis.cancel();
  return new Promise((ok) => {
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = "es-ES"; u.rate = .9;
    u.voice = VOIX.find((v) => v.lang === "es-ES" && /Google/.test(v.name)) || VOIX.find((v) => v.lang === "es-ES") || null;
    let parti = false;
    u.onstart = () => { parti = true; };
    u.onend = () => ok(true);
    u.onerror = (ev) => ok(ev.error !== "not-allowed");
    speechSynthesis.speak(u);
    setTimeout(() => { if (!parti) { speechSynthesis.cancel(); ok(true); } }, 3000); // voix lente à charger : on avance
    setTimeout(() => ok(true), 3000 + texte.length * 90);
  });
}
// Les petits sons : le contexte audio créé sans toucher reste « suspendu », il repart au premier toucher.
document.addEventListener("pointerdown", () => { try { if (CTX && CTX.state === "suspended") CTX.resume(); } catch {} }, { capture: true });

// ---------- Sortie par erreur (geste « retour » d'Android) ----------
// Au premier toucher, on ajoute une entrée d'historique : le geste retour ouvre « ¿Quieres salir? » au lieu de quitter.
// S'il sort quand même, la séance reprend à son étape (Deberes.reprendre).
document.addEventListener("pointerdown", () => {
  if (Sortie.piege || Sortie.libre || DEMO) return;
  Sortie.piege = true; history.pushState({ seance: 1 }, "");
}, { capture: true });
addEventListener("popstate", () => {
  if (!Sortie.piege || Sortie.libre) return;
  Sortie.piege = false;
  speechSynthesis.cancel();
  const v = document.createElement("section"); v.className = "voile"; v.style.zIndex = 50;
  v.innerHTML = `<h2>¿Quieres salir?</h2><p>Si sales, luego seguimos donde lo dejaste.</p>`;
  const non = bouton("No, sigo"), oui = bouton("Sí, salir", "clair");
  v.append(non, oui); document.body.append(v);
  dire("¿Quieres salir?");
  non.addEventListener("click", () => { v.remove(); Sortie.piege = true; history.pushState({ seance: 1 }, ""); sonTouche(); redire(); });
  oui.addEventListener("click", () => { Sortie.libre = true; speechSynthesis.cancel(); location.replace("index.html"); });
});

// ---------- Pause demandée par Dorian ----------
let souffleTic;
$("pause").addEventListener("click", () => {
  speechSynthesis.cancel();
  Deberes.pause();
  if (!Travail.depuis) Travail.depuis = Date.now(); // le temps de pause ne compte pas comme travail
  $("voilePause").hidden = false;
  dire("Vale. Una pausa. Respira conmigo.");
  let dedans = true; $("souffle").textContent = "Inhala";
  souffleTic = setInterval(() => { dedans = !dedans; $("souffle").textContent = dedans ? "Inhala" : "Exhala"; }, 4000);
});
$("seguir").addEventListener("click", () => {
  if (Travail.depuis) { Travail.pauses += Date.now() - Travail.depuis; Travail.depuis = 0; }
  clearInterval(souffleTic); $("voilePause").hidden = true; redire(); });

// ---------- Déroulé ----------
// Mode démo (pour les captures) : ?demo&etape=N ouvre directement l'étape N, sans voix.
const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.has("demo");
// En démo, rien n'est enregistré, sauf avec « &registro » (pour tester le suivi).
const REGISTRAR = !DEMO || PARAMS.has("registro");
// « &voz » : la démo garde la voix (pour que les parents testent une étape précise) ; il faut alors un premier toucher.
const VOZ = DEMO && PARAMS.has("voz");
// Une séance de cette leçon quittée aujourd'hui en cours de route reprend à son étape ; une autre séance inachevée part dans la file.
const Sortie = { libre: false, piege: false }; // voir « Sortie par erreur », plus bas
const REPRISE = REGISTRAR && !PARAMS.has("despues") ? Deberes.reprendre(ID) : (Deberes.recuperer(), 0);
Sync.vider();
Sync.synchroniserProgreso(); // les cromos des autres téléphones : le sobre ne donnera pas un animal déjà gagné ailleurs
if (DEMO) { if (!VOZ) window.dire = async () => {}; demoFaite = true; if (PARAMS.has("pause")) setTimeout(() => $("pause").click(), 300); }

(async () => {
  if (PARAMS.has("despues")) return apresLaPause();
  vider();
  const depart = DEMO ? +PARAMS.get("etape") || 0 : REPRISE;
  if (!DEMO || VOZ) {
    // On démarre tout de suite (il vient de toucher « a los deberes »). Si Chrome refuse quand même la voix
    // sans un toucher sur cette page, le bouton « ¡Empezamos! » revient, seulement dans ce cas.
    $("texte").textContent = REPRISE ? "Seguimos donde lo dejaste" : "Hoy: " + L.sujet;
    const accueil = REPRISE ? "¡Hola otra vez, Dorian! Seguimos donde lo dejaste." : "¡Vamos, Dorian!";
    if (!(await voixAutorisee(accueil))) {
      const go = bouton("¡Empezamos!"); go.style.marginTop = "auto";
      scene.append(go);
      await clic(go); sonTouche();
      await dire(accueil);
    }
  }
  if (REGISTRAR && !REPRISE) Deberes.commencer(ID);
  Travail.debut = Date.now();
  for (const [i, e] of ETAPES.entries()) {
    if (i < depart) continue;
    cases.forEach((c, j) => { c.classList.toggle("faite", j < i); c.classList.toggle("ici", j === i); });
    if (e.type === "fin") { Sortie.libre = true; if (Sortie.piege) history.back(); await fin(); continue; }
    if (REGISTRAR) Deberes.etape(i);
    await FAIRE[e.type](e);
    if (REGISTRAR) Deberes.etape(i + 1); // étape finie : s'il sort pendant la mini-partie, on reprend à la suivante
    // Mode mini-parties : après chaque bloc de 2 ou 3 étapes, une partie courte (le temps de jeu ne compte pas comme travail).
    if (e.type !== "fin" && MiniPartidas.actif && MiniPartidas.apres(i, ETAPES.length - 1)) {
      const debutJeu = Date.now();
      await MiniPartidas.jouer(i, ETAPES.length - 1);
      Travail.pauses += Date.now() - debutJeu;
    }
  }
})();
