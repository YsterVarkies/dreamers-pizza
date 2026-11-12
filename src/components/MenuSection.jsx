import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, scrollToTarget } from '../lib/smoothScroll';
import SpotlightCard from './reactbits/SpotlightCard';
import { PIZZA_MENU, SIDE_MENU, DREAM_DEALS, formatRand } from '../data/menu';
import { IMAGES, SITE, src, asset } from '../data/site';
import { emit, store, subscribe } from '../lib/store';
import { IconEye, IconDownload, IconBag, IconPizza, IconSparkle } from './Icons';
import './MenuSection.css';

const CHIPS = [
  { id: 'classic', label: 'Classic Pizzas' },
  { id: 'signature', label: 'Signature Pizzas' },
  { id: 'subs', label: 'Subs' },
  { id: 'wings', label: 'Wings & Chips' },
  { id: 'fries', label: 'Loaded Fries' },
  { id: 'popcorn', label: "Pop 'n Go" },
  { id: 'drinks', label: 'Drinks' },
];

export default function MenuSection() {
  const root = useRef(null);
  const preview = useRef(null);
  const [thumbs, setThumbs] = useState(store.thumbs);
  const [hover, setHover] = useState(null);

  useEffect(() => subscribe('thumbs', setThumbs), []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.menu__cat, .menu__side-cat').forEach((cat) => {
        gsap.from(cat.querySelectorAll('.menu__cat-head, h3, li'), {
          y: 26,
          opacity: 0,
          stagger: 0.05,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: cat, start: 'top 86%' },
        });
      });
      gsap.from('.deal', {
        y: 50,
        opacity: 0,
        rotate: (i) => (i ? 2 : -2),
        stagger: 0.12,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.menu__deals', start: 'top 85%' },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // floating 3D-rendered pizza that follows the cursor over the pizza rows
  useEffect(() => {
    const el = preview.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return undefined;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    const move = (e) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - 90);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    if (!preview.current) return;
    gsap.to(preview.current, {
      scale: hover && thumbs[hover] ? 1 : 0.4,
      opacity: hover && thumbs[hover] ? 1 : 0,
      rotate: hover ? 0 : -40,
      duration: 0.45,
      ease: 'back.out(1.6)',
    });
  }, [hover, thumbs]);

  const show3D = (id) => {
    emit('lineup:show', id);
    scrollToTarget('#lineup');
  };

  const openPrinted = () =>
    emit('lightbox', {
      src: src(IMAGES.menu),
      alt: 'The printed Dreamers Pizza menu with all prices.',
      w: IMAGES.menu.w,
      h: IMAGES.menu.h,
      download: asset('/images/dreamers-pizza-menu.jpg'),
    });

  return (
    <section id="menu" className="menu section" ref={root} data-nav="light" aria-labelledby="menu-title">
      <div className="container">
        <header className="menu__head">
          <div>
            <p className="eyebrow">Takeout · Uber Eats</p>
            <h2 id="menu-title" className="menu__title display">
              The <span>Menu</span>
            </h2>
          </div>
          <div className="menu__head-side">
            <p>Every pizza starts with a tomato base and mozzarella. Large is 30cm, small is 20cm — pick your dream.</p>
            <div className="menu__head-btns">
              <button className="btn btn--dark" onClick={openPrinted}>
                <IconEye /> Printed menu
              </button>
              <a className="btn btn--light" href={asset('/images/dreamers-pizza-menu.jpg')} download="Dreamers-Pizza-Menu.jpg">
                <IconDownload /> Download
              </a>
            </div>
          </div>
        </header>

        <div className="menu__deals">
          {DREAM_DEALS.map((d) => (
            <SpotlightCard key={d.id} className="deal" theme="dark" spotlightColor="rgba(255, 201, 60, 0.32)" intensity={0.22}>
              <div className="deal__top">
                <span className="deal__badge">
                  <IconSparkle width={14} height={14} /> Dream Deal
                </span>
                <span className="deal__tag">{d.tag}</span>
              </div>
              <h3 className="deal__name display">{d.name}</h3>
              <p className="deal__desc">{d.desc}</p>
              <div className="deal__bottom">
                <span className="deal__price display">{formatRand(d.price)}</span>
                <a className="btn btn--light btn--sm" href={SITE.phoneHref}>
                  Order
                </a>
              </div>
            </SpotlightCard>
          ))}
        </div>

        <nav className="menu__chips" aria-label="Menu categories">
          {CHIPS.map((c) => (
            <a key={c.id} href={`#m-${c.id}`} onClick={(e) => (e.preventDefault(), scrollToTarget(`#m-${c.id}`, { offset: -96 }))}>
              {c.label}
            </a>
          ))}
        </nav>

        <div className="menu__grid">
          <div className="menu__pizzas">
            {PIZZA_MENU.map((cat) => (
              <div className="menu__cat" id={`m-${cat.id}`} key={cat.id}>
                <div className="menu__cat-head">
                  <h3 className="display">{cat.title}</h3>
                  <span>
                    Large <small>30cm</small>
                  </span>
                  <span>
                    Small <small>20cm</small>
                  </span>
                </div>
                <ul>
                  {cat.items.map((it) => (
                    <li
                      key={it.id}
                      className="menu__row"
                      onMouseEnter={() => setHover(it.id)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div className="menu__row-main">
                        <h4>
                          {it.name}
                          {it.badge && <em>{it.badge}</em>}
                        </h4>
                        <p>{it.desc}</p>
                        <button className="menu__3d" onClick={() => show3D(it.id)}>
                          <IconPizza width={14} height={14} /> See it in 3D
                        </button>
                      </div>
                      <span className="menu__price" aria-label={`Large ${formatRand(it.large)}`}>{formatRand(it.large)}</span>
                      <span className="menu__price" aria-label={`Small ${formatRand(it.small)}`}>{formatRand(it.small)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <aside className="menu__side">
            {SIDE_MENU.map((cat) => (
              <div className="menu__side-cat" id={`m-${cat.id}`} key={cat.id}>
                <h3 className="display">{cat.title}</h3>
                {cat.subtitle && <p className="menu__sub">{cat.subtitle}</p>}
                <ul>
                  {cat.items.map((it) => (
                    <li key={it.name} className={it.addOn ? 'is-addon' : ''}>
                      <div>
                        <h4>{it.name}</h4>
                        {it.desc && <p>{it.desc}</p>}
                      </div>
                      <span className="menu__price">
                        {it.addOn ? '+ ' : ''}
                        {formatRand(it.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <img className="menu__side-logo" src={asset("/brand/logo-lockup-color-sm.webp")} alt="" width="360" height="244" loading="lazy" />
          </aside>
        </div>

        <div className="menu__foot">
          <p>Prices in Rand and subject to change. Takeout only — or get it delivered with Uber Eats.</p>
          <a className="btn btn--red" href={SITE.uberEatsUrl} target="_blank" rel="noopener noreferrer">
            <IconBag /> Order on Uber Eats
          </a>
        </div>
      </div>

      <div className="menu__preview" ref={preview} aria-hidden="true">
        {hover && thumbs[hover] && <img src={thumbs[hover]} alt="" />}
      </div>
    </section>
  );
}
