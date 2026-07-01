import './styles.css';
import { parseCasting } from './parse.js';
import { exportPSD, exportPNG, exportCSV, exportPDF } from './psd.js';
import { saveModel, deleteModel, clearAll, loadAll } from './idb.js';
import { cloudEnabled } from './cloud-config.js';

/* ── Estado ─────────────────────────────────────── */
let models = [];
let draft = { photos: [] };
let cloud = null; // módulo de nube (lazy) cuando hay sesión

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

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
async function persistAll() {
  try {
    await Promise.all(models.map((m, i) => { m.ord = i; return saveModel(m); }));
    if (cloud) await Promise.all(models.map((m) => cloud.pushModel(m)));
    markSaved();
  } catch (e) { console.warn('No se pudo guardar:', e); markSaved(false); }
}
async function restore() {
  // Con sesión en la nube: la nube manda. Sin ella: base local (IndexedDB).
  if (cloud) {
    try {
      const rows = await cloud.listModels();
      if (rows.length) {
        models = await Promise.all(rows.map(async (r) => ({
          id: r.id, ord: r.ord, instagram: r.instagram, nombre: r.nombre,
          telefono: r.telefono, altura: r.altura, edad: r.edad,
          photos: await Promise.all((r.fotos || []).map(cloudPhoto)),
        })));
        for (const m of models) await saveModel(m); // cache local
        return;
      }
    } catch (e) { console.warn('Nube no disponible, uso local:', e); }
  }
  try {
    const recs = await loadAll();
    models = await Promise.all(recs.map(async (r) => ({
      ...r, photos: await Promise.all((r.photos || []).map(rehydrate)),
    })));
    // Si la nube está vacía y hay datos locales, migrarlos hacia arriba.
    if (cloud && models.length) { for (const m of models) await cloud.pushModel(m).catch(() => {}); }
  } catch { models = []; }
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
      <button class="btn danger" data-clear title="Vaciar la base">Vaciar</button>
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
    models.push({ id: uid(), photos, ...parsed });
  });
  draft = { photos: [] };
  textEl.value = '';
  renderDraftThumbs();
  renderList();
  persistAll();
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
  let t;
  el.querySelectorAll('input[data-key]').forEach((inp) =>
    inp.addEventListener('input', () => {
      m[inp.dataset.key] = inp.value; updateCardBadge(el, m);
      clearTimeout(t); t = setTimeout(() => persist(m), 350); // debounce
    }));
  el.querySelector('[data-remove]').addEventListener('click', () => {
    const id = m.id, paths = m.photos.map((p) => p.path).filter(Boolean);
    models.splice(i, 1); renderList();
    deleteModel(id);
    if (cloud) cloud.deleteModelCloud(id, paths).catch((e) => console.warn(e));
    persistAll();
  });
  el.querySelector('[data-up]').addEventListener('click', () => { if (i > 0) { [models[i - 1], models[i]] = [models[i], models[i - 1]]; renderList(); persistAll(); } });
  el.querySelector('[data-down]').addEventListener('click', () => { if (i < models.length - 1) { [models[i + 1], models[i]] = [models[i], models[i + 1]]; renderList(); persistAll(); } });

  const photosEl = el.querySelector('[data-photos]');
  el.querySelector('[data-addphoto]').addEventListener('click', () => pickPhotos(m));
  photosEl.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', () => { m.photos.splice(+b.dataset.del, 1); renderList(); persist(m); }));
  ['dragover', 'dragenter'].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); el.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => el.addEventListener(ev, () => el.classList.remove('over')));
  el.addEventListener('drop', async (e) => { e.preventDefault(); m.photos.push(...await filesToPhotos(e.dataTransfer.files)); renderList(); persist(m); });
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
app.querySelector('[data-pdf]').addEventListener('click', (e) =>
  withBusy(e.target, async () => download(await exportPDF(models), `casting-${stamp()}.pdf`)));
app.querySelector('[data-csv]').addEventListener('click', (e) =>
  withBusy(e.target, async () => download(exportCSV(models), `casting-${stamp()}.csv`)));
app.querySelector('[data-clear]').addEventListener('click', async () => {
  if (!models.length) return;
  if (!confirm('¿Vaciar toda la base de casting? Esto borra las fichas y fotos guardadas' + (cloud ? ' (también en la nube)' : '') + '.')) return;
  const snapshot = models.slice();
  models = [];
  await clearAll();
  if (cloud) await Promise.all(snapshot.map((m) => cloud.deleteModelCloud(m.id, m.photos.map((p) => p.path).filter(Boolean)).catch(() => {})));
  renderList();
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
