import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, scrollToTarget, prefersReducedMotion } from '../lib/smoothScroll';
import { HeroScene } from '../three/HeroScene';
import { LINEUP } from '../data/pizzas';
import { SITE } from '../data/site';
import { IconArrowRight, IconLeaf, IconCheese, IconTomato, IconFlame, IconBag } from './Icons';
import './Hero.css';

const CHIPS = [
  { pos: 'tl', icon: IconLeaf, label: 'Fresh ingredients' },
  { pos: 'tr', icon: IconCheese, label: 'Melty mozzarella' },
  { pos: 'bl', icon: IconTomato, label: 'Rich tomato base' },
  { pos: 'br', icon: IconFlame, label: 'Big flavour' },
];

export default function Hero({ ready, onSceneReady }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const proxy = useRef({ p: 0 });

  /* ---------------- 3D scene ---------------- */
  useEffect(() => {
    const small = window.innerWidth < 760;
    const quality = small || (navigator.hardwareConcurrency || 8) <= 4 ? 'low' : 'high';
    let scene;
    // give the preloader a frame to paint before the heavy texture work
    const id = requestAnimationFrame(() => {
      try {
        scene = new HeroScene(canvasRef.current, { quality });
        scene.progress = proxy.current.p;
        sceneRef.current = scene;
        scene.start();
      } catch (err) {
        console.warn('WebGL unavailable, showing the static hero.', err);
        rootRef.current?.classList.add('hero--static');
      }
      onSceneReady?.();
    });

    const onResize = () => sceneRef.current?.resize();
    const onMove = (e) =>
      sceneRef.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        const s = sceneRef.current;
        if (!s) return;
        entry.isIntersecting ? s.start() : s.stop();
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(stageRef.current);

    return () => {
      cancelAnimationFrame(id);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [onSceneReady]);

  /* ---------------- scroll timeline ---------------- */
  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(rootRef);
      const lines = q('.hero__line');
      const split = new SplitText(lines, { type: 'chars', charsClass: 'hero__char' });
      const split2 = new SplitText(q('.hero__title2, .hero__title3'), { type: 'chars', charsClass: 'hero__char' });
      rootRef.current.__split = split;

      if (reduce) {
        // no scroll sequence: keep only the opening state on screen
        gsap.set(q('.hero__title2, .hero__title3, .hero__chip, .hero__fade'), { autoAlpha: 0 });
        return;
      }

      const mobile = window.innerWidth < 760;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: mobile ? '+=260%' : '+=320%',
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(proxy.current, {
        p: 1,
        duration: 1,
        onUpdate: () => {
          if (sceneRef.current) sceneRef.current.progress = proxy.current.p;
        },
      }, 0);

      // 1 — the headline letters scatter into the sky
      const rnd = gsap.utils.random;
      tl.to(split.chars, {
        x: () => rnd(-220, 220),
        y: () => rnd(-520, -180),
        rotation: () => rnd(-110, 110),
        scale: () => rnd(0.6, 1.3),
        duration: 0.18,
        ease: 'power2.in',
        stagger: { each: 0.004, from: 'center' },
      }, 0.015);
      tl.to(lines, { opacity: 0, duration: 0.06 }, 0.15);
      tl.to(q('.hero__intro, .hero__promo, .hero__scrollhint'), { y: 40, opacity: 0, duration: 0.07, ease: 'power2.in' }, 0);

      // 2 — "Made With Love" rises up out of the meadow
      const t2 = split2.chars.filter((c) => c.closest('.hero__title2'));
      const t3 = split2.chars.filter((c) => c.closest('.hero__title3'));
      tl.fromTo(t2, { yPercent: 140, rotation: () => rnd(-25, 25), opacity: 0 }, {
        yPercent: 0, rotation: 0, opacity: 1, duration: 0.1, ease: 'back.out(1.6)', stagger: { each: 0.006, from: 'random' },
      }, 0.27);

      // 3 — ingredient callouts around the exploded pizza
      const chips = q('.hero__chip');
      tl.fromTo(chips, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.05, ease: 'back.out(2)', stagger: 0.02 }, 0.34);
      tl.fromTo(q('.hero__chip-label'), { clipPath: 'inset(0 100% 0 0 round 10px)' }, {
        clipPath: 'inset(0 0% 0 0 round 10px)', duration: 0.06, stagger: 0.02, ease: 'power2.out',
      }, 0.38);
      tl.to(chips, { scale: 0.6, opacity: 0, duration: 0.05, stagger: 0.015, ease: 'power2.in' }, 0.6);
      tl.to(t2, { yPercent: -120, opacity: 0, duration: 0.07, stagger: { each: 0.004, from: 'random' }, ease: 'power2.in' }, 0.66);

      // 4 — "Pick Your Dream", then dive into the pizza
      tl.fromTo(t3, { yPercent: 130, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.08, stagger: 0.005, ease: 'back.out(1.6)' }, 0.73);
      tl.to(t3, { scale: 1.6, opacity: 0, duration: 0.08, stagger: 0.003, ease: 'power2.in' }, 0.86);
      tl.to(q('.hero__fade'), { opacity: 1, duration: 0.08 }, 0.915);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* ---------------- intro (after the preloader) ---------------- */
  useEffect(() => {
    if (!ready) return;
    const q = gsap.utils.selector(rootRef);
    const chars = q('.hero__line .hero__char');
    const tl = gsap.timeline();
    if (sceneRef.current) tl.to(sceneRef.current, { intro: 1, duration: 2.6, ease: 'power2.out' }, 0);
    else tl.add(() => {}, 0);
    tl.fromTo(chars, { yPercent: 115, opacity: 0, rotation: 6 }, {
      yPercent: 0, opacity: 1, rotation: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.035,
    }, 0.2);
    tl.fromTo(q('.hero__intro > *, .hero__promo, .hero__scrollhint'), { y: 26, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, clearProps: 'transform',
    }, 0.75);
    return () => tl.kill();
  }, [ready]);

  const go = (e, target) => {
    e.preventDefault();
    scrollToTarget(target);
  };

  return (
    <section className="hero" id="top" ref={rootRef} aria-label="Dreamers Pizza — Dream Big. Dream Pizza.">
      <div className="hero__stage" ref={stageRef}>
        <div className="hero__fallback" aria-hidden="true" />
        <canvas className="hero__canvas" ref={canvasRef} aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <h1 className="hero__title display display--shadow">
          <span className="hero__line hero__line--1">Dream Big.</span>
          <span className="hero__line hero__line--2">Dream Pizza.</span>
        </h1>

        <div className="hero__intro">
          <p className="lead">
            Classic &amp; signature pizzas, loaded subs, sticky wings and cheesy fries — made fresh, made with love.
          </p>
          <div className="hero__ctas">
            <a className="btn btn--dark" href="#lineup" onClick={(e) => go(e, '#lineup')}>
              See the pizzas <IconArrowRight />
            </a>
            <a className="btn btn--glass" href={SITE.uberEatsUrl} target="_blank" rel="noopener noreferrer">
              <IconBag /> Order on Uber Eats
            </a>
          </div>
        </div>

        <a className="hero__promo" href="#specials" onClick={(e) => go(e, '#specials')}>
          <span className="hero__promo-stat display">R199</span>
          <svg className="hero__promo-line" viewBox="0 0 289 138" fill="none" aria-hidden="true">
            <path
              d="M22.5 48.7c17.3 0 26.8 6.2 40.7 20.6 13.8 14.3 23.4 41.2 40.6 41.2 17.3 0 26.9-26.2 40.7-51.2 13.8-25 23.4-39.7 40.7-39.7s23.4 38.1 40.6 38.1c17.3 0 23.4-38.2 40.7-38.2"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <span className="hero__promo-title">Blue Monday</span>
          <span className="hero__promo-sub">Any 2 classic pizzas · Mondays only</span>
        </a>

        <div className="hero__scrollhint" aria-hidden="true">
          <span className="hero__mouse"><span /></span>
          Scroll to dream
        </div>

        <h2 className="hero__title2 display display--shadow">Made With Love</h2>
        <ul className="hero__chips" aria-label="What goes into every pizza">
          {CHIPS.map(({ pos, icon: Icon, label }) => (
            <li key={pos} className={`hero__chip hero__chip--${pos}`}>
              <span className="chip-icon"><Icon /></span>
              <span className="hero__chip-label pill pill--glass">{label}</span>
            </li>
          ))}
        </ul>
        <p className="hero__title3 display display--shadow" aria-hidden="true">Pick Your Dream</p>

        <div className="hero__fade" style={{ background: LINEUP[0].theme.bg }} aria-hidden="true" />
      </div>
    </section>
  );
}

export { ScrollTrigger };
