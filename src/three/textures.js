import * as THREE from 'three';
import { rng } from './util';

/**
 * Hand-painted (procedural) canvas textures for the pizza and the sky world.
 * Everything is generated at runtime — no texture downloads.
 */

const cache = new Map();
const memo = (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
};

const makeCanvas = (w, h = w) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const toTexture = (canvas, { srgb = true, repeat = false, aniso = 4 } = {}) => {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
};

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Soft round blob using a radial gradient. */
function soft(ctx, x, y, r, hex, a = 1, hard = 0) {
  const g = ctx.createRadialGradient(x, y, r * hard, x, y, r);
  g.addColorStop(0, rgba(hex, a));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Irregular organic blob made of a few soft circles. */
function cluster(ctx, R, x, y, r, hex, a, n = 4, hard = 0.35) {
  for (let i = 0; i < n; i++) {
    const ang = R() * Math.PI * 2;
    const d = R() * r * 0.6;
    soft(ctx, x + Math.cos(ang) * d, y + Math.sin(ang) * d, r * (0.45 + R() * 0.55), hex, a, hard);
  }
}

function speckles(ctx, R, w, h, count, colors, sizeMin, sizeMax, alpha = 1) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = rgba(colors[(R() * colors.length) | 0], alpha * (0.5 + R() * 0.5));
    const s = sizeMin + R() * (sizeMax - sizeMin);
    ctx.save();
    ctx.translate(R() * w, R() * h);
    ctx.rotate(R() * Math.PI);
    ctx.fillRect(-s / 2, -s / 4, s, s / 2);
    ctx.restore();
  }
}

/* ---------------------------------- PIZZA ---------------------------------- */

export const cheeseTexture = (size = 1024) =>
  memo(`cheese${size}`, () => {
    const R = rng(11);
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const S = size / 1024;
    const cx = size / 2;

    // base: creamy centre, more golden toward the edge
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, '#fcd98a');
    g.addColorStop(0.5, '#f7c766');
    g.addColorStop(0.8, '#eea746');
    g.addColorStop(1, '#d98a32');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // tomato sauce peeking through
    for (let i = 0; i < 40; i++) {
      const a = R() * Math.PI * 2;
      const d = (0.35 + R() * 0.65) * cx * 0.95;
      cluster(ctx, R, cx + Math.cos(a) * d, cx + Math.sin(a) * d, (6 + R() * 18) * S, '#d4471f', 0.25 + R() * 0.25, 3);
    }
    // stretchy white mozzarella pools
    for (let i = 0; i < 90; i++) {
      cluster(ctx, R, R() * size, R() * size, (16 + R() * 40) * S, '#fff3cf', 0.22 + R() * 0.28, 4, 0.2);
    }
    // orange oil
    for (let i = 0; i < 110; i++) {
      soft(ctx, R() * size, R() * size, (6 + R() * 22) * S, '#ec9a2a', 0.25 + R() * 0.28);
    }
    // golden-brown baked spots (leopard)
    for (let i = 0; i < 360; i++) {
      const x = R() * size;
      const y = R() * size;
      const r = (3 + R() * 16) * S;
      soft(ctx, x, y, r * 1.8, '#d08a35', 0.35 + R() * 0.3, 0.2);
      soft(ctx, x, y, r, '#b8641f', 0.55 + R() * 0.35, 0.45);
      if (R() > 0.7) soft(ctx, x, y, r * 0.45, '#6e3510', 0.7, 0.5);
    }
    // little blisters / bubbles with highlights
    for (let i = 0; i < 70; i++) {
      const x = R() * size;
      const y = R() * size;
      const r = (4 + R() * 9) * S;
      soft(ctx, x + r * 0.3, y + r * 0.3, r, '#a8561a', 0.35, 0.3);
      soft(ctx, x - r * 0.25, y - r * 0.25, r * 0.6, '#fffaf0', 0.75, 0.2);
    }
    // oregano + pepper flecks
    speckles(ctx, R, size, size, 420, ['#4c5a1f', '#3e4a16', '#5b3a17', '#2f2a14'], 1.5 * S, 4.5 * S, 0.9);
    return c;
  });

export const sauceTexture = (size = 512) =>
  memo(`sauce${size}`, () => {
    const R = rng(23);
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const S = size / 512;
    ctx.fillStyle = '#c4321c';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 160; i++) cluster(ctx, R, R() * size, R() * size, (10 + R() * 30) * S, '#8f1e0f', 0.35, 3);
    for (let i = 0; i < 120; i++) cluster(ctx, R, R() * size, R() * size, (6 + R() * 16) * S, '#e5562c', 0.45, 3);
    speckles(ctx, R, size, size, 160, ['#3f4a17', '#5a6421'], 1.5 * S, 3.5 * S, 0.8);
    return c;
  });

/**
 * Crust texture for the lathe (u = around, v = along the profile, v=0 centre top, v=1 centre bottom).
 * `bands` maps v-ranges to colours.
 */
export const crustTexture = () =>
  memo('crust', () => {
    const W = 1024;
    const H = 512;
    const R = rng(7);
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    // canvas y=0 is v=1 (flipY), so paint bottom-up
    const g = ctx.createLinearGradient(0, H, 0, 0);
    g.addColorStop(0.0, '#e9c27a'); // under the sauce
    g.addColorStop(0.22, '#e5b569');
    g.addColorStop(0.3, '#d99b48'); // rim rises
    g.addColorStop(0.42, '#c97a2d'); // rim top, well baked
    g.addColorStop(0.55, '#bf722a');
    g.addColorStop(0.68, '#c98538'); // outer wall
    g.addColorStop(0.8, '#d9a35c'); // underside edge
    g.addColorStop(1.0, '#e2b36e'); // base
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const yOf = (v) => H - v * H;
    // charred leopard spots on the rim top
    for (let i = 0; i < 420; i++) {
      const v = 0.3 + R() * 0.32;
      const r = 1.5 + R() * 7;
      soft(ctx, R() * W, yOf(v), r * 1.6, '#8a4a1a', 0.35, 0.2);
      soft(ctx, R() * W, yOf(v), r, '#3f1d0a', 0.5 + R() * 0.4, 0.5);
    }
    // golden blisters with highlights
    for (let i = 0; i < 260; i++) {
      const x = R() * W;
      const y = yOf(0.28 + R() * 0.4);
      const r = 3 + R() * 9;
      soft(ctx, x, y, r, '#f0c27a', 0.55, 0.3);
      soft(ctx, x - r * 0.3, y - r * 0.3, r * 0.45, '#fff1c8', 0.6, 0.3);
    }
    // underside oven marks + flour dust
    for (let i = 0; i < 220; i++) {
      const y = yOf(0.75 + R() * 0.25);
      cluster(ctx, R, R() * W, y, 4 + R() * 14, '#8f5524', 0.35, 3);
    }
    speckles(ctx, R, W, H * 0.25, 900, ['#fff6e5', '#f5e6c8'], 1, 3, 0.8);
    return c;
  });

/** Cross-section where a slice was cut: bread crumb + sauce + cheese bands. */
export const crumbTexture = () =>
  memo('crumb', () => {
    const W = 512;
    const H = 128;
    const R = rng(31);
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#efcf93';
    ctx.fillRect(0, 0, W, H);
    // airy holes
    for (let i = 0; i < 260; i++) {
      const x = R() * W;
      const y = R() * H;
      const r = 1 + R() * 4.5;
      ctx.fillStyle = rgba('#b98a4b', 0.6);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.5, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // crust skin at the bottom (v small = bottom of canvas)
    const g = ctx.createLinearGradient(0, H, 0, H * 0.75);
    g.addColorStop(0, '#b06a2a');
    g.addColorStop(1, 'rgba(176,106,42,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return c;
  });

export const pepperoniTexture = () =>
  memo('pepperoni', () => {
    const S = 256;
    const R = rng(5);
    const c = makeCanvas(S);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, '#b3271d');
    g.addColorStop(0.62, '#a21f17');
    g.addColorStop(0.86, '#7a130d');
    g.addColorStop(0.95, '#4f0a06');
    g.addColorStop(1, '#3a0704');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) soft(ctx, R() * S, R() * S, 8 + R() * 16, '#6d0f0a', 0.4);
    for (let i = 0; i < 28; i++) {
      const a = R() * Math.PI * 2;
      const d = R() * S * 0.38;
      ctx.fillStyle = rgba(R() > 0.5 ? '#e59a88' : '#d9826f', 0.75);
      ctx.beginPath();
      ctx.ellipse(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, 1.5 + R() * 3.5, 1 + R() * 2, R() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // crispy darker rim + a little oil
    for (let i = 0; i < 40; i++) {
      const a = R() * Math.PI * 2;
      soft(ctx, S / 2 + Math.cos(a) * S * 0.45, S / 2 + Math.sin(a) * S * 0.45, 8 + R() * 10, '#2e0503', 0.45);
    }
    soft(ctx, S * 0.4, S * 0.38, S * 0.16, '#e0573f', 0.18);
    return c;
  });

export const basilTexture = () =>
  memo('basil', () => {
    const W = 128;
    const H = 256;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#1f5a1d');
    g.addColorStop(0.5, '#3f8f2e');
    g.addColorStop(1, '#1f5a1d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(160,210,120,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 7; i++) {
      const y = (i / 7) * H;
      ctx.beginPath();
      ctx.moveTo(W / 2, y);
      ctx.quadraticCurveTo(W * 0.3, y - 14, 4, y - 28);
      ctx.moveTo(W / 2, y);
      ctx.quadraticCurveTo(W * 0.7, y - 14, W - 4, y - 28);
      ctx.stroke();
    }
    return c;
  });

export const mushroomTexture = () =>
  memo('mushroom', () => {
    const S = 256;
    const R = rng(17);
    const c = makeCanvas(S);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ecd9bb';
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) soft(ctx, R() * S, R() * S, 8 + R() * 20, '#d8bf98', 0.5);
    // dark skin around the cap edge (top of the texture)
    const g = ctx.createLinearGradient(0, 0, 0, S * 0.35);
    g.addColorStop(0, '#6d4a2b');
    g.addColorStop(0.35, '#9b7550');
    g.addColorStop(1, 'rgba(155,117,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    // gills
    ctx.strokeStyle = 'rgba(150,110,70,0.35)';
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.moveTo(S / 2, S * 0.5);
      ctx.lineTo((i / 23) * S, S * 0.12);
      ctx.stroke();
    }
    return c;
  });

export const tomatoTexture = () =>
  memo('tomato', () => {
    const S = 256;
    const c = makeCanvas(S);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#c81f12';
    ctx.fillRect(0, 0, S, S);
    soft(ctx, S / 2, S / 2, S * 0.47, '#e2422b', 1, 0.85);
    // gel chambers with seeds
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.4;
      const x = S / 2 + Math.cos(a) * S * 0.2;
      const y = S / 2 + Math.sin(a) * S * 0.2;
      soft(ctx, x, y, S * 0.17, '#f27a5f', 0.95, 0.6);
      for (let s = 0; s < 6; s++) {
        ctx.fillStyle = '#f7d77a';
        ctx.beginPath();
        ctx.ellipse(x + (Math.random() - 0.5) * S * 0.16, y + (Math.random() - 0.5) * S * 0.16, 5, 3, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    soft(ctx, S / 2, S / 2, S * 0.08, '#f3a08a', 0.9);
    return c;
  });

export const baconTexture = () =>
  memo('bacon', () => {
    const W = 64;
    const H = 32;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const stops = ['#7a1d12', '#b8432f', '#f2c9b2', '#a9372a', '#e9b39a', '#8a2516', '#6d180f'];
    stops.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, (i / stops.length) * H, W, H / stops.length + 1);
    });
    return c;
  });

/* ---------------------------------- SKY ---------------------------------- */

/** One fluffy cloud puff — combined into cumulus clusters in the scene. */
export const cloudPuffTexture = () =>
  memo('puff', () => {
    const S = 256;
    const R = rng(3);
    const c = makeCanvas(S);
    const ctx = c.getContext('2d');
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2;
      const d = Math.sqrt(R()) * S * 0.24;
      const x = S / 2 + Math.cos(a) * d;
      const y = S / 2 + Math.sin(a) * d * 0.85;
      soft(ctx, x, y, S * (0.14 + R() * 0.16), '#ffffff', 0.55, 0.35);
    }
    soft(ctx, S / 2, S / 2, S * 0.32, '#ffffff', 0.6, 0.5);
    // fade edges to zero
    ctx.globalCompositeOperation = 'destination-in';
    const m = ctx.createRadialGradient(S / 2, S / 2, S * 0.28, S / 2, S / 2, S / 2);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = m;
    ctx.fillRect(0, 0, S, S);
    return c;
  });

export const softDotTexture = () =>
  memo('dot', () => {
    const S = 64;
    const c = makeCanvas(S);
    const ctx = c.getContext('2d');
    soft(ctx, S / 2, S / 2, S / 2, '#ffffff', 1, 0.15);
    return c;
  });

export const skyTexture = () =>
  memo('sky', () => {
    const W = 8;
    const H = 1024;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.0, '#2f78a8');
    g.addColorStop(0.3, '#4a92bc');
    g.addColorStop(0.55, '#6aaecb');
    g.addColorStop(0.75, '#96cadb');
    g.addColorStop(0.9, '#c7e4ea');
    g.addColorStop(1.0, '#e7f1e6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return c;
  });

/** Painterly meadow: grass greens + lots of tiny yellow wildflowers (Sky Cookie's field). */
export const meadowTexture = (variant = 0) =>
  memo(`meadow${variant}`, () => {
    const W = 2048;
    const H = 512;
    const R = rng(41 + variant);
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const tones =
      variant === 0
        ? ['#77a83c', '#5b8f2e', '#3e6f22']
        : variant === 1
          ? ['#7fa86a', '#5f8d52', '#4a7545']
          : ['#9cbcb0', '#86aa9f', '#729789'];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, tones[0]);
    g.addColorStop(0.45, tones[1]);
    g.addColorStop(1, tones[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // soft colour variation
    for (let i = 0; i < 220; i++) cluster(ctx, R, R() * W, R() * H, 20 + R() * 60, R() > 0.5 ? tones[0] : tones[2], 0.25, 3);
    if (variant === 0) {
      // grass strokes
      ctx.lineCap = 'round';
      for (let i = 0; i < 2600; i++) {
        const x = R() * W;
        const y = R() * H;
        const len = 6 + R() * 16 * (0.4 + y / H);
        ctx.strokeStyle = rgba(R() > 0.5 ? '#9cc451' : '#3f7023', 0.55);
        ctx.lineWidth = 1 + R() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (R() - 0.5) * 6, y - len);
        ctx.stroke();
      }
      // wildflowers — denser and bigger toward the front (bottom)
      for (let i = 0; i < 5200; i++) {
        const y = Math.pow(R(), 0.7) * H;
        const x = R() * W;
        const s = 1 + (y / H) * 4.2 * (0.5 + R());
        const col = R() > 0.12 ? (R() > 0.4 ? '#ffd83b' : '#f7c21a') : '#fff6dc';
        soft(ctx, x, y, s, col, 0.95, 0.55);
      }
    } else if (variant === 1) {
      for (let i = 0; i < 900; i++) soft(ctx, R() * W, R() * H, 1 + R() * 2, '#e8d75a', 0.6, 0.5);
    }
    return c;
  });

export const asTexture = (canvas, opts) => toTexture(canvas, opts);
