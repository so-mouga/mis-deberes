// Ce qui remplace LECON_DU_JOUR : le choix de la séance du jour, le journal de chaque séance (erreurs, pauses)
// et le Repaso de la semaine. Chargé après lecons.js et maths.js (il lit LECONS), et après sync.js.
// Tout est gardé sur le téléphone : sans réseau, rien ne bloque.

const Deberes = (() => {
  const CLE_HECHAS = "dorian.hechas";     // { leçon: "AAAA-MM-JJ" } : la dernière fois qu'elle a été finie
  const CLE_PUNTOS = "dorian.puntos";     // les points ratés à revoir : { id: { leccion, tipo, clave, txt, fallos, ultimo, exitos: [idSéance] } }
  const CLE_EN_CURSO = "dorian.sesion";   // la séance commencée, gardée à chaque événement
  const REPASO = "repaso";

  const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch {} };

  // ---- Dates en heure locale, au format AAAA-MM-JJ ----
  const jour = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const ecart = (de, a) => Math.round((new Date(a + "T12:00") - new Date(de + "T12:00")) / 864e5);
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const quand = (date, hoy) => { const n = ecart(hoy, date); return n === 0 ? "hoy" : n === 1 ? "mañana" : "el " + DIAS[new Date(date + "T12:00").getDay()]; };

  // ---- Les points ratés ----
  const idPoint = (leccion, tipo, clave) => `${leccion}|${tipo}|${clave}`;
  const puntos = () => lire(CLE_PUNTOS, {});
  // Ceux qu'on peut rejouer : les mots, phrases et questions des leçons de langue (pas les maths).
  const rejouables = (p = puntos()) => Object.entries(p).filter(([, x]) => x.tipo !== "mates" && LECONS[x.leccion] && LECONS[x.leccion].langue !== "es-ES");

  // ---- Le Repaso : une leçon construite à la volée avec les étapes d'origine, filtrées sur les points ratés ----
  // Une seule langue par Repaso (jamais de français et d'anglais dans un même jeu) : celle qui a le plus de points.
  const FILTRES = {
    toca: (e, a) => { const c = (e.cibles || e.items).filter((i) => a("mot", i.voz)); return c.length && { ...e, cibles: c, n: c.length }; },
    elige: (e, a) => { const q = e.questions.filter((x) => a("mot", x.bonne)); return q.length && { ...e, questions: q }; },
    vrai: (e, a) => { const q = e.questions.filter((x) => a("frase", x.phrase)); return q.length && { ...e, questions: q }; },
    letras: (e, a) => { const m = e.mots.filter((x) => a("mot", x.mot)); return m.length && { ...e, mots: m }; },
    papa: (e, a) => { const q = e.questions.filter((x) => a("papa", x.q + " · " + x.r)); return q.length && { ...e, questions: q }; },
  };
  const NOM_LANGUE = { "en-GB": "Inglés", "fr-FR": "Francés" };

  function leconRepaso(p = puntos()) {
    const liste = rejouables(p);
    if (!liste.length) return null;
    const parLangue = {};
    liste.forEach(([id, x]) => (parLangue[LECONS[x.leccion].langue] ??= []).push([id, x]));
    const [langue, points] = Object.entries(parLangue).sort((a, b) => b[1].length - a[1].length)[0];
    // Au plus 6 points : les plus ratés d'abord, puis les plus anciens.
    const choisis = points.sort((a, b) => b[1].fallos - a[1].fallos || a[1].ultimo.localeCompare(b[1].ultimo)).slice(0, 6);
    const ids = new Set(choisis.map(([id]) => id));
    const lecons = [...new Set(choisis.map(([, x]) => x.leccion))];
    const etapes = [];
    for (const type of Object.keys(FILTRES)) {
      for (const leccion of lecons) {
        const a = (tipo, clave) => ids.has(idPoint(leccion, tipo, clave));
        LECONS[leccion].etapes.filter((e) => e.type === type).forEach((e) => {
          const f = FILTRES[type](e, a);
          if (f) etapes.push({ ...f, origen: leccion });
        });
      }
    }
    if (!etapes.length) return null;
    return {
      titre: `Repaso · ${NOM_LANGUE[langue] || ""}`,
      court: "Repaso",
      sujet: "Lo que costó esta semana",
      langue,
      cromos: [],
      repaso: true,
      puntos: [...ids],
      etapes,
    };
  }

  // ---- Le choix de la séance du jour (la première règle qui s'applique) ----
  // ajustes : { temas, forzada, repasoDia } ; hechas : { leçon: date } ; repaso : la leçon Repaso possible (ou null).
  function choisir({ ajustes, hechas = {}, repaso = null, hoy = jour() }) {
    const a = ajustes || {};
    const temas = a.temas || {};
    const ordre = Object.keys(LECONS).filter((k) => k !== REPASO);
    // 1. Un parent a forcé une leçon pour aujourd'hui.
    if (a.forzada && a.forzada.fecha === hoy && LECONS[a.forzada.lecon]) return { id: a.forzada.lecon, motivo: "Elegida por papá o mamá para hoy" };
    // 2. Un thème de la semaine a un contrôle dans les 3 jours (aujourd'hui compris) : le plus proche.
    const semaine = ordre.filter((k) => temas[k] && temas[k].semana);
    const controles = semaine.filter((k) => temas[k].control && ecart(hoy, temas[k].control) >= 0 && ecart(hoy, temas[k].control) <= 2)
      .sort((x, y) => temas[x].control.localeCompare(temas[y].control));
    if (controles.length) return { id: controles[0], motivo: `Control ${quand(temas[controles[0]].control, hoy)}` };
    // 3. Le jour du Repaso, s'il y a des points ratés (et s'il n'a pas déjà été fait aujourd'hui).
    const jourRepaso = a.repasoDia ?? 5;
    if (repaso && new Date(hoy + "T12:00").getDay() === +jourRepaso && hechas[REPASO] !== hoy) return { id: REPASO, motivo: "Día de repaso" };
    // 4. On alterne les thèmes de la semaine : celui fait le moins récemment.
    if (semaine.length) {
      const id = [...semaine].sort((x, y) => (hechas[x] || "").localeCompare(hechas[y] || ""))[0];
      return { id, motivo: "Turno de los temas de la semana" };
    }
    // 5. Aucun thème coché : la dernière leçon faite, ou la première de la liste.
    const derniere = ordre.filter((k) => hechas[k]).sort((x, y) => hechas[y].localeCompare(hechas[x]))[0];
    return { id: derniere || ordre[0], motivo: "Ningún tema marcado esta semana" };
  }

  const hechas = () => lire(CLE_HECHAS, {});
  // Sur le téléphone de Dorian : avec ses propres réglages et son historique.
  const leconDuJour = () => choisir({ ajustes: Sync.ajustes(), hechas: hechas(), repaso: LECONS[REPASO] || null });

  // ---- Le journal de la séance ----
  let S = null; // la séance en cours

  // Gardée à chaque événement, avec l'heure de la dernière activité (pour la durée d'une séance interrompue).
  const garder = () => { if (S) { S.dernier = new Date().toISOString(); ecrire(CLE_EN_CURSO, S); } };

  function commencer(leccion) {
    const maintenant = new Date();
    S = {
      id: maintenant.getTime().toString(36) + Math.random().toString(36).slice(2, 6),
      fecha: jour(maintenant), leccion, titulo: LECONS[leccion]?.titre || leccion,
      inicio: maintenant.toISOString(), fin: "", pausas: 0, fallos: {}, terminada: false,
    };
    garder();
  }

  // Une erreur : le point raté a un identifiant stable (leçon d'origine + type + clé), et un texte lisible pour les parents.
  function erreur(leccion, tipo, clave, txt = clave) {
    if (!S) return;
    const id = idPoint(leccion, tipo, clave);
    const f = (S.fallos[id] ??= { leccion, tipo, txt, n: 0 });
    f.n++;
    garder();
    if (tipo === "mates" || !LECONS[leccion] || LECONS[leccion].langue === "es-ES") return; // les maths ne se rejouent pas
    const p = puntos();
    const x = (p[id] ??= { leccion, tipo, clave, txt, fallos: 0, exitos: [] });
    x.fallos++; x.ultimo = new Date().toISOString();
    ecrire(CLE_PUNTOS, p);
  }

  function pause() { if (S) { S.pausas++; garder(); } }

  // Ce qui part vers le Sheet : les erreurs en liste, la durée en minutes, et le nombre de points encore à revoir.
  function versEnvoi(s, terminada) {
    const fin = s.fin || new Date().toISOString();
    return {
      id: s.id, fecha: s.fecha, leccion: s.leccion, titulo: s.titulo, inicio: s.inicio, fin,
      minutos: Math.max(1, Math.round((new Date(fin) - new Date(s.inicio)) / 60000)),
      pausas: s.pausas, terminada, aparato: Sync.lien()?.nombre || "",
      avisos: s.avisos || [], // « rapida » (séance anormalement rapide), « azar » (beaucoup de réponses au hasard)
      fallos: Object.values(s.fallos),
      pendientes: rejouables().length,
    };
  }

  // La séance est finie (avant le sobre). Repaso : un point réussi (sans erreur) gagne une réussite ;
  // après 2 réussites lors de Repasos différents, il sort de la liste.
  // avisos : drapeaux pour le suivi parent (jamais une note).
  function terminer({ avisos = [] } = {}) {
    if (!S) return;
    S.fin = new Date().toISOString();
    S.avisos = avisos;
    const L = LECONS[S.leccion];
    if (L && L.repaso) {
      const p = puntos(), fuera = lire("dorian.puntos.fuera", {});
      L.puntos.forEach((id) => {
        if (!p[id] || S.fallos[id]) return;
        if (!p[id].exitos.includes(S.id)) p[id].exitos.push(S.id);
        if (p[id].exitos.length >= 2) { delete p[id]; fuera[id] = new Date().toISOString(); }
      });
      ecrire(CLE_PUNTOS, p);
      ecrire("dorian.puntos.fuera", fuera);
    }
    const h = hechas(); h[S.leccion] = S.fecha; ecrire(CLE_HECHAS, h);
    const { id, leccion } = S;
    Sync.encoler(versEnvoi(S, true));
    try { localStorage.removeItem(CLE_EN_CURSO); } catch {}
    S = null;
    Sync.vider();
    Tickets.ganar("s-" + id, { motivo: "sesion", leccion }); // 1 séance terminée = 1 partie (envoie aussi la progression)
  }

  // Au lancement : une séance commencée et jamais finie (appli fermée, il a craqué) part aussi, marquée « sin terminar ».
  function recuperer() {
    const s = lire(CLE_EN_CURSO, null);
    if (!s || !s.id) return;
    try { localStorage.removeItem(CLE_EN_CURSO); } catch {}
    Sync.encoler(versEnvoi({ ...s, fin: s.fin || s.dernier || s.inicio }, false));
  }

  // ---- Les étapes, nommées (écran du jour) ----
  const ICONE = { descubre: "oeil", toca: "oreille", elige: "question", vrai: "ok", letras: "lettres", papa: "duo", cuaderno: "crayon", palitos: "palitos", problema: "calcul", fin: "etoile" };
  function nomEtape(e) {
    if (e.type === "elige") return e.tren || e.questions.some((q) => q.wagons) ? "El tren" : "Elige";
    if (e.type === "problema") return e.problemes.length > 1 ? "Problemas" : "Un problema";
    return { descubre: "Descubre", toca: "Escucha y toca", vrai: "¿Es verdad?", letras: "Completa", papa: "Con un mayor", cuaderno: "En el cuaderno", palitos: "Palitos", fin: "¡Tu sobre!" }[e.type] || e.type;
  }

  // ---- « Esta semana » : les thèmes cochés par les parents, avec leur état ----
  // Lundi de la semaine de « hoy » (AAAA-MM-JJ).
  const lundi = (hoy) => { const d = new Date(hoy + "T12:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return jour(d); };
  const nomCourt = (k) => { const [m, s] = LECONS[k].titre.split(" · "); return s ? `${m} · ${s[0].toLowerCase()}${s.slice(1)}` : m; };
  // [{ id, nom, etiquette: { classe: "hoy"|"ctl"|"ok"|"", texte } }]
  function semaine(idDuJour, hoy = jour()) {
    const temas = (Sync.ajustes() || {}).temas || {};
    const h = hechas();
    return Object.keys(LECONS).filter((k) => k !== REPASO && temas[k] && temas[k].semana).map((k) => {
      const t = temas[k];
      const n = t.control ? ecart(hoy, t.control) : -1;
      let etiquette = { classe: "", texte: "" };
      if (h[k] && h[k] >= lundi(hoy)) etiquette = { classe: "ok", texte: "✓ " + (h[k] === hoy ? "hoy" : DIAS[new Date(h[k] + "T12:00").getDay()]) };
      if (n >= 0 && n <= 2) etiquette = { classe: "ctl", texte: "examen " + quand(t.control, hoy).replace(/^el /, "") };
      if (k === idDuJour && h[k] !== hoy) etiquette = { classe: "hoy", texte: "hoy" };
      return { id: k, nom: nomCourt(k), etiquette };
    });
  }

  // ---- Une 2e séance, seulement proposée après la pause (jamais une 3e) ----
  // Seulement si un autre thème de la semaine a un contrôle demain ou après-demain,
  // ou n'a pas encore été fait cette semaine alors qu'on est jeudi ou plus tard.
  const MATIERE = { en: ["el inglés", "inglés"], fr: ["el francés", "francés"], ma: ["las mates", "mates"] };
  // « el inglés », « las mates »… (« los deberes » pour le Repaso).
  const matiere = (id) => (MATIERE[String(id).slice(0, 2)] || ["los deberes"])[0];
  function deuxiemeSeance(actuelle, hoy = jour()) {
    const h = hechas();
    if (Object.values(h).filter((d) => d === hoy).length >= 2) return null;
    const temas = (Sync.ajustes() || {}).temas || {};
    const cands = Object.keys(LECONS).filter((k) => k !== REPASO && k !== actuelle && temas[k] && temas[k].semana && h[k] !== hoy);
    const examen = cands.filter((k) => temas[k].control && [1, 2].includes(ecart(hoy, temas[k].control)))
      .sort((x, y) => temas[x].control.localeCompare(temas[y].control))[0];
    const finSemaine = [4, 5, 6, 0].includes(new Date(hoy + "T12:00").getDay());
    const pasFait = finSemaine && cands.find((k) => !(h[k] && h[k] >= lundi(hoy)));
    const id = examen || pasFait;
    if (!id) return null;
    const raison = examen ? (ecart(hoy, temas[id].control) === 1 ? "Mañana tienes examen." : "Pasado mañana tienes examen.") : "Todavía no lo has hecho esta semana.";
    const [avecArticle, seul] = MATIERE[id.slice(0, 2)] || ["esto", "sí"];
    const memeMatiere = actuelle && actuelle.slice(0, 2) === id.slice(0, 2);
    return {
      id, raison,
      question: memeMatiere ? `¿Hacemos otra de ${seul} hoy?` : `¿Hacemos también ${avecArticle} hoy?`,
      oui: memeMatiere ? "Sí, ¡otra!" : `Sí, ¡${seul}!`,
    };
  }

  // Le Repaso existe dès qu'il y a des points à revoir : l'écran du jour et la séance le trouvent dans LECONS.
  // Reconstruit aussi après la fusion de la progression (des points ratés ont pu arriver d'un autre téléphone).
  function reconstruireRepaso() { const R = leconRepaso(); if (R) LECONS[REPASO] = R; else delete LECONS[REPASO]; }
  reconstruireRepaso();

  // ---- La révision avant la pause (quand la séance a été finie trop vite) ----
  // Des exercices autonomes (pas de « Con un mayor », pas de cahier), chacun avec sa leçon d'origine :
  // d'abord les points ratés (Repaso), puis les autres thèmes de la semaine, puis la leçon du jour.
  const AUTONOMES = ["toca", "elige", "vrai", "letras", "palitos"];
  function etapesRevision(actuelle) {
    const file = [];
    const ajouter = (id, etapes) => etapes.filter((e) => AUTONOMES.includes(e.type)).forEach((e) => file.push({ ...e, origen: e.origen || id }));
    if (LECONS[REPASO]) ajouter(REPASO, LECONS[REPASO].etapes);
    const temas = (Sync.ajustes() || {}).temas || {};
    Object.keys(LECONS).filter((k) => k !== REPASO && k !== actuelle && temas[k] && temas[k].semana).forEach((k) => ajouter(k, LECONS[k].etapes));
    if (LECONS[actuelle] && actuelle !== REPASO) ajouter(actuelle, LECONS[actuelle].etapes);
    return file;
  }

  return { etapesRevision, reconstruireRepaso, ICONE, nomEtape, semaine, deuxiemeSeance, matiere, jour, ecart, quand, choisir, leconDuJour, leconRepaso, puntos, rejouables, hechas, commencer, erreur, pause, terminer, recuperer, REPASO };
})();
