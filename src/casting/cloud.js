/**
 * NUBE (Supabase) — auth con email/contraseña, CRUD de fichas y
 * subida/descarga de fotos al Storage privado. Todo pasa por RLS:
 * sin sesión iniciada, la clave anon no puede leer ni escribir.
 */
import { createClient } from '@supabase/supabase-js';
import { CLOUD } from './cloud-config.js';

let sb = null;
function client() {
  if (!sb) sb = createClient(CLOUD.url, CLOUD.anon, { auth: { persistSession: true, autoRefreshToken: true } });
  return sb;
}

/* ── Auth ───────────────────────────────────────── */
export async function currentUser() {
  const { data } = await client().auth.getSession();
  return data.session?.user ?? null;
}
export async function signIn(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}
export async function signOut() { await client().auth.signOut(); }

/* ── Fotos ──────────────────────────────────────── */
const safe = (s) => (s || 'foto').replace(/[^\w.-]+/g, '_').slice(-40);

/** Sube las fotos que aún no tienen `path`. Muta cada photo con su path. */
export async function uploadPhotos(model) {
  const b = client().storage.from(CLOUD.bucket);
  for (const p of model.photos) {
    if (p.path || !p.file) continue;
    const path = `${model.id}/${crypto.randomUUID()}-${safe(p.name)}`;
    const { error } = await b.upload(path, p.file, { upsert: true, contentType: p.file.type || 'image/jpeg' });
    if (error) throw error;
    p.path = path;
  }
}
async function signedUrl(path) {
  const { data, error } = await client().storage.from(CLOUD.bucket).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
export async function fetchPhoto(path) {
  const url = await signedUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error('foto ' + res.status);
  return res.blob();
}
async function removePhotos(paths) {
  if (paths.length) await client().storage.from(CLOUD.bucket).remove(paths);
}

/* ── Fichas (tabla models) ──────────────────────── */
export async function pushModel(model) {
  await uploadPhotos(model);
  const row = {
    id: model.id, ord: model.ord ?? 0,
    instagram: model.instagram || '', nombre: model.nombre || '', telefono: model.telefono || '',
    altura: model.altura || '', edad: model.edad || '',
    fotos: model.photos.filter((p) => p.path).map((p) => ({ path: p.path, name: p.name })),
    updated_at: new Date().toISOString(),
  };
  const { error } = await client().from('models').upsert(row);
  if (error) throw error;
}
export async function deleteModelCloud(id, paths = []) {
  await removePhotos(paths);
  const { error } = await client().from('models').delete().eq('id', id);
  if (error) throw error;
}
export async function listModels() {
  const { data, error } = await client().from('models').select('*').order('ord', { ascending: true });
  if (error) throw error;
  return data || [];
}
