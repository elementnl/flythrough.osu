import * as THREE from 'three';
import { MW_R } from './config.js';

export function buildSkybox(scene) {
  const texture = new THREE.TextureLoader().load('/stars.jpg');
  const geo = new THREE.SphereGeometry(MW_R, 64, 32);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
    opacity: 0.2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -2;
  scene.add(mesh);
  return mesh;
}
