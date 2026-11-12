# Dreamers Pizza — website

*Dream Big. Dream Pizza.*

A single-page site for Dreamers Pizza. It's built with React + Vite, Three.js, GSAP (ScrollTrigger, SplitText and Flip), Lenis smooth scrolling and React Bits components. The design direction comes from the MotionSites **Sky Cookie** design.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the build locally
```

If you replace anything in `/Images`, run `npm run images`. It regenerates the optimised WebP files and the transparent logos in `public/`.

## What's on the page

| Section | What it does | Images used |
|---|---|---|
| Hero | A procedural 3D pizza floats in a sky world. As you scroll, the headline letters scatter, the pizza flips, the camera drops to a wildflower meadow, the pizza splits into an exploded "Made With Love" ingredient view, and finally the camera dives into the pizza. | — (fully 3D) |
| The Line-up | A slider covering all 9 pizzas. Each pizza swaps its own 3D toppings and gets its own colour, background word and floating ingredients. Thumbnails are rendered from the 3D scene. | — |
| Blue Monday | Any 2 classic pizzas for R199. Shows a live "next Blue Monday" status, a tilted flyer and a spinning sticker. | `Blue Monday Specials.jpg` |
| What's New | Lit sandstone niches. Tapping one zooms the camera into it. | `new_menu_alert.jpg`, `727346456_….jpg`, `Uber Eats.jpg` |
| Menu | The full menu, laid out like the printed one. Includes Dream Deals cards, 3D hover previews, and view/download for the printed menu. | `Menu.jpg` |
| Our Story | Scroll-revealed copy, polaroid photos and stats. | `Fancy_Logo_Image.jpg`, `828840402_….jpg` |
| Hours & Order | A live alarm clock shows the shop's time (South Africa), with open/closed status, the hours table and call / Uber Eats / email cards. | `Trading_Hours.jpg` |
| Footer | A night sky with a curved marquee. | `Logo.jpg` (processed) |

The sky changes as you scroll down: day in the hero, golden hour at Hours, night in the footer.

## Editing content

- **Business details** (phone, email, Uber Eats link, address, socials, hours) live in `src/data/site.js`.
- **Menu and prices** live in `src/data/menu.js`.
- **3D line-up** (description, prices, colours, toppings per pizza) lives in `src/data/pizzas.js`.

### Still needed from the client

These weren't in the supplied material. Anything empty stays hidden on the site until it's filled in.

- [ ] **Uber Eats store link.** It currently opens an Uber Eats search for "Dreamers Pizza".
- [ ] **Street address and Google Maps link.** Once added, an address line appears in Hours.
- [ ] **Facebook / Instagram URLs.** Once added, icons appear in the nav and footer.
- [ ] **Sunday hours.** The flyer only lists Mon–Sat, so the site shows Sunday as closed.
- [ ] **Dreamers Platter price** (optional). It isn't on the menu yet.

## Structure

```
src/
  three/        HeroScene, LineupScene, Pizza (procedural pizza + toppings), SkyWorld, textures
  components/   one component (+ CSS) per section; reactbits/ = React Bits components
  data/         site details, menu, line-up
  lib/          smooth scroll (Lenis + GSAP), shop-hours logic, tiny store/event bus
scripts/        optimize-images.mjs (sharp)
```

## Credits

- Design direction: MotionSites **Sky Cookie**.
- Components from [React Bits](https://reactbits.dev): SplitText, ScrollVelocity, CurvedLoop, CircularText, CountUp, TiltedCard, SpotlightCard, ScrollReveal, Magnet, ClickSpark.
- Fonts: Bricolage Grotesque, Manrope and Caveat (self-hosted via Fontsource).
