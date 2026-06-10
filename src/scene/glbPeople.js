import * as THREE from 'three';

/**
 * GLB DE PERSONAS — los modelos reales del estudio.
 * Los archivos ya vienen pre-procesados por scripts/optimize-people.mjs:
 * una figura por primitive (separadas offline), malla simplificada y
 * texturas WebP. Acá solo se re-centran (xz al origen, pies en y=0) y
 * se ordenan según la fila original (eje z) = el orden de la referencia.
 */
let _decoder = null;
async function makeLoader() {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  // Geometría comprimida con meshopt: hay que enchufar el decoder.
  if (!_decoder) {
    ({ MeshoptDecoder: _decoder } = await import('three/addons/libs/meshopt_decoder.module.js'));
  }
  loader.setMeshoptDecoder(_decoder);
  return loader;
}

export async function loadPeopleGLB(url, onProgress) {
  const loader = await makeLoader();
  const gltf = await new Promise((resolve, reject) => {
    loader.load(
      url,
      resolve,
      (e) => { if (e.total) onProgress?.(e.loaded / e.total); },
      reject
    );
  });

  const meshes = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });

  const figures = meshes.map((m) => {
    // KHR_mesh_quantization deja position/normal como enteros (int16).
    // applyMatrix4 escribiría metros sobre ese array entero y truncaría
    // la malla: hay que pasar a float ANTES de transformar.
    const g = dequantize(m.geometry.clone()).applyMatrix4(m.matrixWorld);
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const lineupZ = (bb.min.z + bb.max.z) / 2;
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -lineupZ);
    return { geometry: g, height: bb.max.y - bb.min.y, lineupZ };
  });
  figures.sort((a, b) => a.lineupZ - b.lineupZ);

  return { figures, material: meshes[0].material };
}

/** Convierte position/normal cuantizados (int) a Float32 (los getters
 *  ya devuelven el valor desnormalizado), para poder aplicar matrices. */
function dequantize(geo) {
  for (const name of ['position', 'normal']) {
    const a = geo.getAttribute(name);
    if (!a || a.array instanceof Float32Array) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) {
      out[i * a.itemSize] = a.getX(i);
      out[i * a.itemSize + 1] = a.getY(i);
      if (a.itemSize > 2) out[i * a.itemSize + 2] = a.getZ(i);
    }
    geo.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize, false));
  }
  return geo;
}
