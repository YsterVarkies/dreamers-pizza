/**
 * Business details — edit here and the whole site updates.
 * Anything marked TODO wasn't in the supplied material, so it is hidden
 * on the site until it is filled in.
 */
export const SITE = {
  name: 'Dreamers Pizza',
  tagline: 'Dream Big. Dream Pizza.',
  phoneDisplay: '083 296 9805',
  phoneHref: 'tel:+27832969805',
  email: 'dreamerspizza10@gmail.com',
  // TODO: replace with the store's own Uber Eats link (this opens an Uber Eats search)
  uberEatsUrl: 'https://www.ubereats.com/za/search?q=Dreamers%20Pizza',
  // TODO: street address + Google Maps link (hidden while empty)
  address: '',
  mapsUrl: '',
  // TODO: social links (icons hidden while empty)
  socials: {
    facebook: '',
    instagram: '',
  },
  timeZone: 'Africa/Johannesburg',
};

/** 0 = Sunday … 6 = Saturday. Sunday isn't on the trading-hours flyer, so it shows as closed. */
export const HOURS = [
  { label: 'Monday – Thursday', short: 'Mon – Thu', days: [1, 2, 3, 4], open: '10:00', close: '19:00' },
  { label: 'Friday & Saturday', short: 'Fri & Sat', days: [5, 6], open: '10:00', close: '20:00' },
  { label: 'Sunday', short: 'Sun', days: [0], closed: true },
];

/** Prefix a public/ path with the deploy base (GitHub Pages serves from a sub-path). */
export const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\/+/, '');

export const IMAGES = {
  ovenHero: { base: asset('/images/oven-hero'), widths: [800, 1536], w: 1536, h: 1024 },
  storePlatter: { base: asset('/images/store-platter'), widths: [640, 1086], w: 1086, h: 1448 },
  dreamerUpgrade: { base: asset('/images/dreamer-upgrade'), widths: [640, 1149], w: 1149, h: 1369 },
  blueMonday: { base: asset('/images/blue-monday'), widths: [640, 1024], w: 1024, h: 1536 },
  menu: { base: asset('/images/menu'), widths: [720, 1264], w: 1264, h: 2048 },
  platterNew: { base: asset('/images/platter-new'), widths: [640, 1254], w: 1254, h: 1254 },
  tradingHours: { base: asset('/images/trading-hours'), widths: [640, 1254], w: 1254, h: 1254 },
  uberEats: { base: asset('/images/uber-eats'), widths: [640, 1254], w: 1254, h: 1254 },
};

export const srcSet = (img) => img.widths.map((w) => `${img.base}-${w}.webp ${w}w`).join(', ');
export const src = (img, i = img.widths.length - 1) => `${img.base}-${img.widths[i]}.webp`;
