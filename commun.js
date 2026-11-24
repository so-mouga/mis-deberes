// Briques partagées : voix, sons doux, icônes, dessins, leçon Unit 2.

// ---- Voix ----
let VOIX = [];
const chargerVoix = () => { VOIX = speechSynthesis.getVoices(); };
if ("speechSynthesis" in window) { chargerVoix(); speechSynthesis.onvoiceschanged = chargerVoix; }

function dire(texte, langue = "es-ES", vitesse = 0.9) {
  if (!("speechSynthesis" in window)) return Promise.resolve();
  speechSynthesis.cancel();
  return new Promise((ok) => {
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = langue; u.rate = vitesse;
    const base = langue.slice(0, 2);
    u.voice = VOIX.find((v) => v.lang === langue && /Google/.test(v.name))
      || VOIX.find((v) => v.lang === langue) || VOIX.find((v) => v.lang.startsWith(base)) || null;
    u.onend = ok; u.onerror = ok;
    speechSynthesis.speak(u);
    setTimeout(ok, 4000 + texte.length * 90); // filet si la voix ne répond pas
  });
}
// Enchaîne plusieurs phrases : [["La cocina","es-ES"],["kitchen","en-GB",.8]]
async function direSuite(morceaux) { for (const [t, l, v] of morceaux) { await dire(t, l, v); } }

// ---- Sons doux (jamais de son d'échec) ----
let CTX;
const audio = () => (CTX ??= new (window.AudioContext || window.webkitAudioContext)());
function note(f1, f2, duree = .22, volume = .2, type = "sine") {
  try {
    const a = audio(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + duree * .5);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(volume, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + duree);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + duree + .02);
  } catch {}
}
const sonBien = () => { note(660, 990); setTimeout(() => note(880, 1320, .25), 110); };
const sonTouche = () => note(500, 620, .12, .12);
const sonPegar = () => { note(220, 160, .18, .25, "triangle"); setTimeout(() => note(990, 1320, .2, .12), 90); };

// ---- Icônes (trait 2.5, bouts ronds) ----
const T = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
const ICONES = {
  hautparleur: `<svg viewBox="0 0 24 24" ${T}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" ${T}><path d="M9 6v12M15 6v12" stroke-width="3.5"/></svg>`,
  oeil: `<svg viewBox="0 0 24 24" ${T}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
  oreille: `<svg viewBox="0 0 24 24" ${T}><path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.5"/><path d="M10 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.5"/></svg>`,
  question: `<svg viewBox="0 0 24 24" ${T}><path d="M4 5h16v11H11l-5 4v-4H4z"/><path d="M10 9a2 2 0 1 1 2.5 2c-.4.2-.5.5-.5 1"/><path d="M12 14.2v.1"/></svg>`,
  lettres: `<svg viewBox="0 0 24 24" ${T}><path d="M3 18 7.5 6 12 18M4.7 13.5h5.6"/><path d="M19.5 11v7M19.5 13.5a2.5 2.5 0 1 0 0 3"/></svg>`,
  duo: `<svg viewBox="0 0 24 24" ${T}><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9.5" r="2.3"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M13.5 19a4 4 0 0 1 8 0"/></svg>`,
  crayon: `<svg viewBox="0 0 24 24" ${T}><path d="m4 20 1-4L16 5l3 3L8 19z"/><path d="m14 7 3 3"/></svg>`,
  etoile: `<svg viewBox="0 0 24 24" ${T}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor"/></svg>`,
  lune: `<svg viewBox="0 0 24 24" ${T}><path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z"/></svg>`,
  croix: `<svg viewBox="0 0 24 24" ${T}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke-width="3.2"/></svg>`,
  ok: `<svg viewBox="0 0 24 24" ${T}><path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="3.2"/></svg>`,
  encore: `<svg viewBox="0 0 24 24" ${T}><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4.5h4.5"/></svg>`,
  main: `<svg viewBox="0 0 48 48"><path d="M17 26V9a3.5 3.5 0 0 1 7 0v12l1-1a3.4 3.4 0 0 1 5 .5l.5.6a3.3 3.3 0 0 1 4.7.9 3.3 3.3 0 0 1 4.8 2.4V33c0 6.5-4.5 11-11 11h-2c-4 0-6.5-1.6-8.7-4.6L12 33a3.4 3.4 0 0 1 5-4.4z" fill="#fff" stroke="#1E2A44" stroke-width="2.6" stroke-linejoin="round"/></svg>`,
};

// ---- Dessins clairs (plats, cernés marine) ----
const D = 'stroke="#1E2A44" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const DESSINS = {
  bedroom: `<svg viewBox="0 0 100 80"><rect x="8" y="22" width="16" height="44" rx="4" fill="#8A5A2E" ${D}/><rect x="20" y="40" width="72" height="18" rx="4" fill="#3F72CF" ${D}/><rect x="24" y="30" width="22" height="12" rx="6" fill="#fff" ${D}/><rect x="46" y="34" width="46" height="10" rx="3" fill="#E0453F" ${D}/><path d="M24 58v10M88 58v10" ${D}/></svg>`,
  bathroom: `<svg viewBox="0 0 100 80"><path d="M10 38h80v8a20 20 0 0 1-20 20H30a20 20 0 0 1-20-20z" fill="#fff" ${D}/><path d="M16 38V18a8 8 0 0 1 16 0" fill="none" ${D}/><rect x="18" y="40" width="64" height="6" fill="#5CC6D6"/><circle cx="60" cy="26" r="6" fill="#DFF5F9" ${D}/><circle cx="72" cy="16" r="4" fill="#DFF5F9" ${D}/><path d="M30 66l-4 8M70 66l4 8" ${D}/></svg>`,
  kitchen: `<svg viewBox="0 0 100 80"><rect x="18" y="30" width="64" height="44" rx="4" fill="#C9CED3" ${D}/><rect x="26" y="48" width="48" height="20" rx="3" fill="#1E2A44"/><circle cx="34" cy="38" r="3" fill="#F08A1C"/><circle cx="66" cy="38" r="3" fill="#F08A1C"/><path d="M36 30v-8h28v8" fill="#E0453F" ${D}/><path d="M64 24h10" ${D}/><path d="M42 16c0-4 4-4 4-8M54 16c0-4 4-4 4-8" fill="none" ${D}/></svg>`,
  "living room": `<svg viewBox="0 0 100 80"><rect x="18" y="24" width="64" height="26" rx="8" fill="#F2B90F" ${D}/><rect x="8" y="38" width="16" height="26" rx="6" fill="#F2B90F" ${D}/><rect x="76" y="38" width="16" height="26" rx="6" fill="#F2B90F" ${D}/><rect x="22" y="46" width="56" height="18" rx="4" fill="#E9A800" ${D}/><path d="M16 64v8M84 64v8" ${D}/></svg>`,
  printemps: `<svg viewBox="0 0 100 80"><path d="M50 74V40" ${D}/><path d="M50 58c-10 0-16-6-18-14 9 0 15 5 18 14zM50 52c8 0 14-5 16-12-8 0-13 4-16 12z" fill="#3BA548" ${D}/><g fill="#F28AB2" ${D}><circle cx="50" cy="16" r="9"/><circle cx="62" cy="24" r="9"/><circle cx="58" cy="37" r="9"/><circle cx="42" cy="37" r="9"/><circle cx="38" cy="24" r="9"/></g><circle cx="50" cy="27" r="7" fill="#F2B90F" ${D}/></svg>`,
  ete: `<svg viewBox="0 0 100 80"><g ${D}><path d="M50 6v10M50 64v10M16 40h10M74 40h10M26 16l7 7M67 57l7 7M74 16l-7 7M33 57l-7 7"/></g><circle cx="50" cy="40" r="17" fill="#F2B90F" ${D}/></svg>`,
  automne: `<svg viewBox="0 0 100 80"><path d="M50 8c14 10 24 22 22 38-2 14-12 22-22 24-10-2-20-10-22-24-2-16 8-28 22-38z" fill="#F08A1C" ${D}/><path d="M50 18v60M50 40l-12-8M50 40l12-8M50 54l-10-7M50 54l10-7" fill="none" ${D}/></svg>`,
  hiver: `<svg viewBox="0 0 100 80"><g fill="none" ${D} stroke="#3F72CF" stroke-width="5"><path d="M50 8v64M22 24l56 32M78 24 22 56"/><path d="M42 12l8 8 8-8M42 68l8-8 8 8M20 34l11 2-3-11M80 46l-11-2 3 11M80 34l-11 2 3-11M20 46l11-2-3 11"/></g></svg>`,
  house: `<svg viewBox="0 0 100 80"><path d="M14 40 50 10l36 30z" fill="#E0453F" ${D}/><rect x="22" y="38" width="56" height="36" fill="#9CC3F5" ${D}/><rect x="44" y="52" width="12" height="22" fill="#8A5A2E" ${D}/><rect x="28" y="46" width="11" height="11" fill="#fff" ${D}/><rect x="61" y="46" width="11" height="11" fill="#fff" ${D}/></svg>`,
  flat: `<svg viewBox="0 0 100 80"><rect x="30" y="4" width="40" height="72" fill="#F08A1C" ${D}/>${[0,1,2,3].map(r=>[0,1,2].map(c=>`<rect x="${35+c*11}" y="${10+r*14}" width="7" height="8" fill="#fff" ${D} stroke-width="2"/>`).join("")).join("")}<rect x="45" y="64" width="10" height="12" fill="#8A5A2E" ${D}/><path d="M8 76h84" ${D}/></svg>`,
  attic: `<svg viewBox="0 0 100 80"><rect x="22" y="38" width="56" height="36" stroke="#9FB0D0" stroke-width="2.5" stroke-linejoin="round" fill="none"/><path d="M14 40 50 8l36 32z" fill="#F2B90F" ${D}/><circle cx="50" cy="26" r="6" fill="#fff" ${D}/><rect x="28" y="30" width="10" height="8" fill="#8A5A2E" ${D}/><rect x="62" y="31" width="9" height="7" fill="#8A5A2E" ${D}/></svg>`,
  cellar: `<svg viewBox="0 0 100 80"><path d="M18 24 50 4l32 20" stroke="#9FB0D0" stroke-width="2.5" stroke-linejoin="round" fill="none"/><rect x="24" y="22" width="52" height="24" stroke="#9FB0D0" stroke-width="2.5" stroke-linejoin="round" fill="none"/><path d="M6 46h88" ${D}/><rect x="22" y="48" width="56" height="28" fill="#8A5A2E" ${D}/><rect x="28" y="52" width="44" height="20" fill="#D7B48A" ${D}/><rect x="33" y="60" width="10" height="12" fill="#8A5A2E" ${D}/><path d="M53 72V60h4v-4h2v4h4v12z" fill="#2E9E57" ${D} stroke-width="2"/></svg>`,
  garage: `<svg viewBox="0 0 100 80"><path d="M10 30 50 14l40 16v44H10z" fill="#C9CED3" ${D}/><rect x="22" y="38" width="56" height="36" fill="#fff" ${D}/><path d="M22 47h56M22 56h56M22 65h56" ${D} stroke-width="2"/></svg>`,
  chimney: `<svg viewBox="0 0 100 80"><path d="M14 44 50 16l36 28" stroke="#9FB0D0" stroke-width="2.5" stroke-linejoin="round" fill="none"/><rect x="22" y="42" width="56" height="34" stroke="#9FB0D0" stroke-width="2.5" stroke-linejoin="round" fill="none"/><rect x="60" y="14" width="14" height="24" fill="#E0453F" ${D}/><rect x="57" y="10" width="20" height="6" fill="#E0453F" ${D}/><path d="M66 6c-4-3 4-5 0-8M74 6c-4-3 4-5 0-8" fill="none" ${D} stroke-width="2.5" transform="translate(0,2)"/></svg>`,
};

// Maison en coupe (4 pièces) avec maman dans une pièce.
const PIECES = { bedroom: [10, 24], bathroom: [50, 24], kitchen: [10, 56], "living room": [50, 56] };
const MEUBLE = {
  bedroom: (x, y) => `<rect x="${x+4}" y="${y+18}" width="22" height="9" rx="2" fill="#3F72CF" ${D} stroke-width="2"/><rect x="${x+4}" y="${y+14}" width="8" height="5" rx="2" fill="#fff" ${D} stroke-width="2"/>`,
  bathroom: (x, y) => `<path d="M${x+4} ${y+18}h24v3a6 6 0 0 1-6 6H${x+10}a6 6 0 0 1-6-6z" fill="#fff" ${D} stroke-width="2"/><circle cx="${x+22}" cy="${y+12}" r="2.5" fill="#DFF5F9" ${D} stroke-width="1.5"/>`,
  kitchen: (x, y) => `<rect x="${x+4}" y="${y+12}" width="18" height="16" fill="#C9CED3" ${D} stroke-width="2"/><rect x="${x+7}" y="${y+19}" width="12" height="7" fill="#1E2A44"/>`,
  "living room": (x, y) => `<rect x="${x+4}" y="${y+16}" width="22" height="11" rx="3" fill="#F2B90F" ${D} stroke-width="2"/>`,
};
function casa(ou) {
  const pieces = Object.entries(PIECES).map(([p, [x, y]]) => `<rect x="${x}" y="${y}" width="40" height="32" fill="${p === ou ? "#FFF6D6" : "#fff"}" ${D}/>${MEUBLE[p](x, y)}`).join("");
  const [mx, my] = PIECES[ou] || [0, 0];
  const maman = ou ? `<g transform="translate(${mx + 32},${my + 6})"><circle cx="0" cy="5" r="4.5" fill="#F3C9A5" ${D} stroke-width="2"/><path d="M-4.5 4a4.5 4.5 0 0 1 9 0c0-4-2-6-4.5-6S-4.5 0-4.5 4z" fill="#6B3E1E"/><path d="M0 10l-6 15h12z" fill="#E0453F" ${D} stroke-width="2"/></g>` : "";
  return `<svg viewBox="0 0 100 92"><path d="M4 26 50 4l46 22z" fill="#E0453F" ${D}/>${pieces}${maman}</svg>`;
}

// Un cromo : un mot de dessin ("kitchen") ou un objet {img|texte, nom}.
function cromo(x, { nom = true } = {}) {
  const it = typeof x === "string" ? { img: x, nom: x } : x;
  const el = document.createElement("div");
  el.className = "cromo";
  const art = it.casa !== undefined ? casa(it.casa) : it.img ? DESSINS[it.img]
    : `<span class="txt${String(it.texte).length > 4 ? " long" : ""}">${it.texte}</span>`;
  el.innerHTML = `<div class="art">${art}</div>${nom && it.nom ? `<b>${it.nom}</b>` : ""}`;
  return el;
}
const melange = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
