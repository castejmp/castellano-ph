/**
 * Shaders del campo de partículas.
 *
 * El vértice combina cuatro fuerzas sobre cada punto:
 *   1. Morphing entre la nube ambiente y la figura objetivo (uMorph).
 *   2. Movimiento ambiente con ruido simplex (curl-like).
 *   3. Reacción al audio en Modo Vivo (bass empuja, treble agita).
 *   4. El puntero como fuente de luz que repele las partículas.
 *
 * El fragmento dibuja un sprite circular suave con glow; el Bloom del
 * postprocessing termina de darle el brillo de instalación en vivo.
 */

export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform vec2  uPointer;
  uniform float uPointerActive;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uLevel;
  uniform float uLive;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3  aTarget;
  attribute float aSeed;
  attribute float aScale;

  varying float vMix;
  varying float vGlow;

  // --- Ruido simplex 3D (Ashima Arts / Stefan Gustavson) ---
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // 1) Morphing nube → figura.
    float m = smoothstep(0.0, 1.0, uMorph);
    vec3 pos = mix(position, aTarget, m);

    // 2) Movimiento ambiente. La figura "respira" menos que la nube difusa.
    float ambientAmp = mix(0.55, 0.16, m);
    float t = uTime * 0.18 + aSeed * 6.2831;
    vec3 noise = vec3(
      snoise(pos * 0.22 + vec3(t, 0.0, 0.0)),
      snoise(pos * 0.22 + vec3(0.0, t, 10.0)),
      snoise(pos * 0.22 + vec3(20.0, 0.0, t))
    );
    pos += noise * ambientAmp;

    // 3) Modo Vivo: el bajo empuja hacia afuera, el agudo agita.
    float beat = uBass * uLive;
    vec3 dir = normalize(pos + 0.0001);
    pos += dir * beat * 1.6;
    pos += noise * uTreble * uLive * 0.9;

    // 4) El puntero repele como una fuente de luz.
    vec2 toP = pos.xy - uPointer;
    float dist = length(toP);
    float force = uPointerActive * 1.4 / (dist * dist + 0.35);
    pos.xy += normalize(toP + 0.0001) * force;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Tamaño con atenuación por distancia + boost por nivel de audio.
    float live = 1.0 + uLevel * uLive * 1.8 + beat * 1.2;
    gl_PointSize = uSize * aScale * live * uPixelRatio * (12.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.0, 64.0 * uPixelRatio);

    // Datos para el fragmento.
    vMix = clamp(aSeed * 0.5 + uMid * uLive * 0.8 + m * 0.25, 0.0, 1.0);
    vGlow = 0.6 + beat * 0.9 + force * 0.5;
  }
`;

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vMix;
  varying float vGlow;

  void main() {
    // Sprite circular con caída gaussiana suave.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.0, d);
    alpha = pow(alpha, 1.6);

    vec3 color = mix(uColorA, uColorB, vMix);
    color *= vGlow;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;
