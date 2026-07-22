import './styles.css';
import { parseCasting } from './parse.js';
import { exportPSD, exportPNG, exportCSV, exportPDF } from './psd.js';
import { saveModel, deleteModel, loadAll } from './idb.js';
import { cloudEnabled } from './cloud-config.js';

/* ── Estado ─────────────────────────────────────── */
let models = [];
let trash = [];
let draft = { photos: [] };
let cloud = null; // módulo de nube (lazy) cuando hay sesión
const filters = { q: '', sort: 'manual', emin: '', emax: '' };

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

/* Vista = modelos filtrados + ordenados (no altera el orden guardado). */
const ageOf = (m) => { const n = parseInt(String(m.edad).match(/\d+/)?.[0], 10); return Number.isFinite(n) ? n : NaN; };
const surnameOf = (m) => { const w = String(m.nombre || '').trim().split(/\s+/); return w.length > 1 ? w[w.length - 1] : (w[0] || ''); };
const cmp = (a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
const isManual = () => filters.sort === 'manual' && !filters.q && !filters.emin && !filters.emax;

function currentView() {
  const q = filters.q.trim().toLowerCase();
  let v = models.filter((m) => {
    if (q && !`${m.nombre || ''} ${m.instagram || ''} ${m.telefono || ''}`.toLowerCase().includes(q)) return false;
    const a = ageOf(m);
    if (filters.emin && (!Number.isFinite(a) || a < +filters.emin)) return false;
    if (filters.emax && (!Number.isFinite(a) || a > +filters.emax)) return false;
    return true;
  });
  const s = filters.sort;
  if (s === 'nombre') v.sort((a, b) => cmp(a.nombre || '~', b.nombre || '~'));
  else if (s === 'apellido') v.sort((a, b) => cmp(surnameOf(a) || '~', surnameOf(b) || '~'));
  else if (s === 'edad-asc') v.sort((a, b) => (ageOf(a) || 999) - (ageOf(b) || 999));
  else if (s === 'edad-desc') v.sort((a, b) => (ageOf(b) || -1) - (ageOf(a) || -1));
  return v;
}

const FIELDS = [
  { key: 'instagram', label: 'Instagram', ph: '@usuario' },
  { key: 'nombre', label: 'Nombre y apellido', ph: 'Nombre Apellido' },
  { key: 'telefono', label: 'Teléfono', ph: '353 000 0000' },
  { key: 'altura', label: 'Altura', ph: '1,64 m' },
  { key: 'edad', label: 'Edad', ph: '17 años' },
];

/* ── Base de datos local (IndexedDB): guarda fichas + fotos ── */
function markSaved(ok = true) {
  const el = document.querySelector('[data-saved]');
  if (!el) return;
  el.textContent = ok ? (cloud ? 'guardado en la nube ✓' : 'guardado ✓') : 'error al guardar';
  el.classList.toggle('err', !ok);
  el.classList.add('on');
  clearTimeout(markSaved._t);
  markSaved._t = setTimeout(() => el.classList.remove('on'), 1600);
}
async function persist(m) {
  try {
    m.ord = models.indexOf(m);
    await saveModel(m);
    if (cloud) await cloud.pushModel(m);
    markSaved();
  } catch (e) { console.warn('No se pudo guardar:', e); markSaved(false); }
}
/** Guarda una ficha sin recalcular su orden (para mover a/desde papelera). */
async function saveOne(m) {
  try {
    await saveModel(m);
    if (cloud) await cloud.pushModel(m);
    markSaved();
  } catch (e) { console.warn('No se pudo guardar:', e); markSaved(false); }
}
async function persistAll() {
  try {
    await Promise.all(models.map((m, i) => { m.ord = i; return saveModel(m); }));
    if (cloud) await Promise.all(models.map((m) => cloud.pushModel(m)));
    markSaved();
  } catch (e) { console.warn('No se pudo guardar:', e); markSaved(false); }
}
let loadNote = null; // mensaje de estado de carga (se muestra si algo falla)
async function restore() {
  loadNote = null;
  // Con sesión en la nube: la nube manda. Sin ella: base local (IndexedDB).
  if (cloud) {
    try {
      const rows = await cloud.listModels();
      const all = await Promise.all(rows.map(async (r) => ({
        id: r.id, ord: r.ord, trashed: !!r.trashed,
        instagram: r.instagram, nombre: r.nombre,
        telefono: r.telefono, altura: r.altura, edad: r.edad,
        photos: await Promise.all((r.fotos || []).map(cloudPhoto)),
      })));
      models = all.filter((m) => !m.trashed);
      trash = all.filter((m) => m.trashed);
      for (const m of all) await saveModel(m); // cache local
      // Si la nube estaba vacía pero hay datos locales, subirlos (migración).
      if (!all.length) {
        const recs = await loadAll();
        if (recs.length) {
          const locals = await Promise.all(recs.map(async (r) => ({
            ...r, trashed: !!r.trashed, photos: await Promise.all((r.photos || []).map(rehydrate)),
          })));
          models = locals.filter((m) => !m.trashed);
          trash = locals.filter((m) => m.trashed);
          for (const m of locals) await cloud.pushModel(m).catch(() => {});
        }
      }
      return;
    } catch (e) {
      console.error('Error cargando la nube:', e);
      loadNote = 'No se pudo cargar la base de la nube: ' + (e?.message || e) + ' — mostrando lo que haya local.';
    }
  }
  try {
    const recs = await loadAll();
    const all = await Promise.all(recs.map(async (r) => ({
      ...r, trashed: !!r.trashed, photos: await Promise.all((r.photos || []).map(rehydrate)),
    })));
    models = all.filter((m) => !m.trashed);
    trash = all.filter((m) => m.trashed);
  } catch { models = []; trash = []; }
}
async function cloudPhoto({ path, name }) {
  try {
    const file = await cloud.fetchPhoto(path);
    const url = URL.createObjectURL(file);
    let bitmap = null;
    try { bitmap = await createImageBitmap(file); } catch { /* no imagen */ }
    return { file, url, bitmap, name, path };
  } catch { return { name, path, url: '', bitmap: null }; }
}
async function rehydrate({ file, name }) {
  const url = URL.createObjectURL(file);
  let bitmap = null;
  try { bitmap = await createImageBitmap(file); } catch { /* no imagen */ }
  return { file, url, bitmap, name };
}

/* ── Fotos ──────────────────────────────────────── */
async function toPhoto(file) {
  const url = URL.createObjectURL(file);
  let bitmap = null;
  try { bitmap = await createImageBitmap(file); } catch { /* no imagen */ }
  return { file, url, bitmap, name: file.name };
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
      <span class="saved" data-saved>guardado ✓</span>
      <span class="count" data-count>0 modelos</span>
      <button class="btn ghost" data-csv>CSV</button>
      <button class="btn ghost" data-pdf>PDF</button>
      <button class="btn ghost" data-png>PNG</button>
      <button class="btn solid" data-psd>PSD</button>
      <button class="btn ghost" data-trash title="Papelera">🗑 Papelera <b data-trashn>0</b></button>
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

  <section class="filters">
    <input class="f-search" data-q placeholder="Buscar por nombre, IG o teléfono…" />
    <label class="f-sort">Ordenar
      <select data-sort>
        <option value="manual">Manual</option>
        <option value="nombre">Nombre A→Z</option>
        <option value="apellido">Apellido A→Z</option>
        <option value="edad-asc">Edad ↑</option>
        <option value="edad-desc">Edad ↓</option>
      </select>
    </label>
    <label class="f-age">Edad
      <input type="number" data-emin placeholder="mín" min="0" max="120" />
      <span>–</span>
      <input type="number" data-emax placeholder="máx" min="0" max="120" />
    </label>
    <button class="btn ghost f-clear" data-clearf hidden>Limpiar filtros</button>
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
    models.push({ id: uid(), photos, ...parsed });
  });
  draft = { photos: [] };
  textEl.value = '';
  renderDraftThumbs();
  renderList();
  persistAll();
});

/* ── Filtros / orden ────────────────────────────── */
{
  const qEl = app.querySelector('[data-q]');
  const sortEl = app.querySelector('[data-sort]');
  const eminEl = app.querySelector('[data-emin]');
  const emaxEl = app.querySelector('[data-emax]');
  qEl.addEventListener('input', () => { filters.q = qEl.value; renderList(); });
  sortEl.addEventListener('change', () => { filters.sort = sortEl.value; renderList(); });
  eminEl.addEventListener('input', () => { filters.emin = eminEl.value; renderList(); });
  emaxEl.addEventListener('input', () => { filters.emax = emaxEl.value; renderList(); });
  app.querySelector('[data-clearf]').addEventListener('click', () => {
    filters.q = ''; filters.sort = 'manual'; filters.emin = ''; filters.emax = '';
    qEl.value = ''; sortEl.value = 'manual'; eminEl.value = ''; emaxEl.value = '';
    renderList();
  });
}

/* ── Lista de fichas ────────────────────────────── */
function renderList() {
  const v = currentView();
  const filtered = v.length !== models.length || !isManual();
  countEl.textContent = filtered
    ? `${v.length} de ${models.length}`
    : `${models.length} ${models.length === 1 ? 'modelo' : 'modelos'}`;
  const manual = isManual();
  listEl.innerHTML = v.length
    ? v.map((m, i) => cardHTML(m, i, manual)).join('')
    : `<p class="list-empty">${models.length ? 'Ningún modelo coincide con el filtro.' : 'Todavía no cargaste modelos.'}</p>`;
  v.forEach((m, i) => { if (listEl.children[i]) wireCard(listEl.children[i], m); });
  const tn = app.querySelector('[data-trashn]');
  if (tn) tn.textContent = trash.length;
  const cf = app.querySelector('[data-clearf]');
  if (cf) cf.hidden = isManual();
}

const igHref = (h) => 'https://instagram.com/' + String(h || '').replace(/^@/, '').trim();

function cardHTML(m, i, manual) {
  const missing = FIELDS.filter((f) => !String(m[f.key] || '').trim()).length;
  const idx = String(i + 1).padStart(2, '0');
  const badge = missing ? `<span class="warn">${missing} sin dato</span>` : '<span class="ok">completo</span>';
  const tools = `
    ${manual ? '<button data-up title="Subir">▲</button><button data-down title="Bajar">▼</button>' : ''}
    <button data-remove title="Eliminar">🗑</button>`;

  if (m._edit) {
    return `
    <article class="card edit" data-i="${i}">
      <div class="card-photos" data-photos>
        ${m.photos.map((p, j) => `<div class="thumb"><img src="${p.url}"><button data-del="${j}">✕</button></div>`).join('')}
        <button class="thumb add-thumb" data-addphoto>＋</button>
      </div>
      <div class="card-fields">
        <div class="card-head">
          <span class="idx">${idx}</span>${badge}
          <div class="card-tools">
            <button class="done" data-done title="Listo">✓ Listo</button>${tools}
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

  // Modo lectura (tarjeta): fotos con zoom + Instagram clickeable.
  const ig = m.instagram ? `<a class="v-ig" href="${igHref(m.instagram)}" target="_blank" rel="noopener">${escapeHtml(m.instagram)} ↗</a>` : '<span class="v-ig none">—</span>';
  return `
    <article class="card view" data-i="${i}">
      <div class="card-photos">
        ${m.photos.length
      ? m.photos.map((p, j) => `<button class="thumb zoom" data-zoom="${j}" title="Ampliar"><img src="${p.url}"></button>`).join('')
      : '<div class="thumb noimg">sin foto</div>'}
      </div>
      <div class="card-fields">
        <div class="card-head">
          <span class="idx">${idx}</span>${badge}
          <div class="card-tools">
            <button class="edit-btn" data-edit title="Editar">✎ Editar</button>${tools}
          </div>
        </div>
        <h3 class="v-name">${escapeHtml(m.nombre || '—')}</h3>
        ${ig}
        <div class="v-data">
          <span>TEL <b>${escapeHtml(m.telefono || '—')}</b></span>
          <span>ALTURA <b>${escapeHtml(m.altura || '—')}</b></span>
          <span>EDAD <b>${escapeHtml(m.edad || '—')}</b></span>
        </div>
      </div>
    </article>`;
}

function wireCard(el, m) {
  // Comunes a los dos modos.
  el.querySelector('[data-remove]').addEventListener('click', () => {
    // Soft-delete: va a la papelera (se puede restaurar).
    const ci = models.indexOf(m);
    if (ci >= 0) models.splice(ci, 1);
    m.trashed = true; delete m._edit;
    trash.unshift(m);
    renderList();
    saveOne(m);      // marca trashed=true en local y nube
    persistAll();    // reindexa el orden de los que quedan
  });
  el.querySelector('[data-up]')?.addEventListener('click', () => {
    const i = models.indexOf(m);
    if (i > 0) { [models[i - 1], models[i]] = [models[i], models[i - 1]]; renderList(); persistAll(); }
  });
  el.querySelector('[data-down]')?.addEventListener('click', () => {
    const i = models.indexOf(m);
    if (i >= 0 && i < models.length - 1) { [models[i + 1], models[i]] = [models[i], models[i + 1]]; renderList(); persistAll(); }
  });

  if (!m._edit) {
    // Modo lectura: zoom de fotos + entrar a editar.
    el.querySelectorAll('[data-zoom]').forEach((b) =>
      b.addEventListener('click', () => openLightbox(m.photos, +b.dataset.zoom)));
    el.querySelector('[data-edit]').addEventListener('click', () => { m._edit = true; renderList(); });
    return;
  }

  // Modo edición.
  let t;
  el.querySelectorAll('input[data-key]').forEach((inp) =>
    inp.addEventListener('input', () => {
      m[inp.dataset.key] = inp.value; updateCardBadge(el, m);
      clearTimeout(t); t = setTimeout(() => persist(m), 350); // debounce
    }));
  el.querySelector('[data-done]').addEventListener('click', () => { m._edit = false; renderList(); persist(m); });

  const photosEl = el.querySelector('[data-photos]');
  el.querySelector('[data-addphoto]').addEventListener('click', () => pickPhotos(m));
  photosEl.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', () => { m.photos.splice(+b.dataset.del, 1); renderList(); persist(m); }));
  ['dragover', 'dragenter'].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); el.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => el.addEventListener(ev, () => el.classList.remove('over')));
  el.addEventListener('drop', async (e) => { e.preventDefault(); m.photos.push(...await filesToPhotos(e.dataTransfer.files)); renderList(); persist(m); });
}

/* ── Lightbox (zoom de fotos) ───────────────────── */
function openLightbox(photos, start) {
  const list = photos.filter((p) => p.url);
  if (!list.length) return;
  let idx = Math.max(0, Math.min(start, list.length - 1));
  const ov = document.createElement('div');
  ov.className = 'lightbox';
  ov.innerHTML = `
    <button class="lb-close" title="Cerrar">✕</button>
    <button class="lb-nav lb-prev" title="Anterior">‹</button>
    <img alt="" />
    <button class="lb-nav lb-next" title="Siguiente">›</button>
    <div class="lb-count mono"></div>`;
  const img = ov.querySelector('img');
  const count = ov.querySelector('.lb-count');
  const multi = list.length > 1;
  ov.querySelector('.lb-prev').style.display = multi ? '' : 'none';
  ov.querySelector('.lb-next').style.display = multi ? '' : 'none';
  const show = () => { img.src = list[idx].url; count.textContent = `${idx + 1} / ${list.length}`; };
  const go = (d) => { idx = (idx + d + list.length) % list.length; show(); };
  const key = (e) => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); };
  const close = () => { ov.remove(); document.removeEventListener('keydown', key); };
  ov.querySelector('.lb-close').onclick = close;
  ov.querySelector('.lb-prev').onclick = () => go(-1);
  ov.querySelector('.lb-next').onclick = () => go(1);
  ov.onclick = (e) => { if (e.target === ov) close(); };
  document.addEventListener('keydown', key);
  document.body.appendChild(ov);
  show();
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
  inp.addEventListener('change', async () => { m.photos.push(...await filesToPhotos(inp.files)); renderList(); persist(m); });
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
// Los exports respetan la vista: filtrás/ordenás y bajás lo que ves.
async function withBusy(btn, fn) {
  const v = currentView();
  if (!v.length) { alert('No hay modelos para exportar con el filtro actual.'); return; }
  const txt = btn.textContent; btn.textContent = 'Generando…'; btn.disabled = true;
  try { await fn(v); } catch (e) { console.error(e); alert('Error al exportar: ' + e.message); }
  btn.textContent = txt; btn.disabled = false;
}
app.querySelector('[data-psd]').addEventListener('click', (e) =>
  withBusy(e.target, async (v) => download(await exportPSD(v), `casting-${stamp()}.psd`)));
app.querySelector('[data-png]').addEventListener('click', (e) =>
  withBusy(e.target, async (v) => download(await exportPNG(v), `casting-${stamp()}.png`)));
app.querySelector('[data-pdf]').addEventListener('click', (e) =>
  withBusy(e.target, async (v) => download(await exportPDF(v), `casting-${stamp()}.pdf`)));
app.querySelector('[data-csv]').addEventListener('click', (e) =>
  withBusy(e.target, async (v) => download(exportCSV(v), `casting-${stamp()}.csv`)));
/* ── Papelera ───────────────────────────────────── */
function restoreOne(m) {
  const i = trash.indexOf(m);
  if (i < 0) return;
  trash.splice(i, 1);
  m.trashed = false;
  models.push(m);
  renderList();
  saveOne(m);
  persistAll();
  renderTrash();
}
async function purgeOne(m) {
  const i = trash.indexOf(m);
  if (i < 0) return;
  trash.splice(i, 1);
  await deleteModel(m.id);
  if (cloud) await cloud.deleteModelCloud(m.id, m.photos.map((p) => p.path).filter(Boolean)).catch((e) => console.warn(e));
  renderList();
  renderTrash();
}

let trashOv = null;
function renderTrash() {
  if (!trashOv) return;
  const body = trashOv.querySelector('[data-trashbody]');
  if (!trash.length) { body.innerHTML = '<p class="trash-empty">La papelera está vacía.</p>'; return; }
  body.innerHTML = trash.map((m, i) => `
    <div class="trash-row" data-ti="${i}">
      <div class="trash-thumb">${m.photos[0]?.url ? `<img src="${m.photos[0].url}">` : '—'}</div>
      <div class="trash-info">
        <b>${escapeHtml(m.nombre || m.instagram || 'sin nombre')}</b>
        <span>${escapeHtml([m.instagram, m.telefono].filter(Boolean).join(' · ') || '—')}</span>
      </div>
      <button class="btn ghost" data-restore="${i}">Restaurar</button>
      <button class="btn danger" data-purge="${i}">Eliminar</button>
    </div>`).join('');
  body.querySelectorAll('[data-restore]').forEach((b) => b.addEventListener('click', () => restoreOne(trash[+b.dataset.restore])));
  body.querySelectorAll('[data-purge]').forEach((b) => b.addEventListener('click', () => {
    const m = trash[+b.dataset.purge];
    if (confirm(`Eliminar definitivamente a "${m.nombre || m.instagram || 'esta ficha'}"? No se puede deshacer.`)) purgeOne(m);
  }));
}
app.querySelector('[data-trash]').addEventListener('click', () => {
  trashOv = document.createElement('div');
  trashOv.className = 'trash-ov';
  trashOv.innerHTML = `
    <div class="trash-panel">
      <div class="trash-head">
        <b>Papelera</b>
        <div class="trash-headtools">
          <button class="btn danger" data-emptyall>Vaciar papelera</button>
          <button class="btn ghost" data-close>Cerrar</button>
        </div>
      </div>
      <div class="trash-body" data-trashbody></div>
    </div>`;
  document.body.appendChild(trashOv);
  renderTrash();
  const close = () => { trashOv.remove(); trashOv = null; };
  trashOv.querySelector('[data-close]').addEventListener('click', close);
  trashOv.addEventListener('click', (e) => { if (e.target === trashOv) close(); });
  trashOv.querySelector('[data-emptyall]').addEventListener('click', async () => {
    if (!trash.length) return;
    if (!confirm(`Vaciar la papelera (${trash.length})? Se eliminan definitivamente.`)) return;
    const snap = trash.slice();
    for (const m of snap) await purgeOne(m);
  });
});

/* ── Login (solo si la nube está configurada) ───── */
function showLogin(onOk) {
  const ov = document.createElement('div');
  ov.className = 'login';
  ov.innerHTML = `
    <form class="login-box">
      <div class="login-brand"><span class="mark"></span> CASTING</div>
      <p>Ingresá para ver y cargar el casting.</p>
      <input type="email" placeholder="Email" autocomplete="username" required data-email />
      <input type="password" placeholder="Contraseña" autocomplete="current-password" required data-pass />
      <button class="btn solid" type="submit">Entrar</button>
      <span class="login-err" data-err></span>
    </form>`;
  document.body.appendChild(ov);
  const form = ov.querySelector('form');
  const err = ov.querySelector('[data-err]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      await cloud.signIn(ov.querySelector('[data-email]').value.trim(), ov.querySelector('[data-pass]').value);
      ov.remove();
      onOk();
    } catch (ex) {
      err.textContent = /Invalid/i.test(ex.message) ? 'Email o contraseña incorrectos.' : ex.message;
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
}

async function boot() {
  await restore();
  renderList();
  renderDraftThumbs();
  const s = document.querySelector('[data-saved]');
  if (s && cloud) { s.textContent = 'nube conectada'; s.classList.add('on'); setTimeout(() => s.classList.remove('on'), 1800); }
  showNote();
}

function showNote() {
  document.querySelector('.load-note')?.remove();
  if (!loadNote) return;
  const b = document.createElement('div');
  b.className = 'load-note';
  b.innerHTML = `<span>⚠️ ${loadNote}</span><button data-retry>Reintentar</button>`;
  app.insertBefore(b, app.querySelector('.filters'));
  b.querySelector('[data-retry]').addEventListener('click', () => boot());
}

/* ── Init ───────────────────────────────────────── */
(async () => {
  if (cloudEnabled()) {
    cloud = await import('./cloud.js');
    const user = await cloud.currentUser().catch(() => null);
    // Botón de salir en la nav.
    const out = document.createElement('button');
    out.className = 'btn ghost'; out.textContent = 'Salir';
    out.addEventListener('click', async () => { await cloud.signOut(); location.reload(); });
    app.querySelector('.actions').appendChild(out);
    if (user) boot();
    else showLogin(boot);
  } else {
    boot();
  }
})();
