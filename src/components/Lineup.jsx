import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../lib/smoothScroll';
import { LineupScene } from '../three/LineupScene';
import { LINEUP } from '../data/pizzas';
import { SITE } from '../data/site';
import { formatRand } from '../data/menu';
import { setStore, on } from '../lib/store';
import { IconArrowLeft, IconArrowRight, IconBag, IconPhone } from './Icons';
import './Lineup.css';

const AUTOPLAY_MS = 7000;
const pad = (n) => String(n).padStart(2, '0');

export default function Lineup() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const anchorRef = useRef(null);
  const sceneRef = useRef(null);
  const infoRef = useRef(null);
  const wordRef = useRef(null);
  const [shown, setShown] = useState(0); // what the text currently shows
  const [target, setTarget] = useState(0); // what was picked (thumbs/dots react instantly)
  const [thumbs, setThumbs] = useState({});
  const [playing, setPlaying] = useState(true);
  const state = useRef({ target: 0, busy: false, entered: false, inView: false, dir: 1 });
  const timer = useRef(null);

  const p = LINEUP[shown];

  /* ---------------- 3D scene ---------------- */
  useEffect(() => {
    const quality = window.innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4 ? 'low' : 'high';
    let scene;
    try {
      scene = new LineupScene(canvasRef.current, { quality });
    } catch (err) {
      console.warn('WebGL unavailable for the line-up.', err);
      sectionRef.current?.classList.add('lineup--static');
      return undefined;
    }
    sceneRef.current = scene;
    scene.setAnchor(anchorRef.current);
    setThumbs(scene.thumbnails);
    setStore('thumbs', scene.thumbnails);

    const ro = new ResizeObserver(() => scene.resize());
    ro.observe(sectionRef.current);
    const onMove = (e) => scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener('pointermove', onMove, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        state.current.inView = entry.isIntersecting;
        entry.isIntersecting ? scene.start() : scene.stop();
      },
      { rootMargin: '80px 0px' },
    );
    io.observe(sectionRef.current);

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 92%',
      end: 'top 20%',
      scrub: 0.6,
      onUpdate: (self) => (scene.entry.v = self.progress),
      onEnter: () => {
        if (!state.current.entered) {
          state.current.entered = true;
          scene.show(state.current.target, 1);
        }
      },
    });
    if (prefersReducedMotion()) {
      scene.entry.v = 1;
      state.current.entered = true;
      scene.show(0, 1, true);
    }

    return () => {
      st.kill();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  /* ---------------- switching ---------------- */
  const goTo = useCallback((i, dir) => {
    const s = state.current;
    const n = LINEUP.length;
    const next = ((i % n) + n) % n;
    if (next === s.target) return;
    s.dir = dir ?? (next > s.target ? 1 : -1);
    s.target = next;
    setTarget(next);
    if (s.entered) sceneRef.current?.show(next, s.dir);

    // theme colours
    const t = LINEUP[next].theme;
    gsap.to(sectionRef.current, { '--bg': t.bg, '--deep': t.deep, '--accent': t.accent, duration: 1.1, ease: 'power2.inOut' });

    // text out → swap → in
    const info = infoRef.current;
    gsap.killTweensOf([info.children, wordRef.current]);
    gsap.to(wordRef.current, { xPercent: -8 * s.dir, opacity: 0, filter: 'blur(10px)', duration: 0.4, ease: 'power2.in' });
    gsap.to(info.children, {
      y: -18,
      opacity: 0,
      duration: 0.3,
      stagger: 0.03,
      ease: 'power2.in',
      onComplete: () => setShown(state.current.target),
    });
  }, []);

  // animate the new text in
  useLayoutEffect(() => {
    const info = infoRef.current;
    const dir = state.current.dir;
    // the <h2> is re-keyed on every change, so SplitText never touches a node React still owns
    const name = info.querySelector('.lineup__name');
    const split = new SplitText(name, { type: 'words,chars', wordsClass: 'lineup__word-wrap', charsClass: 'lineup__char' });
    const tl = gsap.timeline();
    tl.fromTo(wordRef.current, { xPercent: 8 * dir, opacity: 0, filter: 'blur(10px)' }, { xPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' }, 0);
    tl.fromTo(info.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out' }, 0.05);
    tl.fromTo(split.chars, { yPercent: 100, rotate: 8 * dir, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.7, stagger: 0.025, ease: 'back.out(1.6)' }, 0.1);
    return () => tl.kill();
  }, [shown]);

  /* ---------------- autoplay ---------------- */
  useEffect(() => {
    clearInterval(timer.current);
    if (!playing || prefersReducedMotion()) return undefined;
    timer.current = setInterval(() => {
      if (state.current.inView && document.visibilityState === 'visible') goTo(state.current.target + 1, 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer.current);
  }, [playing, goTo]);

  const userGo = (i, dir) => {
    setPlaying(false);
    goTo(i, dir);
  };

  /* ---------------- keyboard + swipe + external requests ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      if (!state.current.inView || e.target.closest?.('input, textarea')) return;
      if (e.key === 'ArrowRight') userGo(state.current.target + 1, 1);
      if (e.key === 'ArrowLeft') userGo(state.current.target - 1, -1);
    };
    window.addEventListener('keydown', onKey);
    const off = on('lineup:show', (id) => {
      const i = LINEUP.findIndex((x) => x.id === id);
      if (i >= 0) userGo(i);
    });
    return () => {
      window.removeEventListener('keydown', onKey);
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const touch = useRef(null);
  const onPointerDown = (e) => {
    if (e.pointerType !== 'touch') return;
    touch.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) userGo(state.current.target + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  };

  return (
    <section
      id="lineup"
      className="lineup"
      ref={sectionRef}
      style={{ '--bg': LINEUP[0].theme.bg, '--deep': LINEUP[0].theme.deep, '--accent': LINEUP[0].theme.accent }}
      aria-roledescription="carousel"
      aria-label="Our pizzas"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setPlaying(false)}
    >
      <div className="lineup__bg" aria-hidden="true">
        <span className="cloud lineup__cloud lineup__cloud--a" />
        <span className="cloud lineup__cloud lineup__cloud--b" />
      </div>
      <div className="lineup__word display" ref={wordRef} aria-hidden="true">
        <span>{p.word}</span>
        <span>{p.word}</span>
      </div>
      <canvas className="lineup__canvas" ref={canvasRef} aria-hidden="true" />

      <div className="lineup__ui">
        <header className="lineup__head">
          <p className="eyebrow">The Line-up</p>
          <p className="lineup__count">
            <strong>{pad(shown + 1)}</strong> / {pad(LINEUP.length)}
          </p>
        </header>

        <div className="lineup__anchor" ref={anchorRef} aria-hidden="true">
          {!thumbs[p.id] && <span className="lineup__anchor-fallback" />}
        </div>

        <div className="lineup__info" ref={infoRef} aria-live="polite">
          <span className="pill pill--dark lineup__cat">
            {p.category} pizza{p.badge ? ` · ${p.badge}` : ''}
          </span>
          <h2 className="lineup__name display" key={p.id}>
            {p.name}
          </h2>
          <p className="lineup__desc">{p.desc}</p>
          <div className="lineup__prices">
            <span className="lineup__price pill--glass">
              <small>Large · 30cm</small>
              <strong>{formatRand(p.large)}</strong>
            </span>
            <span className="lineup__price pill--glass">
              <small>Small · 20cm</small>
              <strong>{formatRand(p.small)}</strong>
            </span>
          </div>
          <div className="lineup__ctas">
            <a className="btn btn--dark" href={SITE.uberEatsUrl} target="_blank" rel="noopener noreferrer">
              <IconBag /> Order now
            </a>
            <a className="btn btn--glass" href={SITE.phoneHref}>
              <IconPhone /> Call to order
            </a>
          </div>
        </div>

        <aside className="lineup__side">
          <p className="lineup__side-title">
            Dream <em>big</em> flavour
          </p>
          <p className="lineup__side-copy">Nine pizzas, two sizes. Tap one to bring it to the table.</p>
          <ul className="lineup__thumbs">
            {LINEUP.map((x, i) => (
              <li key={x.id}>
                <button
                  className={`lineup__thumb ${i === target ? 'is-active' : ''}`}
                  onClick={() => userGo(i)}
                  aria-label={`Show ${x.name}`}
                  aria-current={i === target}
                >
                  {thumbs[x.id] ? <img src={thumbs[x.id]} alt="" width="128" height="128" /> : <span className="lineup__thumb-ph" />}
                  <span className="lineup__thumb-name">{x.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="lineup__controls">
          <button className="lineup__arrow" onClick={() => userGo(target - 1, -1)} aria-label="Previous pizza">
            <IconArrowLeft />
          </button>
          <div className="lineup__dots" role="tablist" aria-label="Choose a pizza">
            {LINEUP.map((x, i) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={i === target}
                aria-label={x.name}
                className={`lineup__dot ${i === target ? 'is-active' : ''} ${playing ? 'is-playing' : ''}`}
                style={{ '--dur': `${AUTOPLAY_MS}ms` }}
                onClick={() => userGo(i)}
              >
                <span key={`${i}-${target}`} />
              </button>
            ))}
          </div>
          <button className="lineup__arrow" onClick={() => userGo(target + 1, 1)} aria-label="Next pizza">
            <IconArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
}
