import * as THREE from 'three';

/**
 * Wordmark "castellano" CALCADO del logo: letras geométricas dibujadas
 * a mano (anillos, fustes y arcos de trazo uniforme), no una fuente.
 * Lo usan el neón del piso (textura) y la nav (dataURL).
 */
export function wordmarkCanvas() {
  const H = 130, W = 36, A = 174;          // x-height, trazo, ascendente
  const R = (H - W) / 2;                    // radio a centro de trazo
  const gap = 24;
  const widths = { c: H, a: H, s: H * 0.78, t: H * 0.6, e: H, l: W, n: H * 0.86, o: H };
  const word = 'castellano';
  const total = [...word].reduce((s, ch) => s + widths[ch], 0) + gap * (word.length - 1);
  const padX = 70;
  const cw = Math.round(total + padX * 2);
  const chh = Math.round(cw * (1.5 / 7)); // mismo aspecto que el cartel del piso
  const cnv = document.createElement('canvas');
  cnv.width = cw; cnv.height = chh;
  const c = cnv.getContext('2d');
  c.fillStyle = c.strokeStyle = '#ffffff';
  c.lineWidth = W;
  c.lineCap = 'butt';
  const y0 = chh / 2 + (H + (A - H) / 2) / 2; // baseline (deja aire al ascendente)
  const cy = y0 - H / 2;                       // centro de los anillos
  let x = padX;
  const stem = (sx, yTop, yBot) => c.fillRect(sx - W / 2, yTop, W, yBot - yTop);
  const ring = (cx) => { c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke(); };
  const G = {
    c() { const cx = x + H / 2; c.beginPath(); c.arc(cx, cy, R, 0.62, Math.PI * 2 - 0.62); c.stroke(); },
    a() { const cx = x + H / 2; ring(cx); stem(cx + R, y0 - H, y0); },
    s() {
      const cx = x + widths.s / 2;
      const q = (H - W) / 4;
      const cy1 = y0 - H + W / 2 + q, cy2 = y0 - W / 2 - q;
      c.beginPath(); c.arc(cx, cy1, q, 1.95 * Math.PI, 0.6 * Math.PI, true); c.stroke();
      c.beginPath(); c.arc(cx, cy2, q, 0.95 * Math.PI, 1.6 * Math.PI, true); c.stroke();
    },
    t() {
      const cx = x + widths.t / 2;
      c.beginPath(); // fuste con el tope cortado en diagonal, como el logo
      c.moveTo(cx - W / 2, y0);
      c.lineTo(cx - W / 2, y0 - A + 18);
      c.lineTo(cx + W / 2, y0 - A);
      c.lineTo(cx + W / 2, y0);
      c.closePath(); c.fill();
      c.fillRect(x, y0 - H, widths.t, W); // travesaño
    },
    e() {
      const cx = x + H / 2;
      ring(cx);
      c.fillRect(cx - R - W / 2, cy - W / 2, 2 * R + W, W); // barra central
    },
    l() { stem(x + W / 2, y0 - A, y0); },
    n() {
      const w = widths.n;
      const Rn = (w - W) / 2;
      const acy = y0 - H + W / 2 + Rn;
      stem(x + W / 2, y0 - H, y0);
      stem(x + w - W / 2, acy, y0);
      c.beginPath(); c.arc(x + w / 2, acy, Rn, Math.PI, 0); c.stroke();
    },
    o() { ring(x + H / 2); },
  };
  for (const ch of word) { G[ch](); x += widths[ch] + gap; }
  return cnv;
}

/**
 * CALCO DE MARCA — carga un logo real (PNG/JPG) y lo convierte en
 * glifo blanco sobre transparente, listo para neón/LED:
 *   · si la imagen tiene alpha (logo recortado), se usa el alpha;
 *   · si viene negro sobre blanco, se umbralizan los píxeles oscuros.
 * Devuelve { texture, aspect } o null si el archivo no existe
 * (queda el dibujo procedural como fallback).
 */
export async function loadBrandGlyph(url) {
  const img = await new Promise((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = url;
  });
  if (!img) return null;

  const cnv = document.createElement('canvas');
  cnv.width = img.naturalWidth;
  cnv.height = img.naturalHeight;
  const c = cnv.getContext('2d');
  c.drawImage(img, 0, 0);
  const data = c.getImageData(0, 0, cnv.width, cnv.height);
  const px = data.data;

  let hasAlpha = false;
  for (let i = 3; i < px.length; i += 4) {
    if (px[i] < 250) { hasAlpha = true; break; }
  }
  for (let i = 0; i < px.length; i += 4) {
    const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
    const glyph = hasAlpha ? px[i + 3] > 40 : lum < 140;
    px[i] = 255; px[i + 1] = 255; px[i + 2] = 255;
    px[i + 3] = glyph ? 255 : 0;
  }
  c.putImageData(data, 0, 0);

  const texture = new THREE.CanvasTexture(cnv);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, aspect: cnv.height / cnv.width, image: cnv };
}
