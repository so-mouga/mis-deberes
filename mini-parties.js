// Les mini-parties entre les blocs de devoirs (BRIEF-mini-parties.md, décidé avec Kevin le 26 nov. 2026).
// La séance est découpée en blocs de 2 ou 3 étapes ; après chaque bloc (sauf le dernier, qui finit par le paquet),
// une partie courte s'ouvre par-dessus la séance (un cadre), puis le retour aux devoirs est immédiat.
// Chargé par seance.html après sync.js et avant moteur.js. Le jeu annonce sa fin par un message (pause-commun.js, finPartie).
//
// Réglages (page des parents, rubrique « Juegos » ; rangés dans la clé « pausa » des Ajustes, donc pas de redéploiement du script) :
//   pausa.juegos = { modo: "mini" | "pausa", eleccion: "auto" | "elige",
//   duracion: "corta" | "larga", bloque: 2 | 3, permitidos: ["minero", …] }. Sans réglage : mini, auto, corta, 3, tous.
// Pour tester sans toucher aux réglages : &modo=pausa, &bloque=2, &duracion=larga, &elige, &juegos=minero,burbujas, &partida=N (secondes).

const MiniPartidas = (() => {
  const P = new URLSearchParams(location.search);
  const JEUX = [
    { id: "minero", page: "minero.html", nom: "El pequeño minero", fond: "#E9D3B8" },
    { id: "guardianes", page: "guardianes.html", nom: "Los guardianes", fond: "#E4DDF7" },
    { id: "burbujas", page: "burbujas.html", nom: "Cañón de burbujas", fond: "#CFE8FF" },
    { id: "caminos", page: "tres-caminos.html", nom: "Tres caminos", fond: "#CFF2DD" },
  ];
  const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch {} };

  function reglages() {
    const A = (typeof Sync !== "undefined" && Sync.ajustes()) || {};
    const j = (A.pausa || {}).juegos || A.juegos || {};
    const ids = JEUX.map((x) => x.id);
    let permitidos = Array.isArray(j.permitidos) ? j.permitidos.filter((id) => ids.includes(id)) : ids;
    if (P.get("juegos")) permitidos = P.get("juegos").split(",").filter((id) => ids.includes(id));
    if (!permitidos.length) permitidos = ids; // jamais sans jeu
    return {
      modo: (P.get("modo") || j.modo) === "pausa" ? "pausa" : "mini",
      eleccion: P.has("elige") || j.eleccion === "elige" ? "elige" : "auto",
      duracion: (P.get("duracion") || j.duracion) === "larga" ? "larga" : "corta",
      bloque: +(P.get("bloque") || j.bloque) === 2 ? 2 : 3,
      permitidos,
    };
  }
  const R = reglages();
  const actif = R.modo === "mini" && !P.has("despues");

  // n = nombre d'étapes de la leçon (sans le paquet). Une partie après l'étape i si elle ferme un bloc, jamais juste avant le paquet.
  const apres = (i, n) => (i + 1) % R.bloque === 0 && i < n - 1;
  const restant = (i, n) => { let k = i + 1, c = 0; while (k < n) { c++; if (apres(k, n)) break; k++; } return { c, dernier: k >= n - 1 || !apres(k, n) }; };

  // ---- Le plan en haut : les étapes, une manette entre les blocs, le paquet au bout ----
  const MANETTE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h10a4 4 0 0 1 4 4.5l-.6 3.6a2.3 2.3 0 0 1-4 1.1L14.6 15H9.4l-1.8 2.2a2.3 2.3 0 0 1-4-1.1L3 12.5A4 4 0 0 1 7 8z"/><path d="M7.5 11v3M6 12.5h3"/><circle cx="16" cy="11.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="13.5" r=".6" fill="currentColor"/></svg>`;
  const manettes = {};
  function decorer(chemin, n) {
    if (!actif) return;
    const cases = [...chemin.querySelectorAll(".case")];
    cases.forEach((c, i) => {
      if (i < n && apres(i, n)) {
        const m = document.createElement("span");
        m.className = "case-jeu"; m.setAttribute("role", "img"); m.setAttribute("aria-label", "Partida"); m.innerHTML = MANETTE;
        c.after(m); manettes[i] = m;
      }
    });
    // Le paquet au bout (au lieu de l'étoile)
    if (cases[n]) { cases[n].classList.add("case-sobre"); cases[n].innerHTML = `<span class="mini-sobre" aria-hidden="true"></span>`; }
    chemin.classList.add("avec-jeux");
  }
  const planTexte = (n) => {
    let t = "";
    for (let i = 0; i < n; i++) { t += "✏️"; if (apres(i, n)) t += " 🎮 "; }
    return t + " 🎁";
  };

  // ---- Quel jeu, quel animal : ils changent tout seuls, d'une partie à l'autre et d'un soir à l'autre ----
  // Choix de Kevin : un jeu au hasard parmi ceux qui sont permis, jamais deux fois le même d'affilée.
  function suivant() {
    const liste = JEUX.filter((j) => R.permitidos.includes(j.id));
    const dernier = lire("dorian.juegos.ultimo", null);
    const autres = liste.length > 1 ? liste.filter((j) => j.id !== dernier) : liste;
    return autres[Math.floor(Math.random() * autres.length)];
  }
  function animal() {
    const siens = (typeof collection === "function" ? collection() : []).filter((n) => ANIMAUX.some((a) => a.n === n));
    const liste = siens.length ? siens : ANIMAUX.map((a) => a.n);
    const k = (lire("dorian.juegos.animal", -1) + 1) % liste.length;
    ecrire("dorian.juegos.animal", k);
    return liste[k];
  }
  function graine() { const g = lire("dorian.juegos.graine", 0) + 1; ecrire("dorian.juegos.graine", g); return g; }

  // ---- Le voile du jeu ----
  function voile() {
    let v = document.getElementById("voileJeu");
    if (!v) { v = document.createElement("section"); v.id = "voileJeu"; v.className = "voile voile-jeu"; v.hidden = true; document.body.append(v); }
    return v;
  }
  // « Dorian elige » : 2 ou 3 jeux proposés (jamais toute la liste), en commençant par celui qui vient dans l'alternance.
  function choisir(v) {
    const premier = suivant();
    const autres = JEUX.filter((j) => R.permitidos.includes(j.id) && j !== premier).sort(() => Math.random() - .5);
    const proposes = [premier, ...autres].slice(0, 3);
    if (proposes.length === 1) return Promise.resolve(premier);
    v.innerHTML = `<h2>¿A qué juegas?</h2><div class="choix-jeux"></div>`;
    dire("¿A qué juegas? " + proposes.map((j) => j.nom).join(", o ") + ".");
    return new Promise((ok) => proposes.forEach((j) => {
      const b = document.createElement("button"); b.className = "carte-jeu"; b.style.background = j.fond; b.textContent = j.nom;
      b.addEventListener("click", () => { sonTouche(); ok(j); });
      v.querySelector(".choix-jeux").append(b);
    }));
  }

  // Joue la partie qui suit l'étape i (n étapes en tout). Résout quand Dorian revient aux devoirs.
  async function jouer(i, n) {
    const v = voile();
    v.hidden = false; v.classList.remove("retour");
    if (manettes[i]) manettes[i].classList.add("ici");
    speechSynthesis.cancel();
    const jeu = R.eleccion === "elige" ? await choisir(v) : suivant();
    ecrire("dorian.juegos.ultimo", jeu.id);
    const jouees = lire("dorian.juegos.jugados", {}); jouees[jeu.id] = Date.now(); ecrire("dorian.juegos.jugados", jouees);

    // Le jeu, dans un cadre plein écran
    const src = `${jeu.page}?partie=${R.duracion === "larga" ? "longue" : "courte"}&animal=${animal()}&graine=${graine()}` + (P.get("partida") ? `&duree=${+P.get("partida")}` : "");
    v.innerHTML = "";
    const cadre = document.createElement("iframe");
    cadre.className = "cadre-jeu"; cadre.title = jeu.nom; cadre.allow = "autoplay"; cadre.src = src;
    v.append(cadre);
    dire(jeu.nom + ". ¡A jugar!");
    const fin = await new Promise((ok) => {
      const filet = setTimeout(() => ok({}), (R.duracion === "larga" ? 2 * 150 : 2 * 60) * 1000 + 30000); // si le jeu ne répond plus
      function ecoute(ev) {
        if (ev.source !== cadre.contentWindow || !ev.data || ev.data.type !== "dorian:fin-partie") return;
        window.removeEventListener("message", ecoute); clearTimeout(filet); ok(ev.data);
      }
      window.addEventListener("message", ecoute);
    });
    // Le bravo du jeu, 2 s, puis le retour
    v.innerHTML = `<h2>${fin.titre || "¡Muy bien!"}</h2>${fin.phrase ? `<p>${fin.phrase}</p>` : ""}`;
    sonBien();
    await Promise.race([dire((fin.titre || "¡Muy bien!") + " " + (fin.phrase || "")), attendre(2500)]);
    await retour(v, i, n);
    if (manettes[i]) { manettes[i].classList.remove("ici"); manettes[i].classList.add("faite"); }
  }

  // Le retour aux devoirs : court et positif, un gros « ¡Seguimos! » qui se remplit ; à 8 s, l'exercice repart tout seul.
  function retour(v, i, n) {
    const { c, dernier } = restant(i, n);
    const quoi = c === 1 ? "1 ejercicio" : `${c} ejercicios`;
    const nombre = c === 1 ? "un ejercicio" : `${["", "", "dos", "tres", "cuatro"][c] || c} ejercicios`;
    const suite = dernier ? `y ¡tu sobre! <span class="mini-sobre" aria-hidden="true"></span>` : "y otra partida 🎮";
    v.classList.add("retour");
    v.innerHTML = `<h2>¡Muy bien!</h2><p>Ahora ${quoi} ${suite}</p><button class="gros seguimos" id="seguimos"><i></i><span>¡Seguimos!</span></button>`;
    dire(`¡Muy bien! Ahora ${nombre} ` + (dernier ? "y tu sobre." : "y otra partida."));
    return new Promise((ok) => {
      const b = document.getElementById("seguimos");
      const fini = () => { clearTimeout(t); v.hidden = true; v.innerHTML = ""; v.classList.remove("retour"); ok(); };
      const t = setTimeout(fini, TEST_RELANCE);
      b.style.setProperty("--relance", TEST_RELANCE + "ms");
      b.addEventListener("click", () => { sonTouche(); fini(); }, { once: true });
    });
  }
  const TEST_RELANCE = P.get("relance") ? +P.get("relance") * 1000 : 8000;

  return { actif, reglages: R, apres, decorer, jouer, planTexte, JEUX };
})();
