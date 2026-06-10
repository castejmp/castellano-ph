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
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const lineupZ = (bb.min.z + bb.max.z) / 2;
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -lineupZ);
    return { geometry: g, height: bb.max.y - bb.min.y, lineupZ };
  });
  figures.sort((a, b) => a.lineupZ - b.lineupZ);

  return { figures, material: meshes[0].material };
}
