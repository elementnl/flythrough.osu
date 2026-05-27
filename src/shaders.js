export const STAR_VERT = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aPhase;
  varying   vec3  vColor;
  varying   float vDist;
  uniform   float uTime;

  void main() {
    vColor = aColor;
    float t1 = sin(uTime * 1.6 + aPhase * 6.283);
    float t2 = sin(uTime * 0.65 + aPhase * 3.14 + 1.2);
    float twinkle = 0.72 + 0.18 * t1 + 0.10 * t2;
    vec4  mv      = modelViewMatrix * vec4(position, 1.0);
    vDist         = -mv.z;
    gl_PointSize  = clamp(aSize * twinkle * (6000.0 / -mv.z), 1.5, 600.0);
    gl_Position   = projectionMatrix * mv;
  }
`;

export const STAR_FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vDist;

  void main() {
    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float r  = length(uv);
    if (r > 1.0) discard;

    float core  = exp(-r * r * 4.5);
    float halo  = pow(max(0.0, 1.0 - r), 1.5) * 0.68;
    float spX   = exp(-abs(uv.x) * 6.0 - uv.y * uv.y * 28.0);
    float spY   = exp(-abs(uv.y) * 6.0 - uv.x * uv.x * 28.0);
    float spike = (spX + spY) * 0.45;

    float edge     = 1.0 - smoothstep(0.72, 1.0, r);
    float distFade = clamp(1.0 - vDist / 5000.0, 0.08, 1.0);
    float a        = clamp((core + halo + spike) * edge * distFade, 0.0, 1.0);

    vec3 col = vColor + vec3(core * 0.85) + vec3(spike * 0.35);
    gl_FragColor = vec4(col, a);
  }
`;

export const INF_VERT = /* glsl */`
  attribute float aSize;
  attribute float aBright;
  varying   float vBright;
  varying   float vDist;

  void main() {
    vBright  = aBright;
    vec4 mv  = modelViewMatrix * vec4(position, 1.0);
    vDist    = -mv.z;
    gl_PointSize = clamp(aSize * (2000.0 / -mv.z), 3.5, 22.0);
    gl_Position  = projectionMatrix * mv;
  }
`;

export const INF_FRAG = /* glsl */`
  varying float vBright;
  varying float vDist;

  void main() {
    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float r  = length(uv);
    if (r > 1.0) discard;
    float core = exp(-r * r * 4.5);
    float soft = pow(max(0.0, 1.0 - r), 1.7);
    float edge = 1.0 - smoothstep(0.62, 1.0, r);
    float distFade = clamp(1.0 - vDist / 6000.0, 0.18, 1.0);
    float a    = (core * 0.72 + soft * 0.28) * edge * vBright * distFade;
    gl_FragColor = vec4(0.86, 0.93, 1.0, a);
  }
`;

export const HIGHLIGHT_VERT = /* glsl */`
  uniform float uTime;
  varying  float vPulse;

  void main() {
    vPulse = 0.5 + 0.5 * sin(uTime * 2.8);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(52.0 * (6000.0 / -mv.z), 22.0, 700.0);
    gl_Position  = projectionMatrix * mv;
  }
`;

export const HIGHLIGHT_FRAG = /* glsl */`
  varying float vPulse;

  void main() {
    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float r  = length(uv);
    if (r > 1.0) discard;
    float ringR = 0.60 + vPulse * 0.10;
    float ring  = exp(-pow((r - ringR) * 11.0, 2.0));
    float glow  = exp(-r * r * 5.0) * 0.22;
    gl_FragColor = vec4(1.0, 0.92, 0.45, ring * 0.88 + glow);
  }
`;

export const NEBULA_VERT = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  varying   vec3  vColor;

  void main() {
    vColor = aColor;
    vec4 mv  = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (900.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

export const NEBULA_FRAG = /* glsl */`
  varying vec3 vColor;

  void main() {
    vec2  uv  = gl_PointCoord * 2.0 - 1.0;
    float r   = length(uv);
    if (r > 1.0) discard;
    float outer = pow(max(0.0, 1.0 - r), 1.4) * 0.55;
    float core  = exp(-r * r * 12.0) * 0.4;
    gl_FragColor = vec4(vColor, outer + core);
  }
`;
