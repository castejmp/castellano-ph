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

/* Dibuja la imagen ENTERA dentro del rect (contain: no recorta caras). */
function drawContain(c, img, x, y, w, h) {
  const ir = img.width / img.height, rr = w / h;
  let dw, dh;
  if (ir > rr) { dw = w; dh = w / ir; } else { dh = h; dw = h * ir; }
  c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/* ── Ficha para PDF: foto ENTERA arriba (contain) + datos abajo,
   sin superponerse (así no se corta ninguna cara). ── */
function renderCard(model, W, H) {
  const s = W / 860;
  const panelH = Math.round(H * 0.28);
  const photoH = H - panelH;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');

  // Zona de fotos (fondo oscuro, imágenes contain).
  c.save(); roundRect(c, 1, 1, W - 2, H - 2, 16 * s); c.clip();
  c.fillStyle = '#101014'; c.fillRect(0, 0, W, photoH);
  const photos = model.photos.filter((p) => p.bitmap);
  if (photos.length) {
    const rects = photoRects(photos.length, W, photoH);
    photos.forEach((p, i) => { const [x, y, w, h] = rects[i]; drawContain(c, p.bitmap, x, y, w, h); });
  } else {
    c.fillStyle = '#555'; c.textAlign = 'center'; c.font = `600 ${Math.round(30 * s)}px sans-serif`;
    c.fillText('sin foto', W / 2, photoH / 2);
  }
  // Panel de datos sólido, debajo.
  c.fillStyle = '#0c0c0f'; c.fillRect(0, photoH, W, panelH);
  const dash = (v) => (v && String(v).trim() ? v : '—');
  const px = 30 * s;
  let y = photoH + 46 * s;
  c.textAlign = 'left';
  c.fillStyle = '#fff'; c.font = `800 ${Math.round(42 * s)}px system-ui, sans-serif`;
  c.fillText(dash(model.nombre).toUpperCase(), px, y);
  y += 40 * s;
  c.fillStyle = ACCENT; c.font = `700 ${Math.round(26 * s)}px system-ui, sans-serif`;
  c.fillText(dash(model.instagram), px, y);
  y += 34 * s;
  c.fillStyle = 'rgba(255,255,255,0.82)'; c.font = `500 ${Math.round(24 * s)}px system-ui, sans-serif`;
  const parts = [];
  if (model.telefono) parts.push(`TEL ${model.telefono}`);
  if (model.altura) parts.push(`ALTURA ${model.altura}`);
  if (model.edad) parts.push(`EDAD ${model.edad}`);
  c.fillText(parts.join('   ·   ') || '—', px, y);
  c.restore();

  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
  roundRect(c, 1, 1, W - 2, H - 2, 16 * s); c.stroke();
  return cv;
}

/* ── CSV / hoja de cálculo (separador ; para Excel es-AR, con BOM) ── */
const igUrl = (h) => (h ? 'https://instagram.com/' + h.replace(/^@/, '') : '-');
export function exportCSV(models) {
  const head = ['#', 'Instagram', 'Nombre y apellido', 'Teléfono', 'Altura', 'Edad', 'Fotos', 'Link Instagram'];
  const esc = (v) => `"${String(v ?? '-').replace(/"/g, '""')}"`;
  const rows = models.map((m, i) => [
    i + 1, m.instagram || '-', m.nombre || '-', m.telefono || '-', m.altura || '-', m.edad || '-',
    m.photos.length, igUrl(m.instagram),
  ].map(esc).join(';'));
  const csv = '﻿' + [head.map(esc).join(';'), ...rows].join('\r\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

/* ── PDF: planilla A4, 4 fichas por página ── */
export async function exportPDF(models) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const M = 30, cols = 2, rows = 2, gap = 16, headH = 44;
  const per = cols * rows;
  const cw = (pw - 2 * M - (cols - 1) * gap) / cols;
  const chh = (ph - 2 * M - headH - (rows - 1) * gap) / rows;

  models.forEach((m, i) => {
    const k = i % per;
    if (i > 0 && k === 0) doc.addPage();
    if (k === 0) {
      doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(20);
      doc.text('CASTELLANO · CASTING', M, M + 18);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
      doc.text(`${models.length} modelos · pág. ${Math.floor(i / per) + 1}`, pw - M, M + 18, { align: 'right' });
    }
    const col = k % cols, row = Math.floor(k / cols);
    const x = M + col * (cw + gap), y = M + headH + row * (chh + gap);
    const card = renderCard(m, Math.round(cw * 2), Math.round(chh * 2));
    doc.addImage(card, 'PNG', x, y, cw, chh);
  });
  return doc.output('blob');
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
