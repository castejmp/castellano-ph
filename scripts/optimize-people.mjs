/**
 * Pipeline offline de los GLB de gente (node scripts/optimize-people.mjs):
 *   1. Separa la malla única en componentes conectados.
 *   2. Agrupa según `clusters` (índices de componentes ordenados por z):
 *      los grupos quedan ARMADOS (ej. los dos editores con su mesa, la
 *      dupla de fotógrafos posada junta). Cada grupo = un primitive —
 *      el simplificador no cruza primitives, así nada se suelda entre sí.
 *   3. Simplifica la malla (meshoptimizer) y comprime texturas a WebP.
 *
 * Entrada:  scripts/raw/*.glb  (crudos de Tripo — NO van al repo)
 * Salida:   public/models/*.glb
 */
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, prune, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const FILES = [
  // 10 invitados bailando (ya procesado; se re-procesa si está el crudo).
  { src: 'scripts/raw/invitados.glb', out: 'public/models/invitados.glb', ratio: 0.3, clusters: null },
  // Mesa redonda + living en un mismo archivo → DOS grupos separados:
  // [1,4,5] = mesa con sillas · [0,2,3,6] = living (sillones+sofá+ratona).
  { src: 'scripts/raw/mesas.glb', out: 'public/models/mesas.glb', ratio: 0.14, clusters: [[1, 4, 5], [0, 2, 3, 6]] },
];

// Figuras individuales (una persona por archivo): scripts/raw/people/*.glb
// → public/models/people/*.glb. Crudas pesan ~29 MB; bajan a ~2 MB.
const PEOPLE_DIR = 'scripts/raw/people';
const PEOPLE_OUT = 'public/models/people';
const PEOPLE_RATIO = 0.14;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

function splitPrimitive(doc, mesh, clusters) {
  const prim = mesh.listPrimitives()[0];
  const pos = prim.getAttribute('POSITION').getArray();
  const nrm = prim.getAttribute('NORMAL').getArray();
  const uv = prim.getAttribute('TEXCOORD_0').getArray();
  const idx = prim.getIndices().getArray();
  const nVerts = pos.length / 3;

  // Soldadura por posición cuantizada (los cortes de UV duplican verts).
  const weld = new Int32Array(nVerts);
  const keyMap = new Map();
  let wc = 0;
  for (let i = 0; i < nVerts; i++) {
    const k = `${Math.round(pos[i * 3] * 2000)},${Math.round(pos[i * 3 + 1] * 2000)},${Math.round(pos[i * 3 + 2] * 2000)}`;
    let w = keyMap.get(k);
    if (w === undefined) { w = wc++; keyMap.set(k, w); }
    weld[i] = w;
  }
  const parent = new Int32Array(wc);
  for (let i = 0; i < wc; i++) parent[i] = i;
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(weld[idx[t]]), b = find(weld[idx[t + 1]]), c = find(weld[idx[t + 2]]);
    if (a !== b) parent[a] = b;
    if (find(b) !== c) parent[find(b)] = find(c);
  }
  const buckets = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    const r = find(weld[idx[t]]);
    (buckets.get(r) ?? buckets.set(r, []).get(r)).push(t);
  }

  // Componentes grandes ordenados por z (el orden de la fila original).
  const comps = [];
  for (const tris of buckets.values()) {
    if (tris.length < 300) continue;
    let zMin = Infinity, zMax = -Infinity;
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const z = pos[idx[t + k] * 3 + 2];
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
      }
    }
    comps.push({ tris, z: (zMin + zMax) / 2 });
  }
  comps.sort((a, b) => a.z - b.z);

  // Agrupar (cada grupo conserva su composición interna).
  const groups = (clusters ?? comps.map((_, i) => [i]))
    .map((idxs) => idxs.flatMap((i) => comps[i]?.tris ?? []))
    .filter((tris) => tris.length > 0);

  const buffer = doc.getRoot().listBuffers()[0];
  const material = prim.getMaterial();
  const built = [];
  for (const tris of groups) {
    const remap = new Map();
    const P = [], N = [], U = [], I = [];
    let zMin = Infinity, zMax = -Infinity;
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const vi = idx[t + k];
        let nv = remap.get(vi);
        if (nv === undefined) {
          nv = remap.size;
          remap.set(vi, nv);
          P.push(pos[vi * 3], pos[vi * 3 + 1], pos[vi * 3 + 2]);
          N.push(nrm[vi * 3], nrm[vi * 3 + 1], nrm[vi * 3 + 2]);
          U.push(uv[vi * 2], uv[vi * 2 + 1]);
          const z = pos[vi * 3 + 2];
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
        }
        I.push(nv);
      }
    }
    built.push({ P, N, U, I, z: (zMin + zMax) / 2 });
  }
  built.sort((a, b) => a.z - b.z);

  for (const f of built) {
    const p = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(f.P)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(f.N)).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(f.U)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(f.I)).setBuffer(buffer))
      .setMaterial(material);
    mesh.addPrimitive(p);
  }
  mesh.removePrimitive(prim);
  prim.dispose();
  return built.length;
}

for (const { src, out, ratio, clusters } of FILES) {
  if (!existsSync(src)) {
    console.log(`(salteado: no está ${src})`);
    continue;
  }
  const doc = await io.read(src);
  const mesh = doc.getRoot().listMeshes()[0];
  const n = splitPrimitive(doc, mesh, clusters);
  await doc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.005 }),
    prune(),
    textureCompress({ targetFormat: 'webp', encoder: sharp, resize: [1024, 1024] }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' })
  );
  await io.write(out, doc);
  const { statSync } = await import('node:fs');
  console.log(`${src} → ${out}: ${n} figuras/grupos, ${(statSync(out).size / 1e6).toFixed(2)} MB`);
}

/* ── Figuras individuales: una persona por archivo ── */
if (existsSync(PEOPLE_DIR)) {
  mkdirSync(PEOPLE_OUT, { recursive: true });
  const { statSync } = await import('node:fs');
  for (const file of readdirSync(PEOPLE_DIR).filter((f) => f.endsWith('.glb'))) {
    const doc = await io.read(`${PEOPLE_DIR}/${file}`);
    await doc.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: PEOPLE_RATIO, error: 0.004 }),
      prune(),
      textureCompress({ targetFormat: 'webp', encoder: sharp, resize: [1024, 1024] }),
      // Compresión de geometría (EXT_meshopt_compression): el loader la
      // decodifica con MeshoptDecoder. Achica la malla 4-6×.
      meshopt({ encoder: MeshoptEncoder, level: 'high' })
    );
    const out = `${PEOPLE_OUT}/${file}`;
    await io.write(out, doc);
    console.log(`${file} → ${out}: ${(statSync(out).size / 1e6).toFixed(2)} MB`);
  }
}
