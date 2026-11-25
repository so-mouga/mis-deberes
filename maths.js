// Maths : palitos (dizaines/unités) et problèmes de suma/resta, calqués sur ses fichas Santillana.
// Chargé après lecons.js et avant moteur.js.

const hasard = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const du = (n) => { const d = Math.floor(n / 10), u = n % 10; return `${d} ${d === 1 ? "decena" : "decenas"} y ${u} ${u === 1 ? "unidad" : "unidades"}`; };
const choisir = (t) => t[Math.floor(Math.random() * t.length)];

// ---- Nombres à 2 chiffres, sans retenue ----
function nombresSuma() {
  const ud = hasard(1, 8), ub = hasard(0, 9 - ud), dd = hasard(1, 7), db = hasard(1, 9 - dd);
  return [dd * 10 + ud, db * 10 + ub];
}
function nombresResta() {
  const ua = hasard(1, 9), ub = hasard(0, ua), da = hasard(3, 9), db = hasard(1, da - 1);
  return [da * 10 + ua, db * 10 + ub];
}

// ---- Les histoires (données en rouge, question en bleu) ----
const HISTOIRES = [
  { op: "-", f: (a, b) => [["Micaela tenía "], [`${a} pegatinas`, "d"], [". Ha regalado algunas y ahora "], [`le quedan ${b}`, "d"], [". "], ["¿Cuántas pegatinas ha regalado?", "q"]], sol: "Ha regalado", unite: "pegatinas" },
  { op: "-", f: (a, b) => [["En la granja había "], [`${a} gallinas`, "d"], [". "], [`${b} se han ido`, "d"], [" al gallinero. "], ["¿Cuántas gallinas quedan fuera?", "q"]], sol: "Quedan fuera", unite: "gallinas" },
  { op: "-", f: (a, b) => [["Los pintores compraron "], [`${a} botes`, "d"], [" de pintura. "], [`Han utilizado ${b}`, "d"], [". "], ["¿Cuántos botes quedan sin abrir?", "q"]], sol: "Quedan sin abrir", unite: "botes" },
  { op: "+", f: (a, b) => [["En el mar hay "], [`${a} delfines`, "d"], [". "], [`Llegan ${b} delfines`, "d"], [" más. "], ["¿Cuántos delfines hay en total?", "q"]], sol: "En total hay", unite: "delfines" },
  { op: "+", f: (a, b) => [["Dorian tiene "], [`${a} cromos`, "d"], [". Hoy "], [`gana ${b} cromos`, "d"], [" más. "], ["¿Cuántos cromos tiene ahora?", "q"]], sol: "Ahora tiene", unite: "cromos" },
  { op: "+", f: (a, b) => [["En un árbol hay "], [`${a} pájaros`, "d"], [". "], [`Llegan ${b} pájaros`, "d"], [" más. "], ["¿Cuántos pájaros hay ahora?", "q"]], sol: "Ahora hay", unite: "pájaros" },
];

function nouveauProbleme(op) {
  const h = choisir(HISTOIRES.filter((x) => x.op === op));
  const [a, b] = op === "+" ? nombresSuma() : nombresResta();
  return { op, a, b, r: op === "+" ? a + b : a - b, segments: h.f(a, b), sol: h.sol, unite: h.unite };
}

// ---- Dessin des palitos : paquets de 10 attachés + bâtonnets seuls ----
function svgPalitos(n, { barres = 0 } = {}) {
  const d = Math.floor(n / 10), u = n % 10;
  let x = 4, out = "";
  const baton = (bx, barre) => `<rect x="${bx}" y="6" width="5" height="52" rx="2" fill="#F2B90F" stroke="#1E2A44" stroke-width="1.6"/>` +
    (barre ? `<path d="M${bx - 4} 52 ${bx + 9} 12" stroke="#E0453F" stroke-width="3.5" stroke-linecap="round"/>` : "");
  for (let i = 0; i < d; i++) {
    for (let k = 0; k < 10; k++) out += `<rect x="${x + k * 3}" y="6" width="4" height="52" rx="1.5" fill="#F2B90F" stroke="#1E2A44" stroke-width="1.2"/>`;
    out += `<rect x="${x - 2}" y="27" width="35" height="8" rx="2" fill="#E0453F" stroke="#1E2A44" stroke-width="1.4"/>`;
    x += 44;
  }
  for (let k = 0; k < u; k++) { out += baton(x, k >= u - barres); x += 10; }
  const w = Math.max(x + 4, 60);
  return `<svg class="palitos" viewBox="0 0 ${w} 64" style="width:${Math.min(w * 1.6, 340)}px">${out}</svg>`;
}

// ---- Étape « Palitos » ----
async function palitos(e) {
  for (const q of e.questions) {
    vider();
    if (q.mode === "lire") {
      const zone = document.createElement("div"); zone.className = "zone-palitos"; zone.innerHTML = svgPalitos(q.n);
      const liste = document.createElement("div"); liste.className = "mots";
      const d = Math.floor(q.n / 10), u = q.n % 10;
      const opts = melange([q.n, u * 10 + d === q.n ? q.n + 1 : u * 10 + d, q.n + (d < 9 ? 10 : -10)]);
      const boutons = opts.map((o) => { const b = document.createElement("button"); b.className = "mot"; b.textContent = o; liste.append(b); return b; });
      scene.append(zone, liste);
      const g = garde(boutons);
      g.ouvrir(consigne("¿Qué número es?", () => dire("¿Qué número es? Cada paquete tiene diez palitos.")));
      const bonne = boutons.find((b) => +b.textContent === q.n);
      let finie = false;
      await new Promise((fini) => boutons.forEach((b) => b.addEventListener("click", async () => {
        if (!g.peut() || finie) return;
        if (b === bonne) { finie = true; g.reponse(true); b.classList.add("bonne"); sonBien(); await dire(`¡Sí! ${du(q.n)}: ${q.n}.`); await attendre(300); fini(); }
        else { montrer(bonne); rate(e, "mates", "palitos"); g.reponse(false, dire(`Cuenta los paquetes: ${d} decenas. Y los palitos sueltos: ${u} unidades.`)); }
      })));
    } else {
      // Construire le nombre avec des paquets et des bâtonnets.
      let n = 0;
      const zone = document.createElement("div"); zone.className = "zone-palitos";
      const compte = document.createElement("p"); compte.className = "compte-palitos";
      const touches = document.createElement("div"); touches.className = "touches-palitos";
      const mk = (txt, v) => { const b = document.createElement("button"); b.className = "tp"; b.textContent = txt; b.addEventListener("click", () => maj(v)); touches.append(b); return b; };
      mk("+ paquete", 10); mk("+ palito", 1); mk("− paquete", -10); mk("− palito", -1);
      const listo = bouton("¡Listo!", "vert"); listo.style.marginTop = "auto";
      scene.append(zone, compte, touches, listo);
      function maj(v) { n = Math.max(0, Math.min(99, n + v)); sonTouche(); zone.innerHTML = n ? svgPalitos(n) : ""; compte.textContent = du(n).replace(" y ", " · "); }
      maj(0);
      consigne(`Haz el número ${q.n}`, () => dire(`Haz el número ${q.n} con paquetes de diez y palitos sueltos.`));
      for (;;) {
        await clic(listo);
        if (n === q.n) { sonBien(); await dire(`¡Perfecto! ${q.n}: ${du(q.n)}.`); break; }
        rate(e, "mates", "palitos");
        await dire(n < q.n ? `Te faltan. Tienes ${n}, queremos ${q.n}.` : `Te has pasado un poco. Tienes ${n}, queremos ${q.n}.`);
      }
    }
  }
}

// ---- Étape « Problema » : 5 temps, comme la ficha ----
async function problema(e) {
  for (const p of e.problemes) {
    await pbEscucha(p);
    await pbSubraya(p);
    await pbRazona(p);
    await pbOperacion(p);
    await pbColumnas(p);
    await pbSolucion(p);
  }
}

function texteProbleme(p, cliquable = false) {
  const t = document.createElement("p"); t.className = "probleme";
  p.segments.forEach(([txt, role]) => {
    const s = document.createElement("span");
    s.className = "seg"; s.textContent = txt; if (role) s.dataset.role = role;
    if (cliquable) { s.tabIndex = 0; s.setAttribute("role", "button"); s.style.cursor = "pointer"; }
    t.append(s);
  });
  return t;
}

async function pbEscucha(p) {
  vider();
  const t = texteProbleme(p);
  const suite = bouton("Siguiente"); suite.style.marginTop = "auto";
  scene.append(t, suite);
  const segs = [...t.children];
  const lire = async () => { for (const s of segs) { s.classList.add("lu"); await dire(s.textContent); s.classList.remove("lu"); } };
  consigne("Escucha el problema", lire);
  await clic(suite); sonTouche();
}

async function pbSubraya(p) {
  vider();
  const t = texteProbleme(p, true);
  scene.append(t);
  const datos = [...t.querySelectorAll('[data-role="d"]')], pregunta = t.querySelector('[data-role="q"]');
  await consigne("Toca los datos: se ponen rojos", () => dire("Toca los datos, los números del problema. Se ponen rojos."));
  let ratés = 0;
  await new Promise((fini) => [...t.children].forEach((s) => s.addEventListener("click", () => {
    if (s.dataset.role === "d" && !s.classList.contains("rouge")) {
      s.classList.add("rouge"); sonTouche();
      if (datos.every((d) => d.classList.contains("rouge"))) fini();
    } else if (s.dataset.role !== "d") {
      ratés++; dire("Busca los números.");
      if (ratés >= 2) datos.filter((d) => !d.classList.contains("rouge")).forEach((d) => { d.classList.remove("montre"); void d.offsetWidth; d.classList.add("montre"); });
    }
  })));
  sonBien();
  await consigne("Ahora toca la pregunta: se pone azul", () => dire("¡Muy bien! Ahora toca la pregunta. Se pone azul."));
  await new Promise((fini) => [...t.children].forEach((s) => s.addEventListener("click", () => {
    if (s === pregunta) { s.classList.add("bleu"); sonBien(); fini(); }
    else if (s.dataset.role !== "d") { dire("La pregunta termina con un signo de interrogación."); pregunta.classList.remove("montre"); void pregunta.offsetWidth; pregunta.classList.add("montre"); }
  })));
  await attendre(700);
}

// « tipo » : le type d'erreur noté dans le suivi (« total/diferencia », « sumar/restar »).
async function choixDeux(q, voix, a, b, bonneTxt, aide, tipo) {
  const qt = document.createElement("p"); qt.className = "question"; qt.textContent = q;
  const liste = document.createElement("div"); liste.className = "mots deux";
  const boutons = [a, b].map((o) => { const x = document.createElement("button"); x.className = "mot"; x.textContent = o; liste.append(x); return x; });
  scene.append(qt, liste);
  const g = garde(boutons);
  g.ouvrir(dire(voix));
  const bonne = boutons.find((x) => x.textContent === bonneTxt);
  let finie = false;
  await new Promise((fini) => boutons.forEach((x) => x.addEventListener("click", async () => {
    if (!g.peut() || finie) return;
    if (x === bonne) { finie = true; g.reponse(true); x.classList.add("bonne"); sonBien(); await attendre(500); fini(); }
    else { montrer(bonne); if (tipo) rate(null, "mates", tipo); g.reponse(false, dire(aide)); }
  })));
}

async function pbRazona(p) {
  vider();
  scene.append(texteProbleme(p));
  scene.querySelectorAll('[data-role="d"]').forEach((s) => s.classList.add("rouge"));
  scene.querySelector('[data-role="q"]').classList.add("bleu");
  const mas = p.op === "+";
  const aide = mas ? "Piensa: al final, ¿hay más o menos? Hay más: es el total." : "Piensa: al final, ¿hay más o menos? Hay menos: es la diferencia.";
  consigne("Razonamiento", () => dire("Razonamiento. Hay que calcular… ¿el total o la diferencia?"));
  await choixDeux("Hay que calcular…", "Hay que calcular… ¿el total, o la diferencia?", "el total", "la diferencia", mas ? "el total" : "la diferencia", aide, "total/diferencia");
  scene.querySelector(".question").remove(); scene.querySelector(".mots").remove();
  await choixDeux("Hay que…", "Hay que… ¿sumar o restar?", "sumar", "restar", mas ? "sumar" : "restar", mas ? "El total: hay que sumar." : "La diferencia: hay que restar.", "sumar/restar");
}

async function pbOperacion(p) {
  vider();
  scene.append(texteProbleme(p));
  scene.querySelectorAll('[data-role="d"]').forEach((s) => s.classList.add("rouge"));
  const bonne = p.op === "+" ? `${p.a} + ${p.b}` : `${p.a} − ${p.b}`;
  const autre = p.op === "+" ? `${p.a} − ${p.b}` : `${p.a} + ${p.b}`;
  const [x, y] = melange([bonne, autre]);
  consigne("Rodea la operación", () => dire("¿Qué operación resuelve el problema?"));
  await choixDeux("¿Qué operación es?", "¿Qué operación resuelve el problema?", x, y, bonne, p.op === "+" ? "Hay que sumar: el signo más." : "Hay que restar: el signo menos.", "sumar/restar");
}

// Calcul en colonnes : unités d'abord, puis dizaines.
async function pbColumnas(p) {
  vider();
  const s = p.op === "+" ? "+" : "−";
  const da = Math.floor(p.a / 10), ua = p.a % 10, db = Math.floor(p.b / 10), ub = p.b % 10;
  const ur = p.op === "+" ? ua + ub : ua - ub, dr = p.op === "+" ? da + db : da - db;
  const g = document.createElement("div"); g.className = "colonnes";
  g.innerHTML = `<span></span><span class="tete">D</span><span class="tete">U</span>
    <span></span><span>${da}</span><span>${ua}</span>
    <span class="signe">${s}</span><span>${db}</span><span>${ub}</span>
    <span></span><span class="res" id="resD"></span><span class="res" id="resU"></span>`;
  const aide = document.createElement("div"); aide.className = "aide-palitos";
  const pave = document.createElement("div"); pave.className = "pave";
  for (let i = 0; i <= 9; i++) { const b = document.createElement("button"); b.textContent = i; pave.append(b); }
  scene.append(g, aide, pave);
  const etapes = [
    { cel: "#resU", tipo: "unidades", bon: ur, voix: `Primero las unidades: ${ua} ${p.op === "+" ? "más" : "menos"} ${ub}.`, txt: "Primero las unidades", aide: () => svgPalitos(p.op === "+" ? ua + ub : ua, { barres: p.op === "+" ? 0 : ub }) },
    { cel: "#resD", tipo: "decenas", bon: dr, voix: `Ahora las decenas: ${da} ${p.op === "+" ? "más" : "menos"} ${db}.`, txt: "Ahora las decenas", aide: () => svgPalitos(p.op === "+" ? da + db : da, { barres: p.op === "+" ? 0 : db }) },
  ];
  for (const et of etapes) {
    const cel = g.querySelector(et.cel); cel.classList.add("suivant");
    const gp = garde([pave]);
    gp.ouvrir(consigne(et.txt, () => dire(et.voix)));
    let ratés = 0, finie = false;
    await new Promise((fini) => pave.querySelectorAll("button").forEach((b) => b.onclick = async () => {
      if (!gp.peut() || finie) return;
      if (+b.textContent === et.bon) { finie = true; gp.reponse(true); cel.textContent = et.bon; cel.classList.remove("suivant"); cel.classList.add("rempli"); aide.innerHTML = ""; sonBien(); await attendre(400); fini(); }
      else { ratés++; rate(null, "mates", et.tipo); aide.innerHTML = et.aide(); gp.reponse(false, dire(p.op === "+" ? "Cuenta todos los palitos." : "Cuenta los palitos que no están tachados.")); }
    }));
  }
  await dire(`${p.a} ${p.op === "+" ? "más" : "menos"} ${p.b}, igual a ${p.r}.`);
}

async function pbSolucion(p) {
  vider();
  scene.append(texteProbleme(p));
  const phrase = document.createElement("p"); phrase.className = "question"; phrase.innerHTML = `${p.sol} <span class="trou-sol">?</span> ${p.unite}.`;
  const liste = document.createElement("div"); liste.className = "mots";
  const faux = p.op === "+" ? Math.abs(p.a - p.b) : p.a + p.b;
  const boutons = melange([p.r, faux, p.r + 10]).map((o) => { const b = document.createElement("button"); b.className = "mot"; b.textContent = o; liste.append(b); return b; });
  scene.append(phrase, liste);
  const g = garde(boutons);
  g.ouvrir(consigne("Solución", () => dire(`Solución. ${p.sol}… ¿cuántos ${p.unite}?`)));
  const bonne = boutons.find((b) => +b.textContent === p.r);
  let finie = false;
  await new Promise((fini) => boutons.forEach((b) => b.addEventListener("click", async () => {
    if (!g.peut() || finie) return;
    if (b === bonne) {
      finie = true; g.reponse(true); b.classList.add("bonne"); phrase.querySelector(".trou-sol").textContent = p.r; sonBien(); await dire(`${p.sol} ${p.r} ${p.unite}.`); await attendre(400); fini(); }
    else { montrer(bonne); g.reponse(false, dire(`Mira la operación: el resultado es ${p.r}.`)); }
  })));
}

// ---- La leçon de maths (nouvelle à chaque ouverture) ----
(function () {
  const p1 = nouveauProbleme("-"), p2 = nouveauProbleme("+");
  const n1 = hasard(21, 89), n2 = hasard(21, 89);
  const sym = (p) => (p.op === "+" ? "+" : "−");
  LECONS["ma-problemas"] = {
    titre: "Mates · Problemas",
    court: "Mates",
    sujet: "Sumas y restas · palitos",
    langue: "es-ES",
    cromos: [],
    etapes: [
      { type: "palitos", questions: [{ mode: "lire", n: n1 }, { mode: "hacer", n: n2 }] },
      { type: "problema", problemes: [p1, p2] },
      { type: "papa", questions: [
        { q: `Pregunta a Dorian: en el problema de ${p1.unite}, ¿por qué hay que restar?`, r: "Porque al final hay menos." },
        { q: `¿Cuántas decenas y unidades tiene el ${p1.a}?`, r: du(p1.a) },
      ] },
      { type: "cuaderno", consigne: "Escribe en tu cuaderno", voz: "Copia las dos operaciones en tu cuaderno, en columnas, como en la ficha.",
        items: [p1, p2].map((p) => ({ nom: `${p.a} ${sym(p)} ${p.b} = ${p.r}` })) },
    ],
  };
})();
