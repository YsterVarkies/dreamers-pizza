import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, stopScroll, startScroll } from '../lib/smoothScroll';
import { on } from '../lib/store';
import { IconClose, IconDownload } from './Icons';
import './Lightbox.css';

/** Full-screen image viewer for the flyers and the printed menu. */
export default function Lightbox() {
  const [img, setImg] = useState(null);
  const root = useRef(null);
  const lastFocus = useRef(null);

  useEffect(
    () =>
      on('lightbox', (detail) => {
        lastFocus.current = document.activeElement;
        setImg(detail);
      }),
    [],
  );

  useEffect(() => {
    if (!img) return undefined;
    stopScroll();
    const el = root.current;
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
    gsap.fromTo(el.querySelector('.lb__img'), { y: 40, scale: 0.94 }, { y: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
    el.querySelector('.lb__close')?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  const close = () => {
    gsap.to(root.current, {
      autoAlpha: 0,
      duration: 0.25,
      onComplete: () => {
        setImg(null);
        startScroll();
        lastFocus.current?.focus?.({ preventScroll: true });
      },
    });
  };

  if (!img) return null;
  const tall = img.h / img.w > 1.25;

  return createPortal(
    <div className={`lb ${tall ? 'lb--tall' : ''}`} ref={root} role="dialog" aria-modal="true" aria-label={img.alt} onClick={close}>
      <div className="lb__scroll" data-lenis-prevent>
        <img className="lb__img" src={img.src} alt={img.alt} width={img.w} height={img.h} onClick={(e) => e.stopPropagation()} />
      </div>
      <div className="lb__bar" onClick={(e) => e.stopPropagation()}>
        {img.download && (
          <a className="btn btn--light btn--sm" href={img.download} download>
            <IconDownload /> Download
          </a>
        )}
        <button className="lb__close" onClick={close} aria-label="Close">
          <IconClose />
        </button>
      </div>
    </div>,
    document.body,
  );
}
