import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Pizza } from './Pizza';
import { SkyWorld, CAM_Z, FOV, DESCENT, halfH } from './SkyWorld';
import { HERO_PIZZA } from '../data/pizzas';
import { clamp, damp, easeInOutCubic, smoothstep, lerp } from './util';

/**
 * Hero: a big 3D pizza floating in a dreamy sky.
 * Scroll progress (0..1) drives: flip → descent to the meadow → exploded "ingredients" view
 * → re-assemble → dive into the pizza.
 */
export class HeroScene {
  constructor(canvas, { quality = 'high', onReady } = {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.progress = 0; // scroll timeline progress
    this.intro = 0; // load-in animation
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.running = false;
    this.clock = new THREE.Clock();
    this.t = 0;

    const r = (this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.6));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 0.96;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.setClearColor('#8fc4da', 1);

    const scene = (this.scene = new THREE.Scene());
    scene.fog = new THREE.Fog('#a9d3e1', 26, 80);
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.3;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    this.camera.position.set(0, 0, CAM_Z);

    // light
    scene.add(new THREE.HemisphereLight('#e3f1ff', '#a3906b', 0.85));
    const sun = (this.sun = new THREE.DirectionalLight('#fff0d4', 2.2));
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight('#ffd7ad', 0.55);
    fill.position.set(-6, -2, 6);
    scene.add(fill);

    // world + pizza
    this.world = new SkyWorld({ quality });
    scene.add(this.world.group);

    this.pizza = new Pizza({ quality });
    this.set = this.pizza.addSet(HERO_PIZZA.id, HERO_PIZZA);
    scene.add(this.pizza.root);

    this.resize();
    this.renderer.compile(scene, this.camera);
    onReady?.();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.world.layout(this.camera.aspect);

    // pizza size: ~52% of the viewport height on desktop, ~84% of the width on phones
    const visH = halfH(0) * 2;
    const visW = visH * this.camera.aspect;
    const portrait = w < 760; // keep in sync with Hero.css (--pz / --pz-y)
    this.pizzaScale = Math.min(visH * (portrait ? 0.4 : 0.52), visW * (portrait ? 0.84 : 0.5)) / 2;
    this.portrait = portrait;
    this.visH = visH;

    const s = this.sun.shadow.camera;
    const ext = this.pizzaScale * 2.4;
    s.left = -ext;
    s.right = ext;
    s.top = ext;
    s.bottom = -ext;
    s.near = 0.5;
    s.far = 30;
    s.updateProjectionMatrix();
  }

  setPointer(nx, ny) {
    this.pointer.x = nx;
    this.pointer.y = ny;
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
    const p = this.progress;
    const intro = this.intro;

    const ptr = this.pointer;
    ptr.sx = damp(ptr.sx, ptr.x, 4, dt);
    ptr.sy = damp(ptr.sy, ptr.y, 4, dt);

    // ---- timeline phases ---------------------------------------------------
    const descent = easeInOutCubic(smoothstep(0.03, 0.62, p));
    const flip = easeInOutCubic(smoothstep(0.04, 0.3, p));
    const lift = smoothstep(0.3, 0.45, p) * (1 - smoothstep(0.6, 0.73, p));
    const dive = smoothstep(0.78, 0.985, p);
    const diveE = dive * dive * dive;

    // camera
    const cam = this.camera;
    cam.position.x = ptr.sx * 0.35;
    cam.position.y = -DESCENT * descent - ptr.sy * 0.25;
    cam.position.z = CAM_Z;
    cam.lookAt(ptr.sx * 0.1, cam.position.y - ptr.sy * 0.1, 0);

    // pizza
    const root = this.pizza.root;
    const introE = easeInOutCubic(clamp(intro));
    const bob = Math.sin(t * 1.1) * 0.06 * (1 - dive);
    const yOffset = this.portrait ? 0.05 : -0.12; // pizza centre at 47.5% (phone) / 56% (desktop) of the screen
    root.position.set(
      lerp(0, 0, dive),
      cam.position.y + yOffset * this.visH * 0.5 + bob - (1 - introE) * 1.2 - lift * 0.1,
      lerp(0, CAM_Z - 1.15, diveE) - (1 - introE) * 2,
    );
    const scale = this.pizzaScale * (0.72 + 0.28 * introE) * (1 - lift * (this.portrait ? 0.18 : 0.12));
    root.scale.setScalar(scale);

    const baseTilt = 1.12 + Math.sin(t * 0.7) * 0.03;
    const faceOn = Math.PI / 2;
    let rotX = baseTilt + flip * Math.PI * 2;
    rotX = lerp(rotX, faceOn - 0.12, lift * 0.85);
    rotX = lerp(rotX, faceOn, dive);
    root.rotation.x = rotX + ptr.sy * 0.12 * (1 - dive);
    root.rotation.z = -ptr.sx * 0.12 * (1 - dive) + Math.sin(t * 0.5) * 0.02;
    root.rotation.y = 0;
    this.pizza.spinner.rotation.y = t * 0.16 + flip * 0.9 - (1 - introE) * 2.2;

    // toppings rain in on load, lift into an exploded view mid-scroll
    this.set.presence = smoothstep(0.25, 1, intro);
    this.set.lift = lift;
    this.pizza.explode = lift * 0.75;
    this.pizza.update(t);

    // sun follows the pizza so the shadows stay crisp
    this.sun.position.set(root.position.x + 4, root.position.y + 7, root.position.z + 8);
    this.sun.target.position.copy(root.position);

    this.world.update(t, dt);
    this.renderer.render(this.scene, cam);
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
  }
}
