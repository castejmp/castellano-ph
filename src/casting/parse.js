/**
 * PARSER DE CASTING — de texto libre (lo que mandan por WhatsApp) a campos.
 * Extrae: instagram, nombre y apellido, teléfono, altura, edad.
 * Lo que no encuentra queda vacío (la UI muestra un guion).
 *
 * Ejemplos que resuelve:
 *   "mi número es 3534193510 y mido 1,64
 *    https://www.instagram.com/ffranfrossasco_/
 *    17 AÑOS"
 *   "Fran Frossasco / @ffran / 353 419 3510 / 1.64 / 17 años"
 */

const IG_RE = /(?:instagram\.com\/|(?:^|\s)@)([A-Za-z0-9._]{2,30})/i;
const AGE_RE = /\b(1[0-9]|[2-9][0-9])\s*(?:años?|anios?|a[ñn]os|yo|y\/o)\b/i;
const AGE_LABEL_RE = /\bedad\s*:?\s*(1[0-9]|[2-9][0-9])\b/i;
// Altura en metros: 1,64 · 1.64 · 1 64
const H_M_RE = /\b(1)[\s.,](\d{2})\b/;
// Altura con palabra clave: "mido 164", "altura 1,70"
const H_KW_RE = /(?:mido|mide|altura|estatura)\D{0,8}(1)[\s.,]?(\d{2})\b/i;
// Altura en cm: "164 cm"
const H_CM_RE = /\b(1\d{2})\s*(?:cm|c\.m\.|centimetros|centímetros)\b/i;

function cleanHandle(h) {
  return '@' + h.replace(/[._]+$/, '').replace(/\/+$/, '');
}

function formatPhone(digits) {
  if (!digits) return '';
  let d = digits.replace(/\D/g, '');
  // Sacar 0 y 15 de formatos locales viejos: 0353 15 419-3510
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 11 && d.startsWith('54')) {
    const r = d.slice(2);
    return `+54 ${r.slice(0, 3)} ${r.slice(3, 6)} ${r.slice(6)}`;
  }
  if (d.length === 13 && d.startsWith('549')) {
    const r = d.slice(3);
    return `+54 9 ${r.slice(0, 3)} ${r.slice(3, 6)} ${r.slice(6)}`;
  }
  return d;
}

function findPhone(t) {
  const cands = t.match(/(\+?\d[\d\s().-]{5,}\d)/g) || [];
  let best = '', bestLen = 0;
  for (const c of cands) {
    const d = c.replace(/\D/g, '');
    if (d.length >= 8 && d.length <= 14 && d.length > bestLen) { best = d; bestLen = d.length; }
  }
  return best;
}

const NAME_LABEL_RE = /(?:me llamo|mi nombre es|nombre\s*:?|soy)\s+([A-Za-zÀ-ÿ'’]+(?:\s+[A-Za-zÀ-ÿ'’]+){0,3})/i;
const STOP = /^(hola|soy|mi|de|la|el|una|un|modelo|chica|chico|años?|edad|tel|cel|celular|whatsapp|wsp|mido|mide|altura|instagram|ig)$/i;

function nameLike(line) {
  if (!line || line.length < 2 || line.length > 44) return false;
  if (/\d/.test(line)) return false;
  if (/@|https?:|instagram|www\.|\/|!|:/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  if (STOP.test(words[0])) return false;
  return /^[A-Za-zÀ-ÿ'’ ]+$/.test(line);
}

function findName(text) {
  // 1) "soy / me llamo / nombre: X"
  const lbl = text.match(NAME_LABEL_RE);
  if (lbl && !STOP.test(lbl[1].split(/\s+/)[0])) return titleCase(lbl[1].trim());
  // 2) Un segmento (línea, o separado por / , · |) que parezca nombre.
  for (const raw of text.split(/[\n\r/,·|]+/)) {
    const line = raw.trim();
    if (nameLike(line)) return titleCase(line);
  }
  return '';
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-zà-ÿ])/g, (m) => m.toUpperCase());
}

export function parseCasting(text) {
  const t = ' ' + text + ' ';
  let work = t;

  // Instagram
  let instagram = '';
  const ig = t.match(IG_RE);
  if (ig) { instagram = cleanHandle(ig[1]); work = work.replace(ig[0], ' '); }

  // Edad
  let edad = '';
  const ageL = work.match(AGE_LABEL_RE) || work.match(AGE_RE);
  if (ageL) { edad = `${ageL[1]} años`; work = work.replace(ageL[0], ' '); }

  // Altura (metros → palabra clave → cm)
  let altura = '';
  let hm = work.match(H_KW_RE) || work.match(H_M_RE);
  if (hm) { altura = `${hm[1]},${hm[2]} m`; work = work.replace(hm[0], ' '); }
  else {
    const hc = work.match(H_CM_RE);
    if (hc) { const v = hc[1]; altura = `${v[0]},${v.slice(1)} m`; work = work.replace(hc[0], ' '); }
  }

  // Teléfono (sobre el texto ya limpio de altura/edad)
  const telefono = formatPhone(findPhone(work));

  // Nombre
  const nombre = findName(text);

  return { instagram, nombre, telefono, altura, edad };
}
