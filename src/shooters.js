import * as THREE from 'three';

const COLORS = [
  0xffffff, 0xffffff, 0xffffff,
  0xaaddff, 0x88ccff,
  0xffcc88, 0xffaa44,
  0x99ffcc,
];

let scene;
const active = [];
let nextShot = 0.3;

export function buildShooters(sceneRef) {
  scene = sceneRef;
}

export function tickShooters(camera, dt) {
  nextShot -= dt;
  if (nextShot <= 0) {
    spawn(camera);
    if (Math.random() < 0.50) spawn(camera);
    if (Math.random() < 0.20) spawn(camera);
    nextShot = 0.3 + Math.random() * 1.0;
  }

  for (let i = active.length - 1; i >= 0; i--) {
    const s = active[i];
    s.d += s.speed * dt;
    if (s.d >= s.maxD) {
      scene.remove(s.line);
      s.line.geometry.dispose();
      s.line.material.dispose();
      active.splice(i, 1);
      continue;
    }
    const t    = s.d / s.maxD;
    s.line.material.opacity = (1 - t) * 0.8;
    const head = s.origin.clone().addScaledVector(s.dir, s.d);
    const tail = head.clone().addScaledVector(s.dir, -s.trail * (1 - t * 0.5));
    const p    = s.line.geometry.attributes.position;
    p.setXYZ(0, tail.x, tail.y, tail.z);
    p.setXYZ(1, head.x, head.y, head.z);
    p.needsUpdate = true;
  }
}

function spawn(camera) {
  const { x: cx, y: cy, z: cz } = camera.position;
  const origin = new THREE.Vector3(
    cx + (Math.random()-0.5)*8000,
    cy + (Math.random()-0.5)*4000,
    cz + (Math.random()-0.5)*8000,
  );
  const dir      = new THREE.Vector3(Math.random()-0.5, -Math.random()*0.28, Math.random()-0.5).normalize();
  const isBright = Math.random() < 0.18;
  const speed    = isBright ? 6000 + Math.random()*4000 : 3500 + Math.random()*2500;
  const trail    = isBright ? 1000 + Math.random()*800  : 400  + Math.random()*500;
  const maxD     = isBright ? 6000 + Math.random()*3000 : 3000 + Math.random()*2000;
  const color    = COLORS[Math.floor(Math.random() * COLORS.length)];

  const geo  = new THREE.BufferGeometry().setFromPoints([origin.clone(), origin.clone()]);
  const mat  = new THREE.LineBasicMaterial({ color, transparent: true, opacity: isBright ? 1.0 : 0.8, depthWrite: false });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  active.push({ line, dir, speed, trail, origin: origin.clone(), d: 0, maxD });
}
