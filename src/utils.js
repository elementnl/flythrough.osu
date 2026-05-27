export function lcg(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function randSphere(cx, cy, cz, r) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const dist  = r * Math.cbrt(Math.random());
  return [
    cx + Math.sin(phi) * Math.cos(theta) * dist,
    cy + Math.cos(phi) * dist,
    cz + Math.sin(phi) * Math.sin(theta) * dist,
  ];
}
