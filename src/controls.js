import * as THREE from 'three';
import { MOVE_SPEED, LOOK_SPEED } from './config.js';
import { rig } from './rig.js';

const _pick       = new THREE.Vector3();
const MAX_PICK_D2 = 2200 * 2200; // world-distance cap — avoids selecting far tiny stars
const NDC_THRESH  = 0.10;        // NDC radius (~6% of half-width) for center-screen snap

const MOBILE = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

let mouseHeld  = false;
let touchHeld  = false;
let hoveredIdx = -1;

function isLocked(cv) {
  return document.pointerLockElement === cv;
}

function setupDesktopControls(cv, onSpacePress, onEscape) {
  cv.addEventListener('click', () => {
    if (!isLocked(cv)) cv.requestPointerLock();
  });

  // avoids a brief thrust on the lock-acquiring click
  cv.addEventListener('mousedown', e => {
    if (e.target !== cv || !isLocked(cv)) return;
    mouseHeld = true;
    onEscape();
  });

  document.addEventListener('mouseup', () => { mouseHeld = false; });

  document.addEventListener('mousemove', e => {
    if (!isLocked(cv)) return;
    rig.yaw   -= e.movementX * LOOK_SPEED;
    rig.pitch -= e.movementY * LOOK_SPEED;
    rig.pitch  = Math.max(-1.55, Math.min(1.55, rig.pitch));
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = isLocked(cv);
    document.getElementById('hint')?.classList.toggle('hidden', locked);
    document.getElementById('esc-hint')?.classList.toggle('visible', locked);
  });
}

function setupTouchControls(cv, onSpacePress, onEscape) {
  let touchId = null, lastTx = 0, lastTy = 0, touchMoved = false;

  cv.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchId   = t.identifier;
    lastTx    = t.clientX;
    lastTy    = t.clientY;
    touchMoved = false;
    touchHeld  = true;
    onEscape();
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== touchId) continue;
      const dx = t.clientX - lastTx;
      const dy = t.clientY - lastTy;
      rig.yaw   -= dx * LOOK_SPEED * 1.5;
      rig.pitch -= dy * LOOK_SPEED * 1.5;
      rig.pitch  = Math.max(-1.55, Math.min(1.55, rig.pitch));
      lastTx = t.clientX;
      lastTy = t.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 4) touchMoved = true;
    }
  }, { passive: false });

  cv.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== touchId) continue;
      touchHeld = false;
      if (!touchMoved) onSpacePress(); // tap = open course
    }
  });

  const hint = document.getElementById('hint');
  if (hint) hint.textContent = 'hold & drag to fly and look · tap star to open';
  document.getElementById('esc-hint')?.remove();

  const lbl = document.getElementById('star-label');
  if (lbl) lbl.textContent = 'tap to view';
}

export function setupControls(renderer, onSpacePress, onEscape) {
  const cv = renderer.domElement;

  if (MOBILE) {
    setupTouchControls(cv, onSpacePress, onEscape);
  } else {
    setupDesktopControls(cv, onSpacePress, onEscape);
  }

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space')  { e.preventDefault(); onSpacePress(); }
    if (e.code === 'Escape') onEscape();
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

  if (mouseHeld || touchHeld) {
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
    if (dx*dx + dy*dy + dz*dz > MAX_PICK_D2) continue;

    _pick.set(wx, wy, wz).project(camera);
    if (_pick.z > 1.0) continue;

    const sd = _pick.x * _pick.x + _pick.y * _pick.y;
    if (sd < bestD2) { bestD2 = sd; bestIdx = i; }
  }

  const newIdx = bestD2 < NDC_THRESH * NDC_THRESH ? bestIdx : -1;
  if (newIdx !== hoveredIdx) {
    hoveredIdx = newIdx;
    document.getElementById('xhair').classList.toggle('hot', hoveredIdx >= 0);
  }
}

export function getHoveredIdx() { return hoveredIdx; }
