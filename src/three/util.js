export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t, s = 1.4) => {
  const c3 = s + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
};
/** Frame-rate independent damping. */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/** Deterministic RNG so every pizza looks the same on every visit. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hashString = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Poisson-disc-ish sampling inside an annulus (dart throwing, good enough for <100 points). */
export function scatterInDisc(count, { rMin = 0.05, rMax = 0.75, minDist = 0.15, random = Math.random } = {}) {
  const pts = [];
  let d = minDist;
  let tries = 0;
  while (pts.length < count && tries < 6000) {
    tries++;
    if (tries % 1200 === 0) d *= 0.9; // relax if crowded
    const r = Math.sqrt(lerp(rMin * rMin, rMax * rMax, random()));
    const a = random() * Math.PI * 2;
    const x = r * Math.sin(a);
    const z = r * Math.cos(a);
    if (pts.every((p) => (p.x - x) ** 2 + (p.z - z) ** 2 > d * d)) pts.push({ x, z, r, a });
  }
  return pts;
}

/** Smooth periodic noise around a circle, used for organic edges. */
export const ringNoise = (theta, seed = 0, amp = 1) =>
  amp *
  (0.55 * Math.sin(theta * 5 + seed * 1.7) +
    0.3 * Math.sin(theta * 11 + seed * 3.1 + 1.3) +
    0.15 * Math.sin(theta * 23 + seed * 5.3 + 0.4));

export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
export const isSmallScreen = () => typeof window !== 'undefined' && window.innerWidth < 760;
