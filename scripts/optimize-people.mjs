/**
 * Pipeline offline de los GLB de gente (node scripts/optimize-people.mjs):
 *   1. Separa la malla única en figuras por componentes conectados.
 *   2. Cada figura queda como primitive propio (el simplificador no
 *      cruza primitives → las figuras nunca se sueldan entre sí).
 *   3. Simplifica la malla (meshoptimizer) y comprime texturas a WebP.
 *
 * Entrada:  public/models/{invitados,team}.glb   (crudos de Tripo)
 * Salida:   public/models/{invitados,team}_opt.glb
 */
import { NodeIO } from '@gltf-transform/core';
import { simplify, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const FILES = [
  { src: 'public/models/invitados.glb', out: 'public/models/invitados_opt.glb', ratio: 0.3 },
  { src: 'public/models/team.glb', out: 'public/models/team_opt.glb', ratio: 0.4 },
];

const io = new NodeIO();

function splitPrimitive(doc, mesh) {
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

  // Una figura = un primitive nuevo, ordenadas por su lugar en la fila (z).
  const figures = [];
  for (const tris of buckets.values()) {
    if (tris.length < 300) continue;
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
          zMin = Math.min(zMin, pos[vi * 3 + 2]);
          zMax = Math.max(zMax, pos[vi * 3 + 2]);
        }
        I.push(nv);
      }
    }
    figures.push({ P, N, U, I, z: (zMin + zMax) / 2 });
  }
  figures.sort((a, b) => a.z - b.z);

  const buffer = doc.getRoot().listBuffers()[0];
  const material = prim.getMaterial();
  for (const f of figures) {
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
  return figures.length;
}

for (const { src, out, ratio } of FILES) {
  const doc = await io.read(src);
  const mesh = doc.getRoot().listMeshes()[0];
  const n = splitPrimitive(doc, mesh);
  await doc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.005 }),
    prune(),
    textureCompress({ targetFormat: 'webp', encoder: sharp })
  );
  await io.write(out, doc);
  const { statSync } = await import('node:fs');
  console.log(`${src} → ${out}: ${n} figuras, ${(statSync(out).size / 1e6).toFixed(2)} MB`);
}
