import * as THREE from 'three';
import { buildSkybox }                                          from './skybox.js';
import { buildCoursePool, tickCoursePool, tickPoolTime,
         flyToCourse, getPoolData, tickHighlight }              from './coursePool.js';
import { buildDecorations }                                     from './decorations.js';
import { buildShooters, tickShooters }                         from './shooters.js';
import { setupControls, tickControls, tickRaycast,
         getHoveredIdx }                                        from './controls.js';
import { openPanel, closePanel }                               from './panel.js';
import { setupSearch }                                         from './search.js';

let renderer, scene, camera, clock;
let courses    = [];
let skyboxMesh = null;

async function init() {
  setMsg('Loading course data…');
  courses = await fetch('/courses.json').then(r => r.json());
  setBar(20);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.5, 300000);
  camera.position.set(0, 200, 1500);
  clock  = new THREE.Clock();

  setMsg(`Loading ${courses.length.toLocaleString()} courses into the galaxy…`);
  setBar(38);

  skyboxMesh = buildSkybox(scene);             setBar(52);
  buildCoursePool(scene, camera, courses);     setBar(70);
  buildDecorations(scene);                     setBar(82);
  buildShooters(scene);                        setBar(90);

  setupControls(
    renderer,
    () => {
      const idx = getHoveredIdx();
      if (idx >= 0) openPanel(courses[getPoolData().pool[idx]]);
    },
    closePanel,
  );
  setupSearch(courses, idx => flyToCourse(idx, camera), openPanel);
  document.getElementById('panel-close').addEventListener('click', closePanel);
  window.addEventListener('resize', onResize);

  setBar(100);
  setMsg('Launching…');
  setTimeout(() => {
    document.getElementById('loading').classList.add('out');
    setTimeout(() => document.getElementById('loading').remove(), 1200);
  }, 2600);

  animate();
}

function setBar(p) { document.getElementById('bar').style.width = p + '%'; }
function setMsg(m) { document.getElementById('loading-msg').textContent = m; }

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  tickPoolTime(clock.elapsedTime);
  if (skyboxMesh) skyboxMesh.position.copy(camera.position);

  tickControls(camera, dt);
  const { pool, poolPositions } = getPoolData();
  tickRaycast(camera, poolPositions, pool.length);
  tickShooters(camera, dt);
  tickCoursePool(camera);

  const hi = getHoveredIdx();
  tickHighlight(hi);
  document.getElementById('star-label')?.classList.toggle('visible', hi >= 0);

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

init().catch(console.error);
