import { asset } from '../data/site';
import { useEffect, useRef, useState } from 'react';
import { gsap, stopScroll, startScroll } from '../lib/smoothScroll';
import './Preloader.css';

/** Sky-blue loading curtain: counts to 100 while fonts + the 3D hero get ready, then lifts away. */
export default function Preloader({ sceneReady, onDone }) {
  const root = useRef(null);
  const [count, setCount] = useState(0);
  const state = useRef({ v: 0, target: 72, fonts: false, done: false });

  useEffect(() => {
    stopScroll();
    window.scrollTo(0, 0);
    const s = state.current;
    const started = performance.now();
    document.fonts?.ready.then(() => (s.fonts = true));
    let raf;
    const tick = () => {
      const elapsed = performance.now() - started;
      const ready = s.fonts && s.sceneReady && elapsed > 1300;
      s.target = ready ? 100 : Math.min(92, 40 + elapsed / 40);
      s.v += (s.target - s.v) * (ready ? 0.12 : 0.05);
      if (ready && s.v > 99.4) s.v = 100;
      setCount(Math.round(s.v));
      if (s.v >= 100 && !s.done) {
        s.done = true;
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const finish = () => {
      const tl = gsap.timeline({
        onComplete: () => {
          startScroll();
          root.current && (root.current.style.display = 'none');
        },
      });
      tl.to(root.current.querySelector('.preloader__inner'), { y: -40, opacity: 0, duration: 0.55, ease: 'power3.in' })
        .add(() => onDone?.(), '-=0.05')
        .to(root.current, { clipPath: 'ellipse(160% 0% at 50% 0%)', duration: 1.1, ease: 'power4.inOut' }, '-=0.15');
    };
    // safety: never block the site for more than 7s
    const bail = setTimeout(() => (s.sceneReady = true), 7000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bail);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sceneReady) state.current.sceneReady = true;
  }, [sceneReady]);

  return (
    <div className="preloader" ref={root} role="status" aria-live="polite" aria-label="Loading Dreamers Pizza">
      <span className="cloud preloader__cloud preloader__cloud--a" />
      <span className="cloud preloader__cloud preloader__cloud--b" />
      <span className="cloud preloader__cloud preloader__cloud--c" />
      <div className="preloader__inner">
        <img className="preloader__logo" src={asset("/brand/logo-full-light-sm.webp")} alt="Dreamers Pizza" width="360" height="269" />
        <div className="preloader__count display">{count}</div>
        <p className="preloader__note">Preheating the oven…</p>
      </div>
    </div>
  );
}
