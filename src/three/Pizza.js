import * as THREE from 'three';
import {
  cheeseTexture,
  sauceTexture,
  crustTexture,
  crumbTexture,
  pepperoniTexture,
  basilTexture,
  mushroomTexture,
  tomatoTexture,
  baconTexture,
  asTexture,
} from './textures';
import { clamp, easeOutCubic, easeInOutCubic, rng, hashString, scatterInDisc, ringNoise, smoothstep } from './util';

/* ------------------------------------------------------------------------- */
/*  Shared kit (geometries / materials / textures) — built once, reused by   */
/*  every pizza in every scene.                                              */
/* ------------------------------------------------------------------------- */

const SLICES = 8;
const BED_Y = 0.05;
const SAUCE_Y = 0.054;
const CHEESE_Y = 0.06;
const TOP_Y = 0.064; // where toppings sit

// Crust profile (r, y): bottom centre → out → up the rim → inward along the top.
const PROFILE = [
  [0.0, 0.0],
  [0.45, 0.0],
  [0.92, 0.0],
  [0.965, 0.003],
  [0.993, 0.02],
  [1.006, 0.052],
  [1.004, 0.086],
  [0.99, 0.114],
  [0.962, 0.128],
  [0.925, 0.117],
  [0.885, 0.086],
  [0.845, 0.06],
  [0.8, BED_Y],
  [0.4, BED_Y],
  [0.0, BED_Y],
];

// Slice cut face (includes the sauce + cheese band on top of the bed)
const CAP = [
  [0.0, 0.0],
  [0.92, 0.0],
  [0.965, 0.003],
  [0.993, 0.02],
  [1.006, 0.052],
  [1.004, 0.086],
  [0.99, 0.114],
  [0.962, 0.128],
  [0.925, 0.117],
  [0.885, 0.086],
  [0.85, 0.066],
  [0.8, 0.066],
  [0.0, 0.066],
];

/** Organic rim: the same function is used for the lathe and the cut faces so they always line up. */
function rimDisplace(r, y, phi) {
  const k = smoothstep(0.82, 0.92, r);
  if (k <= 0) return [r, y];
  // integer frequencies only, so the rim is seamless all the way around
  const n1 = ringNoise(phi, 1, 0.022);
  const n2 = ringNoise(phi * 2 + 0.5, 2, 0.02);
  return [r + n1 * k, y + n2 * k * clamp(y / 0.128)];
}

let KIT = null;

export function getKit({ quality = 'high' } = {}) {
  if (KIT) return KIT;
  const hi = quality === 'high';

  const tex = {
    cheese: asTexture(cheeseTexture(hi ? 1024 : 768)),
    sauce: asTexture(sauceTexture(512)),
    crust: asTexture(crustTexture()),
    crumb: asTexture(crumbTexture()),
    pepperoni: asTexture(pepperoniTexture()),
    basil: asTexture(basilTexture()),
    mushroom: asTexture(mushroomTexture()),
    tomato: asTexture(tomatoTexture()),
    bacon: asTexture(baconTexture()),
  };
  tex.crust.flipY = false;
  tex.crust.wrapS = THREE.RepeatWrapping;
  tex.crust.repeat.set(3, 1);

  const mat = {
    crust: new THREE.MeshStandardMaterial({ map: tex.crust, roughness: 0.78, bumpMap: tex.crust, bumpScale: 1.4 }),
    crumb: new THREE.MeshStandardMaterial({ map: tex.crumb, roughness: 0.9, side: THREE.DoubleSide }),
    sauce: new THREE.MeshStandardMaterial({ map: tex.sauce, roughness: 0.45 }),
    cheese: new THREE.MeshPhysicalMaterial({
      map: tex.cheese,
      roughness: 0.42,
      bumpMap: tex.cheese,
      bumpScale: 2.2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45,
      sheen: 0.4,
      sheenColor: new THREE.Color('#fff2c0'),
    }),
    pepperoniTop: new THREE.MeshPhysicalMaterial({ map: tex.pepperoni, roughness: 0.52, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    pepperoniSide: new THREE.MeshStandardMaterial({ color: '#5a0e09', roughness: 0.6 }),
    olive: new THREE.MeshPhysicalMaterial({ color: '#1c1a1d', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 }),
    basil: new THREE.MeshStandardMaterial({ map: tex.basil, roughness: 0.45, side: THREE.DoubleSide }),
    mushroom: new THREE.MeshStandardMaterial({ map: tex.mushroom, roughness: 0.65 }),
    pepper: new THREE.MeshPhysicalMaterial({ color: '#3f9a2b', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    onion: new THREE.MeshPhysicalMaterial({ color: '#a2468f', roughness: 0.35, clearcoat: 0.5, sheen: 0.5, sheenColor: new THREE.Color('#ffd6f2') }),
    tomatoTop: new THREE.MeshPhysicalMaterial({ map: tex.tomato, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    tomatoSide: new THREE.MeshPhysicalMaterial({ color: '#c51d10', roughness: 0.22, clearcoat: 1 }),
    ham: new THREE.MeshStandardMaterial({ color: '#f0a79d', roughness: 0.55 }),
    pineapple: new THREE.MeshPhysicalMaterial({ color: '#f7cf47', roughness: 0.3, clearcoat: 0.5 }),
    chicken: new THREE.MeshStandardMaterial({ color: '#d9a466', roughness: 0.62 }),
    bbqChicken: new THREE.MeshPhysicalMaterial({ color: '#7c2c11', roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.25 }),
    bacon: new THREE.MeshStandardMaterial({ map: tex.bacon, roughness: 0.48, side: THREE.DoubleSide }),
    mozzarella: new THREE.MeshPhysicalMaterial({ color: '#fff7e8', roughness: 0.38, clearcoat: 0.4, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') }),
  };

  const geo = buildToppingGeometries();

  KIT = { tex, mat, geo, quality };
  return KIT;
}

function remapUV(geometry, minX, maxX, minY, maxY) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - minX) / (maxX - minX), (pos.getY(i) - minY) / (maxY - minY));
  }
  uv.needsUpdate = true;
}

function buildToppingGeometries() {
  const g = {};

  // Pepperoni — thin, barely cupped disc
  const pep = new THREE.CylinderGeometry(0.113, 0.116, 0.013, 32, 1);
  {
    const p = pep.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getZ(i));
      if (p.getY(i) > 0) p.setY(i, p.getY(i) + (r / 0.116) ** 2 * 0.004);
    }
  }
  g.pepperoni = pep;

  g.olive = new THREE.TorusGeometry(0.031, 0.014, 10, 22).rotateX(Math.PI / 2);
  g.pepper = new THREE.TorusGeometry(0.058, 0.011, 8, 20, Math.PI * 1.3).rotateX(Math.PI / 2);
  g.onion = new THREE.TorusGeometry(0.066, 0.0075, 6, 26, Math.PI * 1.15).rotateX(Math.PI / 2);

  // Basil leaf — curled up at the edges
  {
    const s = new THREE.Shape();
    s.moveTo(0, -0.1);
    s.quadraticCurveTo(0.078, -0.03, 0, 0.105);
    s.quadraticCurveTo(-0.078, -0.03, 0, -0.1);
    const leaf = new THREE.ShapeGeometry(s, 14);
    remapUV(leaf, -0.06, 0.06, -0.1, 0.105);
    leaf.rotateX(-Math.PI / 2);
    const p = leaf.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setY(i, x * x * 5 + z * z * 1.6);
    }
    leaf.computeVertexNormals();
    g.basil = leaf;
  }

  // Mushroom slice
  {
    const s = new THREE.Shape();
    s.moveTo(-0.022, -0.055);
    s.lineTo(-0.02, -0.006);
    s.quadraticCurveTo(-0.066, -0.006, -0.066, 0.012);
    s.quadraticCurveTo(-0.06, 0.056, 0, 0.059);
    s.quadraticCurveTo(0.06, 0.056, 0.066, 0.012);
    s.quadraticCurveTo(0.066, -0.006, 0.02, -0.006);
    s.lineTo(0.022, -0.055);
    s.quadraticCurveTo(0, -0.061, -0.022, -0.055);
    const m = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 10 });
    remapUV(m, -0.07, 0.07, -0.062, 0.062);
    m.translate(0, 0, -0.006);
    m.rotateX(-Math.PI / 2);
    g.mushroom = m;
  }

  // Cherry tomato half — cut face up (material groups: side, top, bottom)
  g.tomato = new THREE.CylinderGeometry(0.052, 0.046, 0.03, 26, 1);

  // Ham — thin rounded square
  {
    const s = roundedRect(0.11, 0.096, 0.02);
    const h = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: false, curveSegments: 4 });
    h.translate(0, 0, -0.004).rotateX(-Math.PI / 2);
    g.ham = h;
  }

  // Pineapple chunk — little wedge
  {
    const s = new THREE.Shape();
    s.moveTo(-0.034, -0.022);
    s.lineTo(0.034, -0.022);
    s.lineTo(0.026, 0.024);
    s.lineTo(-0.026, 0.024);
    s.closePath();
    const pg = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
    pg.translate(0, 0, -0.015).rotateX(-Math.PI / 2).scale(1.45, 1.2, 1.45);
    g.pineapple = pg;
  }

  // Chicken — irregular roasted chunk
  {
    const c = new THREE.IcosahedronGeometry(0.042, 1);
    const p = c.attributes.position;
    const R = rng(99);
    const jitter = new Map();
    for (let i = 0; i < p.count; i++) {
      const key = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
      if (!jitter.has(key)) jitter.set(key, 0.8 + R() * 0.4);
      const k = jitter.get(key);
      p.setXYZ(i, p.getX(i) * k * 1.7, p.getY(i) * k * 0.7, p.getZ(i) * k * 1.35);
    }
    c.computeVertexNormals();
    g.chicken = c;
    g.bbqChicken = c;
  }

  // Bacon — wavy strip
  {
    const b = new THREE.PlaneGeometry(0.16, 0.044, 16, 1);
    const p = b.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 62) * 0.006);
    b.rotateX(-Math.PI / 2);
    b.computeVertexNormals();
    g.bacon = b;
  }

  // Fresh mozzarella puddle
  g.mozzarella = new THREE.SphereGeometry(0.072, 20, 10).scale(1, 0.26, 1);

  return g;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Height above the cheese for each topping type (so it rests on the surface). */
const LIFT = {
  pepperoni: 0.012,
  olive: 0.014,
  pepper: 0.011,
  onion: 0.008,
  basil: 0.006,
  mushroom: 0.007,
  tomato: 0.016,
  ham: 0.005,
  pineapple: 0.026,
  chicken: 0.024,
  bbqChicken: 0.024,
  bacon: 0.008,
  mozzarella: 0.008,
};

const SIZE = {
  pepperoni: 0.22,
  olive: 0.1,
  pepper: 0.13,
  onion: 0.14,
  basil: 0.17,
  mushroom: 0.14,
  tomato: 0.11,
  ham: 0.14,
  pineapple: 0.12,
  chicken: 0.14,
  bbqChicken: 0.14,
  bacon: 0.16,
  mozzarella: 0.16,
};

export function toppingMaterial(kit, type) {
  const m = kit.mat;
  switch (type) {
    case 'pepperoni':
      return [m.pepperoniSide, m.pepperoniTop, m.pepperoniSide];
    case 'tomato':
      return [m.tomatoSide, m.tomatoTop, m.tomatoSide];
    default:
      return m[type];
  }
}

/* ------------------------------------------------------------------------- */
/*  Topping set — one per pizza variety                                      */
/* ------------------------------------------------------------------------- */

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _a = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _color = new THREE.Color();

class ToppingSet {
  constructor(kit, id, spec, sliceDirs) {
    this.id = id;
    this.kit = kit;
    this.group = new THREE.Group();
    this.group.name = `toppings-${id}`;
    this.presence = 0;
    this.lift = 0;
    this.drizzleDraw = 0;
    this.sliceDirs = sliceDirs;
    this._last = '';

    const R = rng(hashString(id));
    const types = [];
    Object.entries(spec.toppings).forEach(([type, n]) => {
      for (let i = 0; i < n; i++) types.push(type);
    });
    // shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(R() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    const avg = types.reduce((s, t) => s + SIZE[t], 0) / Math.max(1, types.length);
    const minDist = Math.min(avg * 0.95, Math.sqrt((Math.PI * 0.72 * 0.72) / Math.max(1, types.length)) * 0.82);
    const spots = scatterInDisc(types.length, { rMin: 0.04, rMax: 0.71, minDist, random: R });

    const byType = new Map();
    this.items = types.slice(0, spots.length).map((type, i) => {
      const s = spots[i];
      const yaw = R() * Math.PI * 2;
      const item = {
        type,
        slice: Math.floor((((s.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / ((Math.PI * 2) / SLICES)) % SLICES,
        landed: new THREE.Vector3(s.x, TOP_Y + LIFT[type], s.z),
        landedQ: new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.12, yaw, (R() - 0.5) * 0.12)),
        float: new THREE.Vector3(s.x * 1.28, 0.34 + R() * 0.62, s.z * 1.28),
        floatQ: new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 1.4, yaw + (R() - 0.5), (R() - 0.5) * 1.4)),
        spinAxis: new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(),
        spinSpeed: 0.3 + R() * 0.8,
        scatter: new THREE.Vector3(s.x * 2.6 + (R() - 0.5) * 2.2, 1.8 + R() * 2.6, s.z * 2.6 + (R() - 0.5) * 2.2),
        scatterQ: new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6, R() * 6, R() * 6)),
        scale: type === 'mozzarella' ? 0.85 + R() * 0.4 : 0.88 + R() * 0.24,
        delay: R(),
        tint: 0.88 + R() * 0.2,
      };
      if (!byType.has(type)) byType.set(type, []);
      item.index = byType.get(type).length;
      byType.get(type).push(item);
      return item;
    });

    this.meshes = new Map();
    byType.forEach((items, type) => {
      const mesh = new THREE.InstancedMesh(kit.geo[type], toppingMaterial(kit, type), items.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      mesh.name = type;
      items.forEach((it) => {
        _color.setScalar(it.tint);
        mesh.setColorAt(it.index, _color);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.meshes.set(type, mesh);
      this.group.add(mesh);
    });

    // Sauce drizzle
    if (spec.drizzle) {
      const curve = spec.drizzle.pattern === 'zigzag' ? zigzagCurve(R) : spiralCurve(R);
      const geo = new THREE.TubeGeometry(curve, 520, 0.0095, 6, false);
      const m = new THREE.MeshPhysicalMaterial({ color: spec.drizzle.color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 });
      this.drizzle = new THREE.Mesh(geo, m);
      this.drizzle.castShadow = true;
      this.drizzleCount = geo.index.count;
      geo.setDrawRange(0, 0);
      this.group.add(this.drizzle);
    }

    this.group.visible = false;
  }

  update(t, explode) {
    const visible = this.presence > 0.001;
    this.group.visible = visible;
    if (!visible) return;

    const sig = `${this.presence.toFixed(4)}|${this.lift.toFixed(4)}|${explode.toFixed(4)}|${this.drizzleDraw.toFixed(4)}`;
    const animating = this.lift > 0.001;
    if (sig === this._last && !animating) return;
    this._last = sig;

    for (const it of this.items) {
      const pI = clamp((this.presence - it.delay * 0.45) / 0.55);
      const ep = easeOutCubic(pI);
      const lI = clamp((this.lift - it.delay * 0.25) / 0.75);
      const el = easeInOutCubic(lI);

      // between "landed" and "floating" (exploded view)
      _a.lerpVectors(it.landed, it.float, el);
      const dir = this.sliceDirs[it.slice];
      _a.addScaledVector(dir, explode * 0.24 * (1 - el));
      _a.y += explode * 0.05 * (1 - el);
      // fly in from the scatter position with an arc
      _p.lerpVectors(it.scatter, _a, ep);
      _p.y += Math.sin(Math.PI * ep) * 0.28 * (1 - el);

      _q.copy(it.floatQ);
      if (el > 0) {
        _q3.setFromAxisAngle(_axis.copy(it.spinAxis), t * it.spinSpeed);
        _q.multiply(_q3);
      }
      _q2.slerpQuaternions(it.landedQ, _q, el);
      _q.slerpQuaternions(it.scatterQ, _q2, ep);

      const sc = pI <= 0 ? 0 : it.scale * (0.3 + 0.7 * ep) * (1 + el * 0.18);
      _s.setScalar(sc);
      _m.compose(_p, _q, _s);
      this.meshes.get(it.type).setMatrixAt(it.index, _m);
    }
    this.meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));

    if (this.drizzle) {
      const d = clamp(this.drizzleDraw) * clamp(1 - this.lift * 3) * clamp(1 - explode * 4);
      const n = Math.floor((this.drizzleCount * d) / 3) * 3;
      this.drizzle.geometry.setDrawRange(0, n);
      this.drizzle.visible = n > 0;
    }
  }
}

function spiralCurve(R) {
  const pts = [];
  const turns = 3.6;
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * Math.PI * 2;
    const r = 0.06 + t * 0.64 + Math.sin(a * 3) * 0.01;
    pts.push(new THREE.Vector3(Math.sin(a) * r, TOP_Y + 0.02 + R() * 0.004, Math.cos(a) * r));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function zigzagCurve(R) {
  const pts = [];
  const rows = 9;
  for (let i = 0; i < rows; i++) {
    const z = -0.62 + (i / (rows - 1)) * 1.24;
    const half = Math.sqrt(Math.max(0, 0.7 * 0.7 - z * z));
    const dir = i % 2 === 0 ? 1 : -1;
    pts.push(new THREE.Vector3(-half * dir, TOP_Y + 0.024, z + (R() - 0.5) * 0.03));
    pts.push(new THREE.Vector3(half * dir, TOP_Y + 0.024, z + 0.07 + (R() - 0.5) * 0.03));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
}

/* ------------------------------------------------------------------------- */
/*  Pizza                                                                    */
/* ------------------------------------------------------------------------- */

export class Pizza {
  constructor({ quality = 'high' } = {}) {
    this.kit = getKit({ quality });
    this.root = new THREE.Group(); // positioned/tilted by the scene
    this.spinner = new THREE.Group(); // spins around the pizza's own axis
    this.root.add(this.spinner);
    this.explode = 0;
    this.sets = new Map();
    this.slices = [];
    this.sliceDirs = [];
    this.buildBase();
  }

  buildBase() {
    const { mat } = this.kit;
    const dPhi = (Math.PI * 2) / SLICES;
    const segs = 14;

    for (let k = 0; k < SLICES; k++) {
      const phi0 = k * dPhi;
      const mid = phi0 + dPhi / 2;
      this.sliceDirs.push(new THREE.Vector3(Math.sin(mid), 0, Math.cos(mid)));
      const slice = new THREE.Group();

      // crust
      const lathe = new THREE.LatheGeometry(
        PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
        segs,
        phi0,
        dPhi,
      );
      const p = lathe.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const z = p.getZ(i);
        const r = Math.hypot(x, z);
        if (r < 0.8) continue;
        const phi = Math.atan2(x, z);
        const [r2, y2] = rimDisplace(r, p.getY(i), phi);
        p.setXYZ(i, Math.sin(phi) * r2, y2, Math.cos(phi) * r2);
      }
      const crust = new THREE.Mesh(lathe, mat.crust);
      crust.castShadow = true;
      crust.receiveShadow = true;
      slice.add(crust);

      // cut faces
      for (const phi of [phi0, phi0 + dPhi]) {
        const shape = new THREE.Shape(CAP.map(([r, y]) => new THREE.Vector2(...rimDisplace(r, y, phi))));
        const capGeo = new THREE.ShapeGeometry(shape, 1);
        const cp = capGeo.attributes.position;
        const uv = capGeo.attributes.uv;
        for (let i = 0; i < cp.count; i++) uv.setXY(i, cp.getX(i) / 1.01, cp.getY(i) / 0.14);
        capGeo.rotateY(phi - Math.PI / 2);
        const cap = new THREE.Mesh(capGeo, mat.crumb);
        cap.receiveShadow = true;
        slice.add(cap);
      }

      // sauce + cheese sectors
      slice.add(this.sector(0.865, SAUCE_Y, phi0, dPhi, mat.sauce, 0.006, 3));
      slice.add(this.sector(0.805, CHEESE_Y, phi0, dPhi, mat.cheese, 0.03, 5));

      this.spinner.add(slice);
      this.slices.push(slice);
    }
  }

  sector(radius, y, phi0, dPhi, material, noiseAmp, seed) {
    const geo = new THREE.CircleGeometry(radius, 22, phi0 - Math.PI / 2, dPhi);
    const p = geo.attributes.position;
    for (let i = 1; i < p.count; i++) {
      const x = p.getX(i);
      const yy = p.getY(i);
      const th = Math.atan2(yy, x);
      const k = 1 + ringNoise(th, seed, noiseAmp) / radius;
      p.setXY(i, x * k, yy * k);
    }
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y, 0);
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    return mesh;
  }

  addSet(id, spec) {
    const set = new ToppingSet(this.kit, id, spec, this.sliceDirs);
    this.sets.set(id, set);
    this.spinner.add(set.group);
    return set;
  }

  update(t) {
    const e = this.explode;
    for (let k = 0; k < SLICES; k++) {
      const s = this.slices[k];
      s.position.copy(this.sliceDirs[k]).multiplyScalar(e * 0.24);
      s.position.y = e * 0.05;
    }
    this.sets.forEach((set) => set.update(t, e));
  }
}

/** Build a single loose topping mesh (used for decorative floating ingredients). */
export function makeLooseTopping(kit, type) {
  const mesh = new THREE.Mesh(kit.geo[type], toppingMaterial(kit, type));
  mesh.castShadow = false;
  return mesh;
}

export { SLICES };
