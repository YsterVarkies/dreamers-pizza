import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, scrollToTarget, stopScroll, startScroll } from '../lib/smoothScroll';
import { IMAGES, SITE, src, srcSet } from '../data/site';
import { emit } from '../lib/store';
import { IconArrowRight, IconBag, IconClose, IconPhone } from './Icons';
import './WhatsNew.css';

const ITEMS = [
  {
    id: 'platter',
    tag: 'New',
    title: ['The Dreamers', 'Platter'],
    img: IMAGES.platterNew,
    glow: '#ffcf3a',
    alt: 'New menu item alert: the new Dreamers Platter is now available.',
    copy: 'Our brand-new sharing platter is here — sticky BBQ ribs, crumbed chicken strips, golden chicken bites, fries, cherry tomatoes and dips, with pizza on the side. Built for the whole crew.',
    cta: { label: `Ask for it — ${SITE.phoneDisplay}`, href: SITE.phoneHref, icon: 'phone' },
  },
  {
    id: 'dreamer',
    tag: 'Upgraded',
    title: ['The Dreamer,', 'upgraded'],
    img: IMAGES.dreamerUpgrade,
    glow: '#ff5a3c',
    alt: 'Good news: we have upgraded our famous Dreamer Pizza with an extra new secret sauce.',
    copy: 'Dreams don’t need to be dry. Our famous Dreamer pizza now comes with an extra new secret sauce — chicken, bacon, olives, red onion, cherry tomato and mushrooms. Come and try the upgraded version.',
    cta: { label: 'See it in 3D', lineup: 'the-dreamer', icon: 'arrow' },
  },
  {
    id: 'uber',
    tag: 'Delivery',
    title: ['Now on', 'Uber Eats'],
    img: IMAGES.uberEats,
    glow: '#3fd47a',
    alt: 'Dreamers Pizza is now available on Uber Eats — your favourite pizza, delivered fast.',
    copy: 'Your favourite pizza, delivered fast. Great pizza, great service — now on Uber Eats. Prefer to collect? Call ahead and we’ll have it hot and ready.',
    cta: { label: 'Order on Uber Eats', href: SITE.uberEatsUrl, external: true, icon: 'bag' },
  },
];

export default function WhatsNew() {
  const root = useRef(null);
  const detail = useRef(null);
  const [openIdx, setOpenIdx] = useState(-1);
  const fromRect = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.niche', {
        y: 90,
        opacity: 0,
        stagger: 0.14,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.wn__row', start: 'top 82%' },
      });
      gsap.from('.niche__beam', {
        opacity: 0,
        scaleY: 0.2,
        transformOrigin: '50% 0%',
        stagger: 0.14,
        duration: 1.4,
        delay: 0.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.wn__row', start: 'top 82%' },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const open = (i, e) => {
    const img = e.currentTarget.querySelector('.niche__img');
    fromRect.current = img.getBoundingClientRect();
    stopScroll();
    setOpenIdx(i);
  };

  // dolly into the niche (FLIP from the small poster to the big one)
  useLayoutEffect(() => {
    if (openIdx < 0) return;
    const el = detail.current;
    const big = el.querySelector('.wn-detail__img');
    const to = big.getBoundingClientRect();
    const f = fromRect.current;
    const tl = gsap.timeline();
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 0);
    if (f && to.width) {
      tl.fromTo(
        big,
        { x: f.left - to.left, y: f.top - to.top, scaleX: f.width / to.width, scaleY: f.height / to.height, transformOrigin: '0 0' },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1, ease: 'power4.inOut' },
        0,
      );
    }
    tl.fromTo(el.querySelectorAll('.wn-detail__copy > *'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.7, ease: 'power3.out' }, 0.55);
    el.querySelector('.wn-detail__close')?.focus({ preventScroll: true });
    const onKey = (ev) => ev.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIdx]);

  const close = (after) => {
    const el = detail.current;
    if (!el) return;
    const big = el.querySelector('.wn-detail__img');
    const niche = root.current.querySelectorAll('.niche__img')[openIdx];
    const f = niche?.getBoundingClientRect();
    const to = big.getBoundingClientRect();
    const tl = gsap.timeline({
      onComplete: () => {
        setOpenIdx(-1);
        startScroll();
        after?.();
      },
    });
    tl.to(el.querySelectorAll('.wn-detail__copy > *'), { y: 20, opacity: 0, duration: 0.25, stagger: 0.03 }, 0);
    if (f && to.width) {
      tl.to(big, { x: f.left - to.left, y: f.top - to.top, scaleX: f.width / to.width, scaleY: f.height / to.height, transformOrigin: '0 0', duration: 0.8, ease: 'power4.inOut' }, 0.1);
    }
    tl.to(el, { autoAlpha: 0, duration: 0.3 }, '-=0.25');
  };

  const item = openIdx >= 0 ? ITEMS[openIdx] : null;

  const ctaClick = (it, e) => {
    if (it.cta.lineup) {
      e.preventDefault();
      close(() => {
        emit('lineup:show', it.cta.lineup);
        scrollToTarget('#lineup');
      });
    }
  };

  return (
    <section id="new" className="wn section" ref={root} data-nav="light" aria-labelledby="wn-title">
      <div className="container">
        <header className="wn__head">
          <p className="eyebrow">What’s new</p>
          <h2 id="wn-title" className="wn__title display">
            Fresh from <span>the oven</span>
          </h2>
          <p className="wn__lead">The latest from the Dreamers kitchen. Tap a niche to step inside.</p>
        </header>

        <ul className="wn__row">
          {ITEMS.map((it, i) => (
            <li key={it.id} className="niche" style={{ '--glow': it.glow }}>
              <button className="niche__frame" onClick={(e) => open(i, e)} aria-label={`${it.title.join(' ')} — open`}>
                <span className="niche__lamp" aria-hidden="true" />
                <span className="niche__beam" aria-hidden="true" />
                <img
                  className="niche__img"
                  src={src(it.img, 0)}
                  srcSet={srcSet(it.img)}
                  sizes="(max-width: 760px) 70vw, 360px"
                  alt={it.alt}
                  width={it.img.w}
                  height={it.img.h}
                  loading="lazy"
                  decoding="async"
                  style={{ visibility: openIdx === i ? 'hidden' : 'visible' }}
                />
                <span className="niche__floor" aria-hidden="true" />
              </button>
              <div className="niche__meta">
                <span className="niche__tag">{it.tag}</span>
                <h3 className="niche__name display">{it.title.join(' ')}</h3>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {item && createPortal(
        <div className="wn-detail" ref={detail} role="dialog" aria-modal="true" aria-label={item.title.join(' ')} style={{ '--glow': item.glow }}>
          <div className="wn-detail__backdrop" onClick={() => close()} />
          <div className="wn-detail__inner" data-lenis-prevent>
            <div className="wn-detail__copy">
              <span className="niche__tag">{item.tag}</span>
              <h3 className="wn-detail__title display">
                {item.title[0]} <span>{item.title[1]}</span>
              </h3>
              <p>{item.copy}</p>
              <div className="wn-detail__ctas">
                <a
                  className="btn btn--light btn--lg"
                  href={item.cta.href || '#lineup'}
                  target={item.cta.external ? '_blank' : undefined}
                  rel={item.cta.external ? 'noopener noreferrer' : undefined}
                  onClick={(e) => ctaClick(item, e)}
                >
                  {item.cta.icon === 'phone' && <IconPhone />}
                  {item.cta.icon === 'bag' && <IconBag />}
                  {item.cta.label}
                  {item.cta.icon === 'arrow' && <IconArrowRight />}
                </a>
                <button
                  className="btn btn--glass btn--lg"
                  onClick={() => emit('lightbox', { src: src(item.img), alt: item.alt, w: item.img.w, h: item.img.h })}
                >
                  View full size
                </button>
              </div>
            </div>
            <div className="wn-detail__stage">
              <img className="wn-detail__img" src={src(item.img)} alt="" width={item.img.w} height={item.img.h} />
            </div>
          </div>
          <button className="wn-detail__close" onClick={() => close()} aria-label="Close">
            <IconClose />
          </button>
        </div>,
        document.body,
      )}
    </section>
  );
}
