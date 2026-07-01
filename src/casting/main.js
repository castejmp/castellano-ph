import './styles.css';
import { parseCasting } from './parse.js';
import { exportPSD, exportPNG, renderBoard } from './psd.js';

/* ── Estado ─────────────────────────────────────── */
let models = [];
let draft = { photos: [] };
let seq = 1;

const FIELDS = [
  { key: 'instagram', label: 'Instagram', ph: '@usuario' },
  { key: 'nombre', label: 'Nombre y apellido', ph: 'Nombre Apellido' },
  { key: 'telefono', label: 'Teléfono', ph: '353 000 0000' },
  { key: 'altura', label: 'Altura', ph: '1,64 m' },
  { key: 'edad', label: 'Edad', ph: '17 años' },
];

/* Persistencia de texto (las fotos quedan en memoria de la sesión). */
function persist() {
  try {
    localStorage.setItem('casting', JSON.stringify(
      models.map((m) => ({ instagram: m.instagram, nombre: m.nombre, telefono: m.telefono, altura: m.altura, edad: m.edad }))
    ));
  } catch { /* sin storage */ }
}
function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem('casting') || '[]');
    models = raw.map((m) => ({ id: seq++, photos: [], ...m }));
  } catch { models = []; }
}

/* ── Fotos ──────────────────────────────────────── */
async function toPhoto(file) {
  const url = URL.createObjectURL(file);
  let bitmap = null;
  try { bitmap = await createImageBitmap(file); } catch { /* no imagen */ }
  return { url, bitmap, name: file.name };
}
async function filesToPhotos(fileList) {
  const imgs = [...fileList].filter((f) => f.type.startsWith('image/'));
  return Promise.all(imgs.map(toPhoto));
}

/* ── DOM raíz ───────────────────────────────────── */
const app = document.getElementById('app');
app.innerHTML = `
  <header class="top">
    <div class="brand"><span class="mark"></span> CASTING</div>
    <div class="actions">
      <span class="count" data-count>0 modelos</span>
      <button class="btn ghost" data-png>PNG</button>
      <button class="btn solid" data-psd>Descargar PSD</button>
    </div>
  </header>

  <section class="add">
    <div class="add-grid">
      <div class="add-text">
        <label>Pegá el texto del modelo</label>
        <textarea data-text placeholder="mi número es 3534193510 y mido 1,64
https://www.instagram.com/usuario/
17 años"></textarea>
      </div>
      <div class="add-drop" data-drop>
        <input type="file" accept="image/*" multiple hidden data-file />
        <div class="drop-inner">
          <div class="drop-thumbs" data-draft-thumbs></div>
          <p class="drop-hint">Arrastrá o pegá las fotos acá<br><span>o hacé click para elegir</span></p>
        </div>
      </div>
    </div>
    <div class="add-foot">
      <button class="btn solid" data-addbtn>＋ Agregar al casting</button>
      <span class="tip">También podés pegar varios bloques separados por una línea en blanco.</span>
    </div>
  </section>

  <section class="list" data-list></section>
`;

const listEl = app.querySelector('[data-list]');
const countEl = app.querySelector('[data-count]');
const textEl = app.querySelector('[data-text]');
const dropEl = app.querySelector('[data-drop]');
const fileEl = app.querySelector('[data-file]');
const draftThumbs = app.querySelector('[data-draft-thumbs]');

/* ── Draft: dropzone de fotos ───────────────────── */
function renderDraftThumbs() {
  draftThumbs.innerHTML = draft.photos.map((p, i) =>
    `<div class="thumb"><img src="${p.url}" alt=""><button data-draft-del="${i}">✕</button></div>`
  ).join('');
  draftThumbs.querySelectorAll('[data-draft-del]').forEach((b) =>
    b.addEventListener('click', (e) => { e.stopPropagation(); draft.photos.splice(+b.dataset.draftDel, 1); renderDraftThumbs(); }));
}
dropEl.addEventListener('click', () => fileEl.click());
fileEl.addEventListener('change', async () => { draft.photos.push(...await filesToPhotos(fileEl.files)); renderDraftThumbs(); fileEl.value = ''; });
['dragover', 'dragenter'].forEach((ev) => dropEl.addEventListener(ev, (e) => { e.preventDefault(); dropEl.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => dropEl.addEventListener(ev, () => dropEl.classList.remove('over')));
dropEl.addEventListener('drop', async (e) => { e.preventDefault(); draft.photos.push(...await filesToPhotos(e.dataTransfer.files)); renderDraftThumbs(); });
// Pegar imágenes desde el portapapeles en cualquier parte del add.
app.querySelector('.add').addEventListener('paste', async (e) => {
  const files = [...(e.clipboardData?.files || [])];
  if (files.length) { draft.photos.push(...await filesToPhotos(files)); renderDraftThumbs(); }
});

/* ── Agregar modelo(s) ──────────────────────────── */
app.querySelector('[data-addbtn]').addEventListener('click', () => {
  const raw = textEl.value.trim();
  const blocks = raw ? raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean) : [''];
  blocks.forEach((block, i) => {
    const parsed = parseCasting(block);
    const photos = i === 0 ? draft.photos : []; // las fotos del draft van al primero
    models.push({ id: seq++, photos, ...parsed });
  });
  draft = { photos: [] };
  textEl.value = '';
  renderDraftThumbs();
  renderList();
  persist();
});

/* ── Lista de fichas ────────────────────────────── */
function renderList() {
  countEl.textContent = `${models.length} ${models.length === 1 ? 'modelo' : 'modelos'}`;
  listEl.innerHTML = models.map((m, i) => cardHTML(m, i)).join('');
  models.forEach((m, i) => wireCard(listEl.children[i], m, i));
}

function cardHTML(m, i) {
  const missing = FIELDS.filter((f) => !String(m[f.key] || '').trim()).length;
  return `
    <article class="card" data-i="${i}">
      <div class="card-photos" data-photos>
        ${m.photos.map((p, j) => `<div class="thumb"><img src="${p.url}"><button data-del="${j}">✕</button></div>`).join('')}
        <button class="thumb add-thumb" data-addphoto>＋</button>
      </div>
      <div class="card-fields">
        <div class="card-head">
          <span class="idx">${String(i + 1).padStart(2, '0')}</span>
          ${missing ? `<span class="warn">${missing} sin dato</span>` : `<span class="ok">completo</span>`}
          <div class="card-tools">
            <button data-up title="Subir">▲</button>
            <button data-down title="Bajar">▼</button>
            <button data-remove title="Eliminar">🗑</button>
          </div>
        </div>
        ${FIELDS.map((f) => `
          <label class="field">
            <span>${f.label}</span>
            <input data-key="${f.key}" value="${escapeHtml(m[f.key] || '')}" placeholder="${f.ph}" />
          </label>`).join('')}
      </div>
    </article>`;
}

function wireCard(el, m, i) {
  el.querySelectorAll('input[data-key]').forEach((inp) =>
    inp.addEventListener('input', () => { m[inp.dataset.key] = inp.value; persist(); updateCardBadge(el, m); }));
  el.querySelector('[data-remove]').addEventListener('click', () => { models.splice(i, 1); renderList(); persist(); });
  el.querySelector('[data-up]').addEventListener('click', () => { if (i > 0) { [models[i - 1], models[i]] = [models[i], models[i - 1]]; renderList(); persist(); } });
  el.querySelector('[data-down]').addEventListener('click', () => { if (i < models.length - 1) { [models[i + 1], models[i]] = [models[i], models[i + 1]]; renderList(); persist(); } });

  const photosEl = el.querySelector('[data-photos]');
  el.querySelector('[data-addphoto]').addEventListener('click', () => pickPhotos(m));
  photosEl.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', () => { m.photos.splice(+b.dataset.del, 1); renderList(); }));
  ['dragover', 'dragenter'].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); el.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => el.addEventListener(ev, () => el.classList.remove('over')));
  el.addEventListener('drop', async (e) => { e.preventDefault(); m.photos.push(...await filesToPhotos(e.dataTransfer.files)); renderList(); });
}

function updateCardBadge(el, m) {
  const missing = FIELDS.filter((f) => !String(m[f.key] || '').trim()).length;
  const head = el.querySelector('.card-head');
  const badge = head.querySelector('.warn, .ok');
  if (missing) { badge.className = 'warn'; badge.textContent = `${missing} sin dato`; }
  else { badge.className = 'ok'; badge.textContent = 'completo'; }
}

function pickPhotos(m) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
  inp.addEventListener('change', async () => { m.photos.push(...await filesToPhotos(inp.files)); renderList(); });
  inp.click();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ── Exportar ───────────────────────────────────── */
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
async function withBusy(btn, fn) {
  if (!models.length) { alert('Agregá al menos un modelo.'); return; }
  const txt = btn.textContent; btn.textContent = 'Generando…'; btn.disabled = true;
  try { await fn(); } catch (e) { console.error(e); alert('Error al exportar: ' + e.message); }
  btn.textContent = txt; btn.disabled = false;
}
app.querySelector('[data-psd]').addEventListener('click', (e) =>
  withBusy(e.target, async () => download(await exportPSD(models), `casting-${stamp()}.psd`)));
app.querySelector('[data-png]').addEventListener('click', (e) =>
  withBusy(e.target, async () => download(await exportPNG(models), `casting-${stamp()}.png`)));

/* ── Init ───────────────────────────────────────── */
restore();
renderList();
renderDraftThumbs();
