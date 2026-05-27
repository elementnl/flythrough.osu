import * as THREE from 'three';
import { POOL_SIZE, POOL_RADIUS, POOL_RECYCLE, GROUP_COLOR } from './config.js';
import { STAR_VERT, STAR_FRAG, HIGHLIGHT_VERT, HIGHLIGHT_FRAG } from './shaders.js';
import { randSphere } from './utils.js';
import { rig } from './rig.js';

let pool          = [];
let poolPositions = null;
let poolColors    = null;
let poolSizes     = null;
let poolGeo       = null;
let poolMat       = null;
let poolPoints    = null;
let poolCursor    = 0;
let courses       = [];

let highlightGeo = null;
let highlightMat = null;
let highlightPos = null;
let highlightMesh = null;

let lastFlyTarget = -1;

function markPoolDirty() {
  poolGeo.attributes.position.needsUpdate = true;
  poolGeo.attributes.aColor.needsUpdate   = true;
  poolGeo.attributes.aSize.needsUpdate    = true;
  // Three.js caches the bounding sphere at build time; null forces recompute so
  // raycasting stays accurate after stars recycle to positions far from origin.
  poolGeo.boundingSphere = null;
}

function assignSlot(i, courseIdx, x, y, z) {
  pool[i] = courseIdx;
  poolPositions[i*3]   = x;
  poolPositions[i*3+1] = y;
  poolPositions[i*3+2] = z;
  const c   = courses[courseIdx];
  const rgb = new THREE.Color(GROUP_COLOR[c.group] ?? 0xaabbcc);
  poolColors[i*3]   = rgb.r;
  poolColors[i*3+1] = rgb.g;
  poolColors[i*3+2] = rgb.b;
  poolSizes[i] = 4.0 + Math.random() * 4.5 + Math.min((c.credits || 3) * 0.5, 3.0);
}

export function buildCoursePool(scene, camera, courseData) {
  courses       = courseData;
  poolPositions = new Float32Array(POOL_SIZE * 3);
  poolColors    = new Float32Array(POOL_SIZE * 3);
  poolSizes     = new Float32Array(POOL_SIZE);
  const phases  = new Float32Array(POOL_SIZE);
  pool          = new Array(POOL_SIZE);

  const { x: cx, y: cy, z: cz } = camera.position;
  for (let i = 0; i < POOL_SIZE; i++) {
    const [x, y, z] = randSphere(cx, cy, cz, POOL_RADIUS);
    assignSlot(i, (poolCursor++) % courses.length, x, y, z);
    phases[i] = Math.random();
  }

  poolGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(poolPositions, 3);
  const colAttr = new THREE.BufferAttribute(poolColors,    3);
  const szAttr  = new THREE.BufferAttribute(poolSizes,     1);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  colAttr.setUsage(THREE.DynamicDrawUsage);
  szAttr.setUsage(THREE.DynamicDrawUsage);
  poolGeo.setAttribute('position', posAttr);
  poolGeo.setAttribute('aColor',   colAttr);
  poolGeo.setAttribute('aSize',    szAttr);
  poolGeo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));

  poolMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
  });

  poolPoints = new THREE.Points(poolGeo, poolMat);
  poolPoints.frustumCulled = false;
  scene.add(poolPoints);

  // Highlight ring — single-point geometry repositioned each frame
  highlightPos = new Float32Array(3);
  highlightGeo = new THREE.BufferGeometry();
  const hPosAttr = new THREE.BufferAttribute(highlightPos, 3);
  hPosAttr.setUsage(THREE.DynamicDrawUsage);
  highlightGeo.setAttribute('position', hPosAttr);

  highlightMat = new THREE.ShaderMaterial({
    vertexShader: HIGHLIGHT_VERT, fragmentShader: HIGHLIGHT_FRAG,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
  });

  highlightMesh = new THREE.Points(highlightGeo, highlightMat);
  highlightMesh.frustumCulled = false;
  highlightMesh.visible = false;
  scene.add(highlightMesh);
}

export function tickCoursePool(camera) {
  if (!poolGeo) return;
  const { x: cx, y: cy, z: cz } = camera.position;
  const R2 = POOL_RECYCLE * POOL_RECYCLE;
  let dirty = false;

  for (let i = 0; i < POOL_SIZE; i++) {
    if (i === rig.flyTargetSlot) continue;
    const dx = poolPositions[i*3]   - cx;
    const dy = poolPositions[i*3+1] - cy;
    const dz = poolPositions[i*3+2] - cz;
    if (dx*dx + dy*dy + dz*dz > R2) {
      const [x, y, z] = randSphere(cx, cy, cz, POOL_RADIUS);
      assignSlot(i, (poolCursor++) % courses.length, x, y, z);
      dirty = true;
    }
  }

  if (dirty) markPoolDirty();
}

export function tickPoolTime(elapsed) {
  if (poolMat)       poolMat.uniforms.uTime.value       = elapsed;
  if (highlightMat)  highlightMat.uniforms.uTime.value  = elapsed;
}

export function tickHighlight(slotIdx) {
  if (!highlightMesh) return;
  if (slotIdx < 0) {
    highlightMesh.visible = false;
    return;
  }
  highlightMesh.visible  = true;
  highlightPos[0] = poolPositions[slotIdx*3];
  highlightPos[1] = poolPositions[slotIdx*3+1];
  highlightPos[2] = poolPositions[slotIdx*3+2];
  highlightGeo.attributes.position.needsUpdate = true;
}

export function flyToCourse(courseIdx, camera) {
  if (courseIdx === lastFlyTarget) return;
  lastFlyTarget = courseIdx;

  let slotIdx = pool.indexOf(courseIdx);

  if (slotIdx < 0) {
    const { x: cx, y: cy, z: cz } = camera.position;
    let maxD2 = -1, farthest = 0;
    for (let i = 0; i < POOL_SIZE; i++) {
      const dx = poolPositions[i*3]-cx, dy = poolPositions[i*3+1]-cy, dz = poolPositions[i*3+2]-cz;
      const d2 = dx*dx + dy*dy + dz*dz;
      if (d2 > maxD2) { maxD2 = d2; farthest = i; }
    }
    slotIdx = farthest;
  }

  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const sp  = camera.position.clone().addScaledVector(fwd, 80000);
  assignSlot(slotIdx, courseIdx, sp.x, sp.y, sp.z);
  markPoolDirty();

  rig.flyTargetSlot = slotIdx;
  const tx  = poolPositions[slotIdx*3];
  const ty  = poolPositions[slotIdx*3+1];
  const tz  = poolPositions[slotIdx*3+2];
  const dir = new THREE.Vector3(tx - camera.position.x, ty - camera.position.y, tz - camera.position.z).normalize();
  rig.flyOrigin    = camera.position.clone();
  rig.flyTarget    = new THREE.Vector3(tx, ty, tz).addScaledVector(dir, -200);
  rig.flyT         = 0;
  rig.flyStartTime = performance.now();
  rig.yaw          = Math.atan2(-dir.x, -dir.z);
  rig.pitch        = Math.asin(Math.max(-1, Math.min(1, dir.y)));

  const dist = rig.flyOrigin.distanceTo(rig.flyTarget);
  const mid  = rig.flyOrigin.clone().lerp(rig.flyTarget, 0.5);
  let   perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  if (perp.lengthSq() < 0.1) perp.set(1, 0, 0);
  rig.flyControl = mid.addScaledVector(perp, Math.min(dist * 0.25, 12000) * (Math.random() < 0.5 ? 1 : -1));
}

export function getPoolData() { return { pool, poolPositions }; }
