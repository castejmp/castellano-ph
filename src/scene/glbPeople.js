import * as THREE from 'three';

/**
 * GLB DE PERSONAS — los modelos reales del estudio (Tripo).
 * Cada archivo trae UNA malla con varias figuras fusionadas. Acá se
 * separan por componentes conectados (soldando vértices por posición),
 * se re-centran (xz al origen, pies en y=0) y quedan listas para
 * instanciar. Devuelve las figuras ordenadas según su posición en la
 * fila original (eje z), que respeta el orden de la referencia.
 */

export async function loadPeopleGLB(url, onProgress) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gltf = await new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      resolve,
      (e) => { if (e.total) onProgress?.(e.loaded / e.total); },
      reject
    );
  });

  let src = null;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
  const geo = src.geometry.clone().applyMatrix4(src.matrixWorld);

  return { figures: splitByComponents(geo), material: src.material };
}

function splitByComponents(geo) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const idx = geo.index.array;
  const n = pos.count;

  // Soldadura por posición cuantizada: los cortes de UV duplican
  // vértices y romperían las componentes.
  const weld = new Int32Array(n);
  const keyMap = new Map();
  let weldCount = 0;
  for (let i = 0; i < n; i++) {
    const k = `${Math.round(pos.getX(i) * 2000)},${Math.round(pos.getY(i) * 2000)},${Math.round(pos.getZ(i) * 2000)}`;
    let w = keyMap.get(k);
    if (w === undefined) { w = weldCount++; keyMap.set(k, w); }
    weld[i] = w;
  }

  // Union-find con aplastado de camino.
  const parent = new Int32Array(weldCount);
  for (let i = 0; i < weldCount; i++) parent[i] = i;
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(weld[idx[t]]), b = find(weld[idx[t + 1]]), c = find(weld[idx[t + 2]]);
    if (a !== b) parent[a] = b;
    if (find(b) !== find(c)) parent[find(b)] = find(c);
  }

  // Triángulos por componente.
  const buckets = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    const root = find(weld[idx[t]]);
    let b = buckets.get(root);
    if (!b) { b = []; buckets.set(root, b); }
    b.push(t);
  }

  // Construir geometrías por componente grande (ignora migas sueltas).
  const figures = [];
  for (const tris of buckets.values()) {
    if (tris.length < 300) continue;
    const remap = new Map();
    const positions = [], normals = [], uvs = [], indices = [];
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const vi = idx[t + k];
        let nv = remap.get(vi);
        if (nv === undefined) {
          nv = remap.size;
          remap.set(vi, nv);
          positions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
          normals.push(nrm.getX(vi), nrm.getY(vi), nrm.getZ(vi));
          uvs.push(uv.getX(vi), uv.getY(vi));
        }
        indices.push(nv);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);

    // Re-centrar: xz al origen, pies en y=0.
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const cx = (bb.min.x + bb.max.x) / 2;
    const cz = (bb.min.z + bb.max.z) / 2;
    g.translate(-cx, -bb.min.y, -cz);
    figures.push({ geometry: g, height: bb.max.y - bb.min.y, verts: remap.size, lineupZ: cz });
  }

  // Orden de la fila original (el orden de la referencia).
  figures.sort((a, b) => a.lineupZ - b.lineupZ);
  return figures;
}
