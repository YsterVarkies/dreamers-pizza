import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { Pizza, makeLooseTopping } from './Pizza';
import { softDotTexture, asTexture } from './textures';
import { LINEUP } from '../data/pizzas';
import { damp, rng, hashString, clamp } from './util';

const CAM_Z = 12;
const FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/**
 * The Line-up: one pizza that swaps its toppings when you change pizza,
 * surrounded by floating ingredients (like the "ice cream slider" reference).
 */
export class LineupScene {
  constructor(canvas, { quality = 'high' } = {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.index = -1;
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.clock = new THREE.Clock();
    this.t = 0;
    this.running = false;
    this.spin = { v: 0 };
    this.entry = { v: 0 }; // 0..1 as the section scrolls into view

    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.6));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.setClearColor(0x000000, 0);

    const scene = (this.scene = new THREE.Scene());
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.32;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    this.camera.position.set(0, 0, CAM_Z);

    scene.add(new THREE.HemisphereLight('#fff6ea', '#5b2a18', 0.78));
    const key = (this.key = new THREE.DirectionalLight('#fff3e0', 2.15));
    key.castShadow = true;
    key.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight('#ffd6a0', 1.1);
    rim.position.set(-5, 4, -6);
    scene.add(rim);

    // soft contact shadow under the floating pizza
    const shadowMat = new THREE.MeshBasicMaterial({
      map: asTexture(softDotTexture()),
      color: '#000000',
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat);
    scene.add(this.blob);

    this.pizza = new Pizza({ quality });
    scene.add(this.pizza.root);
    this.sets = LINEUP.map((p) => this.pizza.addSet(p.id, p));

    // floating ingredients per pizza
    this.floaterGroups = LINEUP.map((p) => {
      const R = rng(hashString(`${p.id}-float`));
      const g = new THREE.Group();
      const n = p.floaters.length;
      const offset = R() * Math.PI;
      p.floaters.forEach((type, k) => {
        const mesh = makeLooseTopping(this.pizza.kit, type);
        const a = offset + (k / n) * Math.PI * 2 + (R() - 0.5) * 0.5;
        mesh.userData = {
          a,
          rad: 1.06 + R() * 0.26,
          z: (R() - 0.3) * 2.2,
          s: 1.5 + R() * 0.6,
          rot: new THREE.Euler(R() * 6, R() * 6, R() * 6),
          spin: new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.9),
          bob: R() * 6.28,
        };
        g.add(mesh);
      });
      g.userData = { presence: 0 };
      g.visible = false;
      scene.add(g);
      return g;
    });

    this.resize();
    this.renderThumbnails();
  }

  /** Place the pizza over a DOM anchor (so CSS controls the layout). */
  setAnchor(el) {
    this.anchor = el;
    this.layout();
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.layout();
  }

  layout() {
    if (!this.anchor || !this.w) return;
    const c = this.canvas.getBoundingClientRect();
    const a = this.anchor.getBoundingClientRect();
    const halfH = CAM_Z * TAN;
    const halfW = halfH * this.camera.aspect;
    const cx = (a.left + a.width / 2 - c.left) / c.width;
    const cy = (a.top + a.height / 2 - c.top) / c.height;
    this.center = new THREE.Vector3((cx * 2 - 1) * halfW, -(cy * 2 - 1) * halfH, 0);
    this.radius = (a.width / c.width) * halfW; // world radius of the pizza
    const ext = this.radius * 2.6;
    const sc = this.key.shadow.camera;
    sc.left = -ext;
    sc.right = ext;
    sc.top = ext;
    sc.bottom = -ext;
    sc.near = 0.5;
    sc.far = 30;
    sc.updateProjectionMatrix();
  }

  setPointer(nx, ny) {
    this.pointer.x = nx;
    this.pointer.y = ny;
  }

  /** Switch pizza with a spin + toppings flying off/on. */
  show(index, dir = 1, immediate = false) {
    if (index === this.index) return;
    const prev = this.index;
    this.index = index;
    const next = this.sets[index];
    const nextF = this.floaterGroups[index];

    if (prev >= 0) {
      const old = this.sets[prev];
      const oldF = this.floaterGroups[prev];
      gsap.killTweensOf([old, oldF.userData]);
      gsap.to(old, { presence: 0, duration: immediate ? 0 : 0.75, ease: 'power2.in' });
      gsap.to(old, { drizzleDraw: 0, duration: immediate ? 0 : 0.25 });
      gsap.to(oldF.userData, { presence: 0, duration: immediate ? 0 : 0.6, ease: 'power2.in' });
    }
    gsap.killTweensOf([next, nextF.userData, this.spin]);
    next.presence = 0;
    next.drizzleDraw = 0;
    nextF.userData.presence = 0;
    const d = immediate ? 0 : 1;
    gsap.to(this.spin, { v: this.spin.v + dir * Math.PI * 1.25, duration: 1.4 * d, ease: 'power3.inOut' });
    gsap.to(next, { presence: 1, duration: 1.25 * d, delay: 0.35 * d, ease: 'power2.out' });
    gsap.to(next, { drizzleDraw: 1, duration: 1.1 * d, delay: 1.25 * d, ease: 'power1.inOut' });
    gsap.to(nextF.userData, { presence: 1, duration: 1.1 * d, delay: 0.45 * d, ease: 'power3.out' });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      this.frame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.t += dt;
    const t = this.t;
    if (!this.center) this.layout();
    const ptr = this.pointer;
    ptr.sx = damp(ptr.sx, ptr.x, 3.5, dt);
    ptr.sy = damp(ptr.sy, ptr.y, 3.5, dt);

    const R = this.radius || 1;
    const C = this.center || new THREE.Vector3();
    const entry = this.entry.v;
    const root = this.pizza.root;
    const bob = Math.sin(t * 1.2) * R * 0.035;
    root.position.set(C.x, C.y + bob - (1 - entry) * R * 0.6, 0);
    root.scale.setScalar(R * (0.85 + 0.15 * entry));
    root.rotation.x = 1.02 + ptr.sy * 0.16 + (1 - entry) * 0.4;
    root.rotation.z = -ptr.sx * 0.14;
    this.pizza.spinner.rotation.y = this.spin.v + t * 0.12;
    this.pizza.update(t);

    // contact shadow
    this.blob.position.set(C.x, C.y - R * 0.98, -1.5);
    this.blob.scale.set(R * 2.4, R * 0.55, 1);
    this.blob.material.opacity = 0.32 * entry;

    this.key.position.set(C.x + 3, C.y + 6, 8);
    this.key.target.position.set(C.x, C.y, 0);

    // floaters
    this.floaterGroups.forEach((g) => {
      const pr = g.userData.presence;
      g.visible = pr > 0.002;
      if (!g.visible) return;
      g.children.forEach((m, k) => {
        const u = m.userData;
        const e = clamp(pr * 1.15 - k * 0.04);
        const rr = R * u.rad * (1 + (1 - e) * 0.9);
        m.position.set(
          C.x + Math.cos(u.a + t * 0.05) * rr * 1.1 + ptr.sx * u.z * 0.12,
          C.y + Math.sin(u.a + t * 0.05) * rr * 0.92 + Math.sin(t * 1.3 + u.bob) * R * 0.05,
          u.z,
        );
        m.rotation.set(u.rot.x + t * u.spin.x, u.rot.y + t * u.spin.y, u.rot.z + t * u.spin.z);
        m.scale.setScalar(R * u.s * e);
      });
    });

    this.renderer.render(this.scene, this.camera);
  }

  /** Render a top-down picture of every pizza for the thumbnails + menu previews. */
  renderThumbnails(size = 256) {
    const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    const cam = new THREE.OrthographicCamera(-1.06, 1.06, 1.06, -1.06, 0.1, 50);
    cam.position.set(0, 0, 10);
    const root = this.pizza.root;
    const saved = { p: root.position.clone(), s: root.scale.clone(), r: root.rotation.clone() };
    root.position.set(0, 0, 0);
    root.scale.setScalar(1);
    root.rotation.set(Math.PI / 2 - 0.0, 0, 0);
    this.blob.visible = false;
    this.key.position.set(2, 5, 9);
    this.key.target.position.set(0, 0, 0);

    const pixels = new Uint8Array(size * size * 4);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const out = {};
    this.sets.forEach((set, i) => {
      this.sets.forEach((s) => {
        s.presence = 0;
        s.drizzleDraw = 0;
        s._last = '';
      });
      set.presence = 1;
      set.drizzleDraw = 1;
      this.pizza.spinner.rotation.y = 0.4;
      this.pizza.update(0);
      this.renderer.setRenderTarget(rt);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.clear();
      this.renderer.render(this.scene, cam);
      this.renderer.readRenderTargetPixels(rt, 0, 0, size, size, pixels);
      const img = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        const src = (size - 1 - y) * size * 4;
        img.data.set(pixels.subarray(src, src + size * 4), y * size * 4);
      }
      ctx.putImageData(img, 0, 0);
      out[LINEUP[i].id] = canvas.toDataURL('image/webp', 0.86);
    });
    this.renderer.setRenderTarget(null);
    rt.dispose();
    this.sets.forEach((s) => {
      s.presence = 0;
      s.drizzleDraw = 0;
      s._last = '';
    });
    root.position.copy(saved.p);
    root.scale.copy(saved.s);
    root.rotation.copy(saved.r);
    this.blob.visible = true;
    this.thumbnails = out;
    return out;
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
  }
}
