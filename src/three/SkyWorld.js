import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cloudPuffTexture, softDotTexture, skyTexture, meadowTexture, asTexture } from './textures';
import { rng, lerp } from './util';

/**
 * The dreamy sky world behind the hero pizza (inspired by MotionSites "Sky Cookie"):
 * painted sky, cumulus clouds, sandstone boulders, a wildflower meadow below and floating dream-dust.
 * Units: camera sits at z = CAM_Z looking down -Z; it descends by DESCENT on scroll.
 */
export const CAM_Z = 12;
export const FOV = 30;
export const DESCENT = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
export const halfH = (z) => (CAM_Z - z) * TAN;

/* ----------------------------- 3D value noise ----------------------------- */
const perm = (() => {
  const R = rng(1234);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
})();
const fade = (t) => t * t * (3 - 2 * t);
const h3 = (x, y, z) => perm[perm[perm[x & 255] + (y & 255)] + (z & 255)] / 255;
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(h3(xi, yi, zi), h3(xi + 1, yi, zi), xf), l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), xf), yf),
    l(l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), xf), l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), xf), yf),
    zf,
  );
}
const fbm = (x, y, z) => noise3(x, y, z) * 0.55 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.3 + noise3(x * 4.3, y * 4.3, z * 4.3) * 0.15;

export class SkyWorld {
  constructor({ quality = 'high' } = {}) {
    this.quality = quality;
    this.group = new THREE.Group();
    this.clouds = [];
    this.rocks = [];
    this.hills = [];
    this.aspect = 16 / 9;
    this.puffTex = asTexture(cloudPuffTexture());
    this.dotTex = asTexture(softDotTexture());

    this.buildSky();
    this.buildClouds();
    this.buildHills();
    this.buildRocks();
    this.buildDust();
  }

  buildSky() {
    const tex = asTexture(skyTexture());
    this.skyMat = new THREE.MeshBasicMaterial({ map: tex, depthWrite: false, fog: false, toneMapped: false });
    this.sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.skyMat);
    this.sky.renderOrder = -10;
    this.group.add(this.sky);

    const sunMat = new THREE.MeshBasicMaterial({
      map: this.dotTex,
      color: '#fff4cf',
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.sun = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sunMat);
    this.sun.renderOrder = -9;
    this.group.add(this.sun);
  }

  makeCloud(R, puffs, width, height) {
    const mat = new THREE.MeshBasicMaterial({
      map: this.puffTex,
      transparent: true,
      depthWrite: false,
      fog: true,
      toneMapped: false,
      opacity: 0.96,
    });
    const items = [];
    for (let i = 0; i < puffs; i++) {
      const u = R() - 0.5;
      const hf = 1 - (2 * u) ** 2;
      const x = u * width;
      const y = R() * height * (0.25 + hf * 0.75);
      const s = (0.5 + R() * 0.6) * height * (0.65 + hf * 0.55);
      items.push({ x, y, z: (R() - 0.5) * height * 0.5, s, shade: lerp(0.8, 1.02, y / height) });
    }
    // flat-ish bases
    for (let i = 0; i < Math.round(puffs * 0.35); i++) {
      const x = (R() - 0.5) * width * 1.05;
      items.push({ x, y: -height * 0.05, z: (R() - 0.5) * 0.3, s: height * (0.45 + R() * 0.3), shade: 0.78 + R() * 0.06 });
    }
    items.sort((a, b) => a.z - b.z);
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, items.length);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const base = new THREE.Color('#cfdde8');
    const top = new THREE.Color('#ffffff');
    items.forEach((it, i) => {
      m.makeScale(it.s * 1.15, it.s, 1).setPosition(it.x, it.y, it.z);
      mesh.setMatrixAt(i, m);
      c.copy(base).lerp(top, THREE.MathUtils.clamp((it.shade - 0.78) / 0.24, 0, 1));
      mesh.setColorAt(i, c);
    });
    mesh.frustumCulled = false;
    return mesh;
  }

  buildClouds() {
    const R = rng(77);
    const lo = this.quality !== 'high';
    // [x (as fraction of half width), y, z, width, height, kind]
    const layout = [
      // the opening view
      [-0.78, 2.6, -14, 9, 2.4, 'hero'],
      [0.82, 1.4, -18, 11, 3.0, 'hero'],
      [-0.95, -2.9, -6, 8, 2.2, 'hero'],
      [0.9, -3.4, -10, 9, 2.4, 'hero'],
      [0.1, 4.6, -34, 16, 3.4, 'hero'],
      [-0.4, -0.6, -42, 18, 3.0, 'hero'],
      // on the way down
      [-0.7, -6.5, -12, 10, 2.6, 'down'],
      [0.75, -8.0, -16, 12, 3.2, 'down'],
      [-0.2, -11.5, -30, 22, 3.6, 'down'],
      [0.55, -12.8, -24, 14, 2.8, 'down'],
      // close ones that sweep past the camera early in the descent (gone before the exploded view)
      [-0.75, -2.4, 4.5, 5, 1.6, 'near'],
      [0.8, -3.8, 3.5, 6, 1.8, 'near'],
      [-0.2, -5.2, 6.5, 4, 1.4, 'near'],
    ];
    layout.forEach(([fx, y, z, w, h, kind], i) => {
      if (lo && kind === 'near' && i % 2) return;
      const puffs = Math.round((lo ? 16 : 26) * (w / 10 + 0.4));
      const mesh = this.makeCloud(R, puffs, w, h);
      mesh.userData = { fx, y, z, speed: (0.04 + R() * 0.1) * (kind === 'near' ? 1.6 : 1), drift: R() * 10, kind };
      mesh.position.set(0, y, z);
      this.group.add(mesh);
      this.clouds.push(mesh);
    });
  }

  buildHills() {
    const make = (variant, z, amp, freq, seed) => {
      const tex = asTexture(meadowTexture(variant));
      tex.wrapS = THREE.RepeatWrapping;
      const mat = new THREE.MeshBasicMaterial({ map: tex, fog: true, toneMapped: false });
      const geo = new THREE.PlaneGeometry(1, 1, 96, 1);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        if (p.getY(i) > 0) {
          const x = p.getX(i);
          const ridge = Math.sin(x * freq * 6.28 + seed) * 0.6 + Math.sin(x * freq * 13.7 + seed * 2) * 0.25 + Math.sin(x * 31 + seed) * 0.06;
          p.setY(i, 0.5 + ridge * amp);
        }
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { z, amp };
      mesh.position.z = z;
      this.group.add(mesh);
      this.hills.push(mesh);
      return mesh;
    };
    // [variant, z, ridge amplitude (fraction of height), frequency, seed, top as fraction of view height]
    this.hillSpec = [
      [2, -44, 0.05, 0.7, 1.2, 0.5],
      [1, -22, 0.06, 0.9, 2.4, 0.43],
      [0, -5, 0.035, 0.6, 0.6, 0.36],
    ];
    this.hillSpec.forEach(([v, z, amp, f, s]) => make(v, z, amp, f, s));
  }

  buildRocks() {
    const R = rng(5150);
    const detail = this.quality === 'high' ? 5 : 4;
    const make = (seed, squash) => {
      let geo = new THREE.IcosahedronGeometry(1, detail);
      geo.deleteAttribute('normal');
      geo.deleteAttribute('uv');
      geo = mergeVertices(geo);
      const p = geo.attributes.position;
      const colors = new Float32Array(p.count * 3);
      const sand = new THREE.Color('#d8c09a');
      const deep = new THREE.Color('#b39270');
      const dark = new THREE.Color('#6f5841');
      const moss = new THREE.Color('#62793a');
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const n = fbm(x * 1.3 + seed, y * 1.3, z * 1.3);
        const fine = noise3(x * 6 + seed, y * 6, z * 6);
        const k = 0.7 + n * 0.62 + fine * 0.05;
        p.setXYZ(i, x * k * 1.25, Math.max(y * k * squash, -0.55), z * k);
        const strata = Math.sin(y * 11 + n * 5) * 0.5 + 0.5;
        const crevice = Math.min(1, Math.max(0, (0.48 - n) * 2.6));
        c.copy(sand).lerp(deep, strata * 0.45).lerp(dark, crevice * 0.65);
        if (y > 0.62 && fbm(x * 3 + 9, y * 3, z * 3 + seed) > 0.63) c.lerp(moss, 0.7);
        colors.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 }));
      this.group.add(mesh);
      this.rocks.push(mesh);
      return mesh;
    };
    // [side, x-frac, y (absolute), z, scale, squash]
    this.rockSpec = [
      [-1, 1.02, null, 2.2, 1.9, 0.78],
      [1, 1.0, null, -1.0, 2.3, 0.9],
      [-1, 0.86, 'meadow', -9, 2.6, 0.82],
      [1, 0.92, 'meadow', -11, 3.2, 0.95],
    ];
    this.rockSpec.forEach((s, i) => make(R() * 10 + i, s[5]));
  }

  buildDust() {
    const n = this.quality === 'high' ? 160 : 80;
    const R = rng(808);
    const pos = new Float32Array(n * 3);
    this.dustSeed = [];
    for (let i = 0; i < n; i++) {
      pos.set([(R() - 0.5) * 16, lerp(5, -DESCENT - 5, R()), lerp(-6, 7, R())], i * 3);
      this.dustSeed.push({ speed: 0.08 + R() * 0.25, phase: R() * 6.28 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        map: this.dotTex,
        size: 0.075,
        sizeAttenuation: true,
        color: '#fffbe6',
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    this.group.add(this.dust);
  }

  /** Re-layout everything that depends on the viewport aspect. */
  layout(aspect) {
    this.aspect = aspect;
    const hw = (z) => halfH(z) * aspect;

    // sky backdrop
    const zSky = -70;
    const hSky = halfH(zSky);
    this.sky.position.set(0, -DESCENT * 0.5 - 2, zSky);
    this.sky.scale.set(hw(zSky) * 2.4, hSky * 2 + DESCENT + 10, 1);
    this.sun.position.set(hw(-66) * 0.55, hSky * 0.55, -66);
    this.sun.scale.setScalar(hSky * 1.15);

    this.clouds.forEach((c) => {
      const { fx, z } = c.userData;
      c.userData.baseX = fx * hw(z);
      c.userData.range = hw(z) * 1.35 + 6;
    });

    // hills sit so their ridge lands at a fraction of the final (descended) view
    this.hills.forEach((h, i) => {
      const [, z, , , , topFrac] = this.hillSpec[i];
      const hh = halfH(z);
      const width = hw(z) * 2.6 + 4;
      const height = hh * 2;
      h.scale.set(width, height, 1);
      const top = -DESCENT - hh + topFrac * hh * 2;
      h.position.set(0, top - height * 0.5, z);
      // keep the painted texture's aspect (canvas is 4:1) so flowers don't stretch into streaks
      h.material.map.repeat.set(Math.max(1, width / (height * 4)), 1);
    });

    // narrow (phone) screens: keep the boulders in proportion to the view width
    const narrow = THREE.MathUtils.clamp(aspect / 1.5, 0.42, 1);
    this.rocks.forEach((r, i) => {
      const [side, fx, yMode, z, base] = this.rockSpec[i];
      const scale = base * narrow;
      const hh = halfH(z);
      r.scale.setScalar(scale);
      const x = side * fx * hw(z);
      const y = yMode === 'meadow' ? -DESCENT - hh + 0.36 * hh * 2 - scale * 0.25 : -hh - scale * 0.15;
      r.position.set(x, y, z);
      r.rotation.set(0.2 * side, i * 1.7, 0.1 * side);
    });
  }

  update(t, dt) {
    this.clouds.forEach((c) => {
      const u = c.userData;
      const span = u.range * 2;
      let x = u.baseX + (t * u.speed + u.drift);
      x = ((((x + u.range) % span) + span) % span) - u.range;
      c.position.x = x;
    });
    const p = this.dust.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const s = this.dustSeed[i];
      let y = p.getY(i) + s.speed * dt;
      if (y > 6) y = -DESCENT - 6;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 0.6 + s.phase) * 0.0015);
    }
    p.needsUpdate = true;
  }
}
