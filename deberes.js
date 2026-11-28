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

  // Un point ne se rejoue que s'il correspond encore à une étape de sa leçon (une leçon découpée ou réécrite
  // laisse des points orphelins, qui prendraient les places du Repaso pour rien).
  const aUneEtape = ([id, x]) => (LECONS[x.leccion].etapes || []).some((e) => FILTRES[e.type] && FILTRES[e.type](e, (tipo, clave) => idPoint(x.leccion, tipo, clave) === id));

  function leconRepaso(p = puntos()) {
    const liste = rejouables(p).filter(aUneEtape);
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

  // ---- L'état d'une leçon : la seule fonction qui lit les réglages « temas » (espace parent v2, 26 nov. 2026) ----
  // temas[k] = { semana: bool, control: "AAAA-MM-JJ" | "" }
  //   semana  : la leçon est « au programme » (cochée par un parent) ;
  //   control : la date de l'examen de sa matière (la page parent la recopie sur chaque leçon de la matière).
  // temas.__examenes = { en|fr|ma: "AAAA-MM-JJ" } : la date saisie par matière (pour la page parent).
  // temas.__plan = { "AAAA-MM-JJ": ["fr", "ma"] } : les matières choisies pour un jour (facultatif).
  // C'est le même format qu'avant (semana / control) : un téléphone pas encore mis à jour continue de marcher.
  // Le lendemain de l'examen, la leçon n'est plus au programme (sans rien effacer : la page parent la recoche si besoin).
  function etatLecon(t, hoy = jour()) {
    t = t || {};
    const n = t.control ? ecart(hoy, t.control) : null; // jours avant l'examen (0 = aujourd'hui)
    const passe = n !== null && n < 0;
    const programme = !!t.semana && !passe;
    return { programme, passe, examen: passe ? "" : t.control || "", jours: passe ? null : n, priorite: programme && n !== null && n <= 2 };
  }
  const matiereDe = (k) => String(k).slice(0, 2); // en, fr, ma (le préfixe de l'id)
  const estMelange = (k) => !!(LECONS[k] && LECONS[k].mezcla); // « tout mélangé » : seulement la veille et le jour de l'examen

  // Le meilleur thème parmi des candidats : pas déjà fait aujourd'hui ; si possible pas fait hier non plus ;
  // puis jamais fait, puis le plus de points ratés à revoir (ce qu'il sait le moins), puis le moins récent.
  function meilleur(ids, hechas, hoy, pts) {
    const hier = jour(new Date(new Date(hoy + "T12:00").getTime() - 864e5));
    const rates = (k) => Object.values(pts || {}).filter((x) => x.leccion === k).length;
    const libres = ids.filter((k) => hechas[k] !== hoy);
    const pasHier = libres.filter((k) => hechas[k] !== hier);
    return (pasHier.length ? pasHier : libres).sort((x, y) =>
      (hechas[x] ? 1 : 0) - (hechas[y] ? 1 : 0) || rates(y) - rates(x) || (hechas[x] || "").localeCompare(hechas[y] || "") || ids.indexOf(x) - ids.indexOf(y))[0];
  }

  // ---- Le choix de la séance du jour (la première règle qui s'applique) ----
  // ajustes : { temas, forzada, repasoDia } ; hechas : { leçon: date } ; repaso : la leçon Repaso possible (ou null) ;
  // pts : les points ratés (sur la page parent, on ne les a pas : le choix se fait alors sur le reste).
  // raison : forzada | plan | examen | repaso | turno | ninguno (la page parent la traduit) ; motivo : la même chose, en espagnol.
  function choisir({ ajustes, hechas = {}, repaso = null, hoy = jour(), pts = null }) {
    const a = ajustes || {};
    const temas = a.temas || {};
    const ordre = Object.keys(LECONS).filter((k) => k !== REPASO);
    const E = (k) => etatLecon(temas[k], hoy);
    const prog = ordre.filter((k) => E(k).programme);
    // Une matière : la leçon « tout mélangé » la veille et le jour de l'examen, sinon le thème qu'il sait le moins.
    const pourMatiere = (m) => {
      const ls = prog.filter((k) => matiereDe(k) === m);
      const melange = ls.find((k) => estMelange(k) && E(k).jours !== null && E(k).jours <= 1 && hechas[k] !== hoy);
      return melange || meilleur(ls.filter((k) => !estMelange(k)), hechas, hoy, pts);
    };
    // 1. Un parent a forcé une leçon pour aujourd'hui.
    if (a.forzada && a.forzada.fecha === hoy && LECONS[a.forzada.lecon]) return { id: a.forzada.lecon, raison: "forzada", motivo: "Elegida por papá o mamá para hoy" };
    // 2. Les matières prévues pour aujourd'hui (planning) : la première pas encore faite aujourd'hui.
    for (const m of (temas.__plan || {})[hoy] || []) {
      if (ordre.some((k) => matiereDe(k) === m && hechas[k] === hoy)) continue;
      const id = pourMatiere(m);
      if (id) return { id, raison: "plan", motivo: "Previsto para hoy" };
    }
    // 3. Un examen dans les 3 jours (aujourd'hui compris) : la matière de l'examen le plus proche.
    const urgents = prog.filter((k) => E(k).priorite).sort((x, y) => E(x).examen.localeCompare(E(y).examen));
    for (const k of urgents) {
      const id = pourMatiere(matiereDe(k));
      if (id) return { id, raison: "examen", examen: E(k).examen, motivo: `Control ${quand(E(k).examen, hoy)}` };
    }
    // 4. Le jour du Repaso, s'il y a des points ratés (et s'il n'a pas déjà été fait aujourd'hui).
    const jourRepaso = a.repasoDia ?? 5;
    if (repaso && new Date(hoy + "T12:00").getDay() === +jourRepaso && hechas[REPASO] !== hoy) return { id: REPASO, raison: "repaso", motivo: "Día de repaso" };
    // 5. On alterne les thèmes au programme.
    const id = meilleur(prog.filter((k) => !estMelange(k)), hechas, hoy, pts);
    if (id) return { id, raison: "turno", motivo: "Turno de los temas de la semana" };
    // 6. Rien au programme : la dernière leçon faite, ou la première de la liste.
    const derniere = ordre.filter((k) => hechas[k]).sort((x, y) => hechas[y].localeCompare(hechas[x]))[0];
    return { id: derniere || ordre[0], raison: "ninguno", motivo: "Ningún tema marcado esta semana" };
  }

  const hechas = () => lire(CLE_HECHAS, {});
  // Sur le téléphone de Dorian : avec ses propres réglages et son historique.
  const leconDuJour = () => choisir({ ajustes: Sync.ajustes(), hechas: hechas(), repaso: LECONS[REPASO] || null, pts: puntos() });

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
  // Sauf si elle date d'aujourd'hui et qu'au moins une étape est faite : Dorian est peut-être sorti par erreur,
  // elle attend qu'il revienne (reprendre). Le lendemain, elle part comme les autres.
  const reprenable = (s) => !!(s && s.id && s.fecha === jour() && s.etape > 0);
  function envoyerInachevee(s) {
    try { localStorage.removeItem(CLE_EN_CURSO); } catch {}
    Sync.encoler(versEnvoi({ ...s, fin: s.fin || s.dernier || s.inicio }, false));
  }
  function recuperer() {
    const s = lire(CLE_EN_CURSO, null);
    if (!s || !s.id || reprenable(s)) return;
    envoyerInachevee(s);
  }
  // À l'ouverture d'une séance : si la même leçon a été quittée aujourd'hui en cours de route, on la reprend
  // (renvoie l'étape où reprendre, et le journal continue). Sinon 0, et une autre séance en attente part.
  function reprendre(leccion) {
    const s = lire(CLE_EN_CURSO, null);
    if (reprenable(s) && s.leccion === leccion) { S = s; garder(); return s.etape; }
    if (s && s.id) envoyerInachevee(s);
    return 0;
  }
  // L'étape où en est Dorian (celle à refaire s'il sort maintenant).
  function etape(i) { if (S) { S.etape = i; garder(); } }

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
    return Object.keys(LECONS).filter((k) => k !== REPASO && etatLecon(temas[k], hoy).programme).map((k) => {
      const t = { control: etatLecon(temas[k], hoy).examen };
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
    const faites = Object.values(h).filter((d) => d === hoy).length;
    const ajustes = Sync.ajustes() || {};
    const temas = ajustes.temas || {};
    // Un jour planifié avec plusieurs matières (le week-end, par exemple) : une séance par matière, 3 au plus.
    const plan = (temas.__plan || {})[hoy] || [];
    if (plan.length > 1) {
      if (faites >= Math.min(plan.length, 3)) return null;
      const c = choisir({ ajustes: { ...ajustes, forzada: null }, hechas: h, hoy, pts: puntos() });
      if (c.raison !== "plan" || c.id === actuelle || h[c.id] === hoy) return null;
      const [avecArticle, seul] = MATIERE[c.id.slice(0, 2)] || ["esto", "sí"];
      const meme = actuelle && actuelle.slice(0, 2) === c.id.slice(0, 2);
      return { id: c.id, raison: "Papá o mamá lo han previsto para hoy.", question: meme ? `¿Hacemos otra de ${seul} hoy?` : `¿Hacemos también ${avecArticle} hoy?`, oui: meme ? "Sí, ¡otra!" : `Sí, ¡${seul}!` };
    }
    if (faites >= 2) return null;
    const E = (k) => etatLecon(temas[k], hoy);
    const cands = Object.keys(LECONS).filter((k) => k !== REPASO && k !== actuelle && E(k).programme && !estMelange(k) && h[k] !== hoy);
    const examen = cands.filter((k) => E(k).examen && [1, 2].includes(E(k).jours))
      .sort((x, y) => E(x).examen.localeCompare(E(y).examen))[0];
    const finSemaine = [4, 5, 6, 0].includes(new Date(hoy + "T12:00").getDay());
    const pasFait = finSemaine && cands.find((k) => !(h[k] && h[k] >= lundi(hoy)));
    const id = examen || pasFait;
    if (!id) return null;
    const raison = examen ? (E(id).jours === 1 ? "Mañana tienes examen." : "Pasado mañana tienes examen.") : "Todavía no lo has hecho esta semana.";
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
    Object.keys(LECONS).filter((k) => k !== REPASO && k !== actuelle && etatLecon(temas[k]).programme).forEach((k) => ajouter(k, LECONS[k].etapes));
    if (LECONS[actuelle] && actuelle !== REPASO) ajouter(actuelle, LECONS[actuelle].etapes);
    return file;
  }

  return { etatLecon, matiereDe, estMelange, etapesRevision, reconstruireRepaso, ICONE, nomEtape, semaine, deuxiemeSeance, matiere, jour, ecart, quand, choisir, leconDuJour, leconRepaso, puntos, rejouables, hechas, commencer, erreur, pause, terminer, recuperer, reprendre, etape, REPASO };
})();
