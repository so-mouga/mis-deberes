// Synchronisation avec le Google Sheet « Deberes Dorian », par son Apps Script (outils/deberes.gs).
// Le lien du script (adresse « …/exec » + « #clé ») est collé une fois par téléphone, et gardé en localStorage :
// jamais dans le code. Sans lien ou sans réseau, tout continue de marcher avec la dernière copie reçue.

const Sync = (() => {
  const CLE_LIEN = "dorian.sync";          // { url, cle, nombre } : « nombre » = le nom de cet appareil (« móvil de la abuela »)
  const CLE_AJUSTES = "dorian.ajustes";    // la dernière copie des réglages reçue : { …, recu }
  const CLE_FILE = "dorian.envois";        // les séances pas encore parties : [sesion, …]

  const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

  const lien = () => lire(CLE_LIEN, null);

  // « https://script.google.com/macros/s/…/exec#clé » → { url, cle }, ou une erreur.
  // (http://localhost:…/exec est accepté aussi : c'est le faux script des tests.)
  function lireLien(texte) {
    const m = (texte || "").trim().match(/^(https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec|http:\/\/(?:localhost|127\.0\.0\.1):\d+\/exec)#(\w{16,})$/);
    if (!m) throw new Error("no es el enlace del script (termina en «/exec#» seguido de la clave)");
    return { url: m[1], cle: m[2] };
  }

  async function appeler(requete) {
    let rep;
    try { rep = await requete; } catch { throw new Error("sin conexión"); }
    if (!rep.ok) throw new Error(`Google responde ${rep.status}`);
    const d = await rep.json().catch(() => { throw new Error("respuesta ilegible: ¿el script está publicado para «cualquier usuario»?"); });
    if (!d.ok) throw new Error(d.erreur === "clé refusée" ? "clave rechazada" : d.erreur || "el script dice que no");
    return d;
  }

  const obtenir = (l, quoi) => appeler(fetch(`${l.url}?cle=${encodeURIComponent(l.cle)}&quoi=${quoi}`, { cache: "no-store" }));
  const poster = (l, corps, keepalive = false) => appeler(fetch(l.url, {
    method: "POST",
    // text/plain : pas de requête préalable du navigateur, que le script Google ne sait pas traiter.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ cle: l.cle, ...corps }),
    keepalive,
  }));

  // Brancher ce téléphone : on vérifie le lien en lisant les réglages, puis on le garde (avec le nom de l'appareil).
  async function brancher(texte, nombre = "") {
    const l = { ...lireLien(texte), nombre: String(nombre || "").trim().slice(0, 40) };
    const d = await obtenir(l, "ajustes");
    ecrire(CLE_LIEN, l);
    ecrire(CLE_AJUSTES, { ...d.ajustes, recu: new Date().toISOString() });
    return d.ajustes;
  }
  const debrancher = () => { try { localStorage.removeItem(CLE_LIEN); } catch {} };

  // Les réglages : la copie du téléphone tout de suite (ou null), puis rafraichirAjustes() pour la nouvelle.
  const ajustes = () => lire(CLE_AJUSTES, null);
  async function rafraichirAjustes() {
    const l = lien();
    if (!l) return null;
    const d = await obtenir(l, "ajustes");
    const a = { ...d.ajustes, recu: new Date().toISOString() };
    ecrire(CLE_AJUSTES, a);
    return a;
  }
  async function guardarAjustes(partiels) {
    const l = lien();
    if (!l) throw new Error("no conectado");
    const d = await poster(l, { accion: "ajustes", ajustes: partiels });
    const a = { ...d.ajustes, recu: new Date().toISOString() };
    ecrire(CLE_AJUSTES, a);
    return a;
  }

  const sesiones = async () => { const l = lien(); if (!l) return null; return (await obtenir(l, "sesiones")).sesiones; };

  // La file d'attente des séances : on ajoute, puis on vide quand on peut. Une séance n'est retirée qu'une fois reçue.
  const enAttente = () => lire(CLE_FILE, []);
  function encoler(sesion) {
    const file = enAttente().filter((s) => s.id !== sesion.id);
    file.push(sesion);
    ecrire(CLE_FILE, file.slice(-60));
  }
  let enCours = null;
  function vider({ enPartant = false } = {}) {
    const l = lien();
    if (!l || !enAttente().length) return Promise.resolve(0);
    return (enCours ??= (async () => {
      let n = 0;
      try {
        for (const s of enAttente()) {
          await poster(l, { accion: "sesion", sesion: s }, enPartant);
          ecrire(CLE_FILE, enAttente().filter((x) => x.id !== s.id));
          n++;
        }
      } catch (err) {
        console.warn("Envío de sesiones:", err.message);
      } finally {
        enCours = null;
      }
      return n;
    })());
  }

  // ---- La progression de Dorian, partagée entre ses téléphones ----
  // Les cromos, les leçons faites et les points à revoir vivent en localStorage ET dans le Sheet.
  // On fusionne par union : un animal gagné n'est jamais perdu, même s'il a été gagné hors ligne sur un autre téléphone.
  // On envoie tout l'état à chaque fois : si un envoi échoue, le suivant rattrape (pas besoin de file d'attente).
  const CLES_PROGRESO = { animales: "dorian.animales", hechas: "dorian.hechas", puntos: "dorian.puntos", fuera: "dorian.puntos.fuera", tickets: "dorian.tickets", aparatos: "dorian.aparatos" };
  const progresoLocal = () => ({ animales: lire(CLES_PROGRESO.animales, []), hechas: lire(CLES_PROGRESO.hechas, {}), puntos: lire(CLES_PROGRESO.puntos, {}),
    fuera: lire(CLES_PROGRESO.fuera, {}), tickets: lire(CLES_PROGRESO.tickets, { ganados: {}, gastados: {} }), aparatos: lire(CLES_PROGRESO.aparatos, {}) });
  const ecrireProgreso = (p) => Object.entries(CLES_PROGRESO).forEach(([k, cle]) => ecrire(cle, p[k]));

  // Même fonction que fusionnerProgreso dans outils/deberes.gs : à garder identiques.
  function fusionnerProgreso(a, b) {
    a = a || {}; b = b || {};
    const max = (x, y) => ((x || "") > (y || "") ? x : y);
    const animales = [];
    [].concat(a.animales || [], b.animales || []).forEach((n) => { if (animales.indexOf(n) < 0) animales.push(n); });
    const hechas = Object.assign({}, a.hechas);
    Object.keys(b.hechas || {}).forEach((k) => { hechas[k] = max(hechas[k], b.hechas[k]); });
    const fuera = Object.assign({}, a.fuera);
    Object.keys(b.fuera || {}).forEach((k) => { fuera[k] = max(fuera[k], b.fuera[k]); });
    const puntos = {};
    [a.puntos || {}, b.puntos || {}].forEach((src) => Object.keys(src).forEach((id) => {
      const x = src[id], y = puntos[id];
      if (!y) { puntos[id] = Object.assign({}, x, { exitos: (x.exitos || []).slice() }); return; }
      y.fallos = Math.max(y.fallos || 0, x.fallos || 0);
      y.ultimo = max(y.ultimo, x.ultimo);
      (x.exitos || []).forEach((e) => { if (y.exitos.indexOf(e) < 0) y.exitos.push(e); });
    }));
    // Un point sort après 2 réussites (même sur deux téléphones) ; un point sorti ne revient que s'il est raté de nouveau.
    Object.keys(puntos).forEach((id) => {
      const p = puntos[id];
      if (p.exitos.length >= 2) { fuera[id] = max(fuera[id], new Date().toISOString()); delete puntos[id]; }
      else if (fuera[id] && (p.ultimo || "") <= fuera[id]) delete puntos[id];
    });
    // Les tickets de jeu : deux listes d'événements (gagnés / joués), chacun avec un id unique. L'union est sûre.
    const ta = a.tickets || {}, tb = b.tickets || {};
    const tickets = { ganados: Object.assign({}, ta.ganados, tb.ganados), gastados: Object.assign({}, ta.gastados, tb.gastados) };
    // Les téléphones de Dorian : { nom: { desde, visto } } (branché depuis, vu pour la dernière fois).
    const aparatos = Object.assign({}, a.aparatos);
    Object.keys(b.aparatos || {}).forEach((k) => {
      const x = aparatos[k] || {}, y = b.aparatos[k];
      aparatos[k] = { desde: x.desde && (!y.desde || x.desde < y.desde) ? x.desde : y.desde, visto: max(x.visto, y.visto) };
    });
    return { animales, hechas, puntos, fuera, tickets, aparatos };
  }

  // Envoie la progression du téléphone, reçoit celle fusionnée de tous les téléphones. Renvoie true si elle a été reçue.
  async function synchroniserProgreso({ enPartant = false } = {}) {
    const l = lien();
    if (!l) return false;
    try {
      // Ce téléphone se signale (pour la liste « Móviles de Dorian » de la page parent) : son nom et « vu maintenant ».
      const ici = l.nombre || "sin nombre", maintenant = new Date().toISOString();
      const ap = lire(CLES_PROGRESO.aparatos, {});
      ap[ici] = { desde: (ap[ici] && ap[ici].desde) || maintenant, visto: maintenant };
      ecrire(CLES_PROGRESO.aparatos, ap);
      const d = await poster(l, { accion: "progreso", progreso: progresoLocal() }, enPartant);
      // On refusionne avec le local du moment : il a pu changer pendant l'envoi (un cromo gagné, par exemple).
      ecrireProgreso(fusionnerProgreso(progresoLocal(), d.progreso));
      return true;
    } catch (err) {
      console.warn("Progreso:", err.message);
      return false;
    }
  }

  // Le lien de branchement d'un nouvel appareil (créé sur papas.html, ouvert ou scanné sur le nouvel appareil) :
  // …/index.html#conectar=<lien du script>&nombre=<nom>. Le « # » ne part jamais vers un serveur.
  function lienBranchement(base, nombre) {
    const l = lien();
    if (!l) return "";
    const h = new URLSearchParams({ conectar: `${l.url}#${l.cle}`, nombre });
    return `${base}#${h.toString()}`;
  }

  // Pour la page des parents : lire la progression fusionnée, ou y ajouter un morceau (un ticket offert).
  const lireProgreso = async () => { const l = lien(); if (!l) return null; return (await obtenir(l, "progreso")).progreso; };
  const ajouterProgreso = async (partiel) => { const l = lien(); if (!l) throw new Error("no conectado"); return (await poster(l, { accion: "progreso", progreso: partiel })).progreso; };

  // La pause, réglée par les parents (pour les jeux de la pause et le minuteur du descanso) :
  // { minutos: 5 | 10, libreEnBonus: bool, maxMinutos: 15 }. « libreEnBonus » : une partie offerte ou bonus
  // dure jusqu'à la fin du jeu, avec une limite de 15 min ; jamais entre deux séances.
  // Sans réglage (pas encore branché, ancien script), 5 min et pas de mode libre.
  // trabajo : le temps de travail minimum avant la pause (10, 15 ou 20 min ; 10 par défaut).
  // tranquilo : « Ritmo tranquilo », allonge les attentes anti-précipitation (réglé dans papas.html).
  function pausa() {
    const p = (ajustes() || {}).pausa || {};
    return { minutos: p.minutos === 10 ? 10 : 5, libreEnBonus: !!p.libreEnBonus, maxMinutos: 15, trabajo: [15, 20].includes(p.trabajo) ? p.trabajo : 10, tranquilo: !!p.tranquilo };
  }

  return { pausa, lien, lireLien, brancher, fusionnerProgreso, synchroniserProgreso, lienBranchement, lireProgreso, ajouterProgreso, debrancher, ajustes, rafraichirAjustes, guardarAjustes, sesiones, enAttente, encoler, vider };
})();

// ---- Les tickets de jeu (sur les téléphones de Dorian) ----
// 1 séance terminée = 1 ticket = 1 partie. Un parent peut aussi en offrir un (page des parents).
// Jamais lié à un score : on récompense l'effort (la séance finie), pas les résultats.
// Format (localStorage « dorian.tickets », et clé « tickets » de la progression dans le Sheet) :
//   { ganados: { <id>: { fecha, motivo: "sesion" | "regalo", leccion? } }, gastados: { <id>: { fecha, juego? } } }
// Solde = nombre de « ganados » − nombre de « gastados » (jamais moins de 0).
const Tickets = (() => {
  const CLE = "dorian.tickets";
  const etat = () => { try { const t = JSON.parse(localStorage.getItem(CLE)) || {}; return { ganados: t.ganados || {}, gastados: t.gastados || {} }; } catch { return { ganados: {}, gastados: {} }; } };
  const ecrire = (t) => { try { localStorage.setItem(CLE, JSON.stringify(t)); } catch {} };
  const disponibles = () => { const t = etat(); return Math.max(0, Object.keys(t.ganados).length - Object.keys(t.gastados).length); };
  const id = (prefixe) => prefixe + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // Gagner un ticket (une seule fois par id : rejouer la fin d'une séance ne donne pas 2 tickets).
  function ganar(cle, info = {}) {
    const t = etat();
    if (t.ganados[cle]) return false;
    t.ganados[cle] = { fecha: new Date().toISOString(), ...info };
    ecrire(t); Sync.synchroniserProgreso();
    return true;
  }
  // Utiliser un ticket pour une partie. Renvoie false s'il n'y en a pas.
  function gastar(juego = "") {
    if (!disponibles()) return false;
    const t = etat();
    t.gastados[id("p-")] = { fecha: new Date().toISOString(), juego };
    ecrire(t); Sync.synchroniserProgreso();
    return true;
  }
  return { disponibles, ganar, gastar, etat };
})();
