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
buildWorld(scene);
const crowd = new Crowd(scene);
const led = new LedWall(scene);
const extras = new Extras(scene);
const rig = new LightRig(scene);
const themes = new ThemeEngine({ scene, renderer, rig, led, extras });
const audio = new AudioEngine();
const cameraRig = new CameraRig(camera);
const scroll = new ScrollEngine(CONFIG.stations.length, reduced);
const debug = new DebugHud();

/* ── Postproceso: solo desktop, con kill-switch ── */
let post = null;
if (!isMobile) {
  import('./post/post.js').then(({ Post }) => {
    post = new Post(renderer, scene, camera);
    post.setSize(innerWidth, innerHeight);
  });
}

/* ── UI + gate ──────────────────────────────────── */
let started = false;
let modeIdx = 0;

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
});

// Preloader: el mundo es procedural, así que es un beat estético corto.
let pre = 0;
const preTimer = setInterval(() => {
  pre = Math.min(1, pre + 0.18);
  ui.gateProgress(pre);
  if (pre >= 1) clearInterval(preTimer);
}, 80);

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
        renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.0 : 1.25));
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
  cameraRig.update(scroll.progress, dt, extras.dronePos, reduced);
  ui.setStation(f);

  if (post) post.render(cameraRig.focusDistance, camera.fov);
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
