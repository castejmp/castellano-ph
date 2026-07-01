/**
 * EXPORTACIÓN — arma un tablero de casting (grilla de fichas) y lo
 * exporta como PSD por capas (un grupo por modelo: foto + datos) con
 * preview aplanado, o como PNG (contacto liviano).
 */

const ACCENT = '#e0a84f';

/** Layout: escala global para no pasar los límites de canvas (~12000px). */
function layout(n) {
  const cols = n <= 2 ? n : n <= 6 ? 3 : 4;
  const cardW = 860, cardH = 1180, gap = 44, margin = 60;
  const rows = Math.ceil(n / cols);
  let boardW = margin * 2 + cols * cardW + (cols - 1) * gap;
  let boardH = margin * 2 + rows * cardH + (rows - 1) * gap;
  const s = Math.min(1, 12000 / boardH, 16000 / boardW);
  return { cols, rows, s, cardW: cardW * s, cardH: cardH * s, gap: gap * s, margin: margin * s,
    boardW: Math.round(boardW * s), boardH: Math.round(boardH * s) };
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** Rects para acomodar N fotos dentro del área de imagen. */
function photoRects(n, W, H) {
  if (n <= 1) return [[0, 0, W, H]];
  if (n === 2) return [[0, 0, W / 2, H], [W / 2, 0, W / 2, H]];
  if (n === 3) return [[0, 0, W / 2, H], [W / 2, 0, W / 2, H / 2], [W / 2, H / 2, W / 2, H / 2]];
  const cols = n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const cw = W / cols, ch = H / rows;
  return Array.from({ length: n }, (_, i) => [(i % cols) * cw, Math.floor(i / cols) * ch, cw, ch]);
}

function drawCover(c, img, x, y, w, h) {
  const ir = img.width / img.height, rr = w / h;
  let sw, sh, sx, sy;
  if (ir > rr) { sh = img.height; sw = sh * rr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / rr; sx = 0; sy = (img.height - sh) / 2; }
  c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Canvas con SOLO las fotos de un modelo (área de imagen del card). */
function fotoCanvas(model, cardW, imgH) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(cardW); cv.height = Math.round(imgH);
  const c = cv.getContext('2d');
  const photos = model.photos.length ? model.photos : [];
  if (!photos.length) {
    c.fillStyle = '#1a1a1f'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#555'; c.textAlign = 'center'; c.font = `600 ${Math.round(cardW * 0.05)}px sans-serif`;
    c.fillText('sin foto', cv.width / 2, cv.height / 2);
    return cv;
  }
  const rects = photoRects(photos.length, cv.width, cv.height);
  photos.forEach((p, i) => {
    const [x, y, w, h] = rects[i];
    if (p.bitmap) drawCover(c, p.bitmap, x, y, w, h);
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
  });
  return cv;
}

/** Canvas con SOLO el panel de datos (abajo del card). */
function datosCanvas(model, cardW, cardH, s) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(cardW); cv.height = Math.round(cardH);
  const c = cv.getContext('2d');
  const panelH = 300 * s;
  const y0 = cv.height - panelH;
  // Degradé + panel.
  const g = c.createLinearGradient(0, y0 - 60 * s, 0, cv.height);
  g.addColorStop(0, 'rgba(10,10,12,0)');
  g.addColorStop(1, 'rgba(10,10,12,0.92)');
  c.fillStyle = g;
  c.fillRect(0, y0 - 60 * s, cv.width, panelH + 60 * s);

  const dash = (v) => (v && v.trim() ? v : '—');
  const px = 40 * s;
  let y = y0 + 70 * s;
  // Nombre.
  c.fillStyle = '#fff';
  c.textAlign = 'left';
  c.font = `800 ${Math.round(52 * s)}px system-ui, sans-serif`;
  c.fillText(dash(model.nombre).toUpperCase(), px, y);
  y += 58 * s;
  // Instagram (acento).
  c.fillStyle = ACCENT;
  c.font = `700 ${Math.round(32 * s)}px system-ui, sans-serif`;
  c.fillText(dash(model.instagram), px, y);
  y += 48 * s;
  // Datos.
  c.fillStyle = 'rgba(255,255,255,0.82)';
  c.font = `500 ${Math.round(30 * s)}px system-ui, sans-serif`;
  const line = (label, v) => { c.fillText(`${label}  ${dash(v)}`, px, y); y += 42 * s; };
  line('TEL', model.telefono);
  line('ALTURA', model.altura);
  line('EDAD', model.edad);
  return cv;
}

/** Construye tablero + descriptores de capa. */
function build(models) {
  const n = models.length;
  const L = layout(n);
  const imgH = L.cardH; // el panel de datos va superpuesto abajo
  const board = document.createElement('canvas');
  board.width = L.boardW; board.height = L.boardH;
  const bc = board.getContext('2d');
  bc.fillStyle = '#0d0d10'; bc.fillRect(0, 0, board.width, board.height);

  const groups = [];
  models.forEach((m, i) => {
    const col = i % L.cols, row = Math.floor(i / L.cols);
    const x = Math.round(L.margin + col * (L.cardW + L.gap));
    const y = Math.round(L.margin + row * (L.cardH + L.gap));
    const foto = fotoCanvas(m, L.cardW, imgH);
    const datos = datosCanvas(m, L.cardW, L.cardH, L.s);
    // Aplanado.
    bc.save();
    roundRect(bc, x, y, L.cardW, L.cardH, 18 * L.s);
    bc.clip();
    bc.drawImage(foto, x, y);
    bc.drawImage(datos, x, y);
    bc.restore();
    bc.strokeStyle = 'rgba(255,255,255,0.08)'; bc.lineWidth = 2;
    roundRect(bc, x, y, L.cardW, L.cardH, 18 * L.s); bc.stroke();

    groups.push({
      name: `${String(i + 1).padStart(2, '0')} · ${m.nombre || m.instagram || 'modelo'}`,
      opened: false,
      children: [
        { name: 'datos', canvas: datos, left: x, top: y },
        { name: 'foto', canvas: foto, left: x, top: y },
      ],
    });
  });
  return { board, groups, L };
}

export function renderBoard(models) {
  return build(models).board;
}

export async function exportPNG(models) {
  const board = renderBoard(models);
  return new Promise((res) => board.toBlob((b) => res(b), 'image/png'));
}

export async function exportPSD(models) {
  const { writePsd } = await import('ag-psd');
  const { board, groups } = build(models);
  const psd = {
    width: board.width,
    height: board.height,
    canvas: board, // preview aplanado (lleva el fondo oscuro)
    // En ag-psd children[0] es la capa superior → grupos arriba.
    // Dentro de cada grupo: datos (texto) sobre foto.
    children: groups,
  };
  const buffer = writePsd(psd, { generateThumbnail: true });
  return new Blob([buffer], { type: 'image/vnd.adobe.photoshop' });
}
