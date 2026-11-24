// Synchronisation avec le Google Sheet « Deberes Dorian », par son Apps Script (outils/deberes.gs).
// Le lien du script (adresse « …/exec » + « #clé ») est collé une fois par téléphone, et gardé en localStorage :
// jamais dans le code. Sans lien ou sans réseau, tout continue de marcher avec la dernière copie reçue.

const Sync = (() => {
  const CLE_LIEN = "dorian.sync";          // { url, cle }
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

  // Brancher ce téléphone : on vérifie le lien en lisant les réglages, puis on le garde.
  async function brancher(texte) {
    const l = lireLien(texte);
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

  return { lien, lireLien, brancher, debrancher, ajustes, rafraichirAjustes, guardarAjustes, sesiones, enAttente, encoler, vider };
})();
