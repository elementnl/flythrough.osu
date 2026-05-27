import * as THREE from 'three';
import { NEBULA_VERT, NEBULA_FRAG } from './shaders.js';

const ORBS = [
  { col: 0x6633cc, size: 680, pos: [  5900,  640, -3850] },
  { col: 0x1155ee, size: 520, pos: [ -4800, -385,  5770] },
  { col: 0xcc2255, size: 750, pos: [ -8350, 1155, -2700] },
  { col: 0x22aa55, size: 490, pos: [  3330,-1155,  7050] },
  { col: 0xcc6611, size: 610, pos: [ -2240, 2310,-7700] },
  { col: 0x1144aa, size: 700, pos: [ 10900,  -640, 3530] },
  { col: 0x8833cc, size: 440, pos: [  -515, 3335,  5130] },
  { col: 0x226655, size: 560, pos: [  7050,-1925, -5770] },
  { col: 0xee4422, size: 820, pos: [-12000, 2200,  4400] },
  { col: 0x2255cc, size: 730, pos: [  8800,-2800, -9500] },
  { col: 0xaa44dd, size: 590, pos: [ -6600, 4100,  8200] },
  { col: 0x33ccaa, size: 640, pos: [  4200,-3600,-11000] },
];

export function buildDecorations(scene) {
  const pos   = new Float32Array(ORBS.length * 3);
  const col   = new Float32Array(ORBS.length * 3);
  const sizes = new Float32Array(ORBS.length);

  ORBS.forEach((o, i) => {
    pos[i*3]   = o.pos[0]; pos[i*3+1] = o.pos[1]; pos[i*3+2] = o.pos[2];
    const rgb = new THREE.Color(o.col);
    col[i*3]   = rgb.r; col[i*3+1] = rgb.g; col[i*3+2] = rgb.b;
    sizes[i]   = o.size;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,   3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(col,   3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader: NEBULA_VERT, fragmentShader: NEBULA_FRAG,
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  scene.add(new THREE.Points(geo, mat));
}
