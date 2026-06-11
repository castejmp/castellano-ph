import * as THREE from 'three';
import './styles.css';
import { CONFIG } from './config.js';
import { buildWorld } from './scene/world.js';
import { Crowd } from './scene/crowd.js';
import { LedWall } from './scene/led.js';
import { Extras } from './scene/extras.js';
import { LightRig } from './scene/lights.js';
import { CameraRig } from './camera/path.js';
import { ScrollEngine } from './camera/scroll.js';
import { ThemeEngine } from './themes/themes.js';
import { AudioEngine } from './audio/audio.js';
import { UI } from './ui/ui.js';
import { DebugHud } from './ui/debug.js';
import { FXManager } from './fx/fx.js';

/* ── Contexto ───────────────────────────────────── */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820;

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  powerPreference: 'high-performance',
});
const DPR_CAP = isMobile ? 1.5 : 2;
renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_CAP));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('gl').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CONFIG.shots[0].fov, innerWidth / innerHeight, 0.1, 240);

/* ── Mundo ──────────────────────────────────────── */
const world = buildWorld(scene);
const crowd = new Crowd(scene, isMobile);
const led = new LedWall(scene);
const extras = new Extras(scene);
const rig = new LightRig(scene);
const themes = new ThemeEngine({
  scene, renderer, rig, led, extras,
  worldMats: [world.statics.material, world.dance.material],
});
const audio = new AudioEngine();
const cameraRig = new CameraRig(camera, isMobile);
const scroll = new ScrollEngine(CONFIG.stations.length, reduced);
const debug = new DebugHud();

/* ── FX: estética retro (variantes con teclas 1-4) ── */
const fx = new FXManager({ renderer, scene, isMobile });
fx.led = led; // la LED apaga su grilla en retro (anti-moiré)

/* ── Postproceso: solo desktop, con kill-switch ── */
let post = null;
if (!isMobile) {
  import('./post/post.js').then(({ Post }) => {
    post = new Post(renderer, scene, camera);
    post.setSize(innerWidth, innerHeight);
    fx.post = post;
    fx.refresh();
  });
}

/* ── UI + gate ──────────────────────────────────── */
let started = false;
let modeIdx = 0;
let muted = false;

function applyMode(name) {
  modeIdx = CONFIG.modeOrder.indexOf(name);
  themes.setMode(name);
  audio.setMode(name);
  ui.setModeLabel(name);
}

const ui = new UI({
  onModeChosen(name) {
    audio.init(); // dentro del gesto: iOS desbloquea el AudioContext
    applyMode(name);
    started = true;
  },
  onModeCycle() {
    if (!started) return;
    applyMode(CONFIG.modeOrder[(modeIdx + 1) % CONFIG.modeOrder.length]);
  },
  onDot(i) {
    scroll.goTo(i);
  },
  onToggleMute() {
    muted = !muted;
    audio.setMuted(muted);
    return muted;
  },
});
// Estética retro por defecto (variantes con teclas 1-4).
fx.apply(fx.style);

// Preloader: carga REAL de los modelos de la gente (GLB). Si la red
// falla o tarda demasiado, el público procedural queda como fallback
// y el gate abre igual: la experiencia nunca se cuelga.
ui.gateProgress(0.06);
const glbTimeout = setTimeout(() => ui.gateProgress(1), 25_000);
crowd
  .upgradeFromGLB(import.meta.env.BASE_URL, (p) => ui.gateProgress(0.06 + p * 0.9), {
    dj: world.djMesh,
    tables: world.tablesMesh,
  })
  .catch((e) => console.warn('GLB no disponible, queda el público procedural:', e))
  .finally(() => {
    clearTimeout(glbTimeout);
    ui.gateProgress(1);
    fx.refresh(); // re-aplica el estilo a los meshes GLB recién llegados
  });

/* ── Calidad adaptativa (kill-switch) ───────────── */
let tier = 1;
let frames = 0;
let fpsNow = 60;
let lowStreak = 0;
setInterval(() => {
  fpsNow = frames;
  frames = 0;
  if (!started) return;
  if (fpsNow < 30) {
    if (++lowStreak >= 3) {
      lowStreak = 0;
      if (tier === 1) {
        tier = 2;
        // En retro la resolución ya es bajísima: no pisar el pixelRatio.
        if (fx.style !== 'retro') renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.0 : 1.25));
        post?.setBokeh(false);
      } else if (tier === 2) {
        tier = 3;
        post = null; // render directo
        extras.particles.visible = false;
      }
    }
  } else {
    lowStreak = 0;
  }
}, 1000);

/* ── Eventos de estación (el flash de FOTOGRAFÍA) ── */
let lastArrived = -1;
function onStationFloat(f) {
  const r = Math.round(f);
  if (Math.abs(f - r) < 0.16) {
    if (r !== lastArrived) {
      lastArrived = r;
      if (r === 2) {
        extras.fireFlash();
        ui.flash();
      }
    }
  }
}

/* ── Loop ───────────────────────────────────────── */
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  frames++;

  if (!started) {
    renderer.render(scene, camera);
    return;
  }

  const t = clock.elapsedTime;
  scroll.update();
  const f = scroll.stationFloat;
  onStationFloat(f);

  const bands = audio.update();
  themes.update(dt);
  rig.update(bands);
  crowd.update(t, bands.bass, themes.crowdEnergy);
  const immersiveW = Math.max(0, 1 - Math.abs(f - 7) * 1.4);
  led.update(t, bands, immersiveW, f, dt);
  extras.update(t, dt, bands, immersiveW, f);
  cameraRig.update(scroll.progress, dt, extras.dronePos, reduced, t);
  ui.setStation(f);

  // DoF de "jugador seleccionado": en las estaciones de operador el
  // fondo se desenfoca a la par del spotlight.
  const stR = Math.round(f);
  const dofBoost = stR >= 1 && stR <= 6 ? Math.max(0, 1 - Math.abs(f - stR) * 2.2) : 0;
  if (post) post.render(cameraRig.focusDistance, camera.fov, dofBoost, t);
  else renderer.render(scene, camera);

  debug.update({
    fps: fpsNow,
    calls: renderer.info.render.calls,
    tris: renderer.info.render.triangles,
    tier,
    dpr: renderer.getPixelRatio(),
  });
}
frame();

/* ── Resize ─────────────────────────────────────── */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  post?.setSize(innerWidth, innerHeight);
});
