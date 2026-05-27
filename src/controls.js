import * as THREE from 'three';
import { MOVE_SPEED, LOOK_SPEED } from './config.js';
import { rig } from './rig.js';

const _pick       = new THREE.Vector3();
const MAX_PICK_D2 = 2200 * 2200; // world-distance cap — avoids selecting far tiny stars
const NDC_THRESH  = 0.10;        // NDC radius (~6% of half-width) for center-screen snap

let mouseHeld  = false;
let hoveredIdx = -1;

function isLocked(cv) {
  return document.pointerLockElement === cv;
}

export function setupControls(renderer, onSpacePress, onEscape) {
  const cv = renderer.domElement;

  cv.addEventListener('click', () => {
    if (!isLocked(cv)) cv.requestPointerLock();
  });

  // avoids a brief thrust on the lock-acquiring click
  cv.addEventListener('mousedown', e => {
    if (e.target !== cv || !isLocked(cv)) return;
    mouseHeld = true;
    onEscape();
  });

  document.addEventListener('mouseup', () => {
    mouseHeld = false;
  });

  document.addEventListener('mousemove', e => {
    if (!isLocked(cv)) return;
    rig.yaw   -= e.movementX * LOOK_SPEED;
    rig.pitch -= e.movementY * LOOK_SPEED;
    rig.pitch  = Math.max(-1.55, Math.min(1.55, rig.pitch));
  });

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space')  { e.preventDefault(); onSpacePress(); }
    if (e.code === 'Escape') onEscape();
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = isLocked(cv);
    document.getElementById('hint')?.classList.toggle('hidden', locked);
    document.getElementById('esc-hint')?.classList.toggle('visible', locked);
  });
}

export function tickControls(camera, dt) {
  camera.quaternion.setFromEuler(new THREE.Euler(rig.pitch, rig.yaw, 0, 'YXZ'));

  if (rig.flyTarget && rig.flyT < 1) {
    rig.flyT = Math.min((performance.now() - rig.flyStartTime) / rig.flyDuration, 1);
    if (rig.flyT >= 1) rig.flyTargetSlot = -1;
    const t = rig.flyT < 0.5 ? 16*Math.pow(rig.flyT, 5) : 1 - Math.pow(-2*rig.flyT + 2, 5) / 2;
    if (rig.flyControl) {
      const mt = 1 - t;
      camera.position.set(
        mt*mt*rig.flyOrigin.x + 2*mt*t*rig.flyControl.x + t*t*rig.flyTarget.x,
        mt*mt*rig.flyOrigin.y + 2*mt*t*rig.flyControl.y + t*t*rig.flyTarget.y,
        mt*mt*rig.flyOrigin.z + 2*mt*t*rig.flyControl.z + t*t*rig.flyTarget.z,
      );
    } else {
      camera.position.lerpVectors(rig.flyOrigin, rig.flyTarget, t);
    }
    return;
  }

  if (mouseHeld) {
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(fwd, MOVE_SPEED * dt);
  }
}

export function tickRaycast(camera, poolPositions, poolSize) {
  if (!poolPositions) return;
  const { x: cx, y: cy, z: cz } = camera.position;
  let bestIdx = -1, bestD2 = Infinity;

  for (let i = 0; i < poolSize; i++) {
    const wx = poolPositions[i*3], wy = poolPositions[i*3+1], wz = poolPositions[i*3+2];
    const dx = wx - cx, dy = wy - cy, dz = wz - cz;
    if (dx*dx + dy*dy + dz*dz > MAX_PICK_D2) continue;   // too far

    _pick.set(wx, wy, wz).project(camera);
    if (_pick.z > 1.0) continue;                          // behind camera

    const sd = _pick.x * _pick.x + _pick.y * _pick.y;    // squared NDC distance from center
    if (sd < bestD2) { bestD2 = sd; bestIdx = i; }
  }

  const newIdx = bestD2 < NDC_THRESH * NDC_THRESH ? bestIdx : -1;
  if (newIdx !== hoveredIdx) {
    hoveredIdx = newIdx;
    document.getElementById('xhair').classList.toggle('hot', hoveredIdx >= 0);
  }
}

export function getHoveredIdx() { return hoveredIdx; }
