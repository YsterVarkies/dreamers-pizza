/**
 * Generates web-ready assets from the original files in /Images.
 *   npm run images
 *
 * - Photos/flyers  -> public/images/<name>-<w>.webp (responsive sizes) + og image
 * - Logo.jpg       -> transparent PNG lockups for light & dark/sky backgrounds
 */
import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'Images');
const OUT_IMG = path.join(root, 'public', 'images');
const OUT_BRAND = path.join(root, 'public', 'brand');

const photos = [
  { file: 'Fancy_Logo_Image.jpg', name: 'oven-hero', widths: [800, 1536] },
  { file: '828840402_122128432988914282_4765342213694683884_n.jpg', name: 'store-platter', widths: [640, 1086] },
  { file: '727346456_122115532460914282_1963141470930902445_n.jpg', name: 'dreamer-upgrade', widths: [640, 1149] },
  { file: 'Blue Monday Specials.jpg', name: 'blue-monday', widths: [640, 1024] },
  { file: 'Menu.jpg', name: 'menu', widths: [720, 1264] },
  { file: 'new_menu_alert.jpg', name: 'platter-new', widths: [640, 1254] },
  { file: 'Trading_Hours.jpg', name: 'trading-hours', widths: [640, 1254] },
  { file: 'Uber Eats.jpg', name: 'uber-eats', widths: [640, 1254] },
];

async function photosToWebp() {
  await mkdir(OUT_IMG, { recursive: true });
  for (const p of photos) {
    const input = path.join(SRC, p.file);
    for (const w of p.widths) {
      await sharp(input)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toFile(path.join(OUT_IMG, `${p.name}-${w}.webp`));
    }
    console.log('✓', p.name);
  }
  // Printed menu for download (original quality)
  await copyFile(path.join(SRC, 'Menu.jpg'), path.join(OUT_IMG, 'dreamers-pizza-menu.jpg'));
  // Open Graph share image
  await sharp(path.join(SRC, 'Fancy_Logo_Image.jpg'))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT_IMG, 'og-dreamers-pizza.jpg'));
  console.log('✓ og image + menu download');
}

/**
 * Colour-to-alpha against white (same idea as GIMP's "colour to alpha"),
 * then optionally recolour the black script/tagline for dark backgrounds.
 */
async function logo() {
  await mkdir(OUT_BRAND, { recursive: true });
  const { data, info } = await sharp(path.join(SRC, 'Logo.jpg'))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  // Layout measured from the source file (853x1280)
  const SCRIPT_TOP = 540; // first row of the "Dreamers" script (below = wordmark)
  const crops = {
    full: { left: 88, top: 270, width: 690, height: 516 }, // incl. tagline
    lockup: { left: 88, top: 270, width: 690, height: 468 }, // icon + Dreamers + PIZZA
  };

  const variants = {
    color: () => null,
    // white script + tagline, PIZZA stays brand red
    light: (r, g, b, y) => (y >= SCRIPT_TOP && isInk(r, g, b) ? [255, 251, 244] : null),
    // everything in the wordmark white (icon untouched)
    white: (r, g, b, y) =>
      (y >= SCRIPT_TOP && isInk(r, g, b)) || y > 684 ? [255, 251, 244] : null,
  };

  for (const [vName, recolor] of Object.entries(variants)) {
    const out = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * C;
        const o = (y * W + x) * 4;
        let r = data[i], g = data[i + 1], b = data[i + 2];
        let a = Math.max(255 - r, 255 - g, 255 - b) / 255;
        if (a < 0.07) a = 0; // drop JPEG noise in the white background
        if (a > 0) {
          r = clamp(255 - (255 - r) / a);
          g = clamp(255 - (255 - g) / a);
          b = clamp(255 - (255 - b) / a);
          const rc = recolor(r, g, b, y);
          if (rc) [r, g, b] = rc;
        }
        out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = Math.round(a * 255);
      }
    }
    for (const [cName, crop] of Object.entries(crops)) {
      const base = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
        .extract(crop)
        .png()
        .toBuffer();
      await sharp(base)
        .webp({ quality: 86, alphaQuality: 90, effort: 6 })
        .toFile(path.join(OUT_BRAND, `logo-${cName}-${vName}.webp`));
      await sharp(base)
        .resize({ width: 360 })
        .webp({ quality: 86, alphaQuality: 90, effort: 6 })
        .toFile(path.join(OUT_BRAND, `logo-${cName}-${vName}-sm.webp`));
    }
    console.log('✓ logo', vName);
  }
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const isInk = (r, g, b) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max < 120 && max - min < 60;
};
const isRed = (r, g, b) => r > 120 && g < 110 && b < 110;

await photosToWebp();
await logo();
console.log('Done.');
