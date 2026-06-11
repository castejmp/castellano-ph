import * as THREE from 'three';

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
