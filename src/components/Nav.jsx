import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, scrollToTarget, stopScroll, startScroll } from '../lib/smoothScroll';
import { SITE, asset } from '../data/site';
import { openStatus } from '../lib/hours';
import { IconGrid, IconPhone, IconMail, IconBag, IconMenu, IconClose, IconInstagram, IconFacebook } from './Icons';
import './Nav.css';

const LINKS = [
  { id: 'menu', label: 'Menu', icon: true },
  { id: 'lineup', label: 'Pizzas' },
  { id: 'specials', label: 'Specials' },
  { id: 'hours', label: 'Hours' },
];

const MOBILE_LINKS = [
  { id: 'lineup', label: 'Pizzas' },
  { id: 'specials', label: 'Blue Monday' },
  { id: 'new', label: "What's New" },
  { id: 'menu', label: 'Full Menu' },
  { id: 'about', label: 'Our Story' },
  { id: 'hours', label: 'Hours & Order' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const overlay = useRef(null);
  const status = openStatus();

  useEffect(() => {
    const onScroll = () => {
      // transparent while the hero is on screen; blur kicks in once the next section reaches the bar
      const lineup = document.getElementById('lineup');
      const next = lineup ? lineup.getBoundingClientRect().top <= 70 : window.scrollY > 32;
      setScrolled((current) => (current === next ? current : next));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // light sections swap the logo to the full-colour version
  useLayoutEffect(() => {
    const triggers = [];
    const setup = () => {
      document.querySelectorAll('[data-nav="light"]').forEach((el) => {
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: 'top top+=40',
            end: 'bottom top+=40',
            onToggle: (self) => setLight(self.isActive),
          }),
        );
      });
      ['lineup', 'specials', 'new', 'menu', 'about', 'hours'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: 'top center',
            end: 'bottom center',
            onToggle: (self) => self.isActive && setActive(id),
            onLeaveBack: () => id === 'lineup' && setActive(''),
          }),
        );
      });
    };
    const t = setTimeout(setup, 300); // after sections mount & pins are created
    return () => {
      clearTimeout(t);
      triggers.forEach((tr) => tr.kill());
    };
  }, []);

  useEffect(() => {
    const el = overlay.current;
    if (!el) return;
    if (open) {
      stopScroll();
      gsap.set(el, { display: 'flex' });
      gsap.fromTo(el, { clipPath: 'circle(0% at 92% 4%)' }, { clipPath: 'circle(150% at 92% 4%)', duration: 0.8, ease: 'power3.inOut' });
      gsap.fromTo(el.querySelectorAll('.mnav__link'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.7, delay: 0.25, ease: 'back.out(1.4)' });
      gsap.fromTo(el.querySelectorAll('.mnav__foot > *'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, delay: 0.5, duration: 0.6 });
    } else if (el.style.display === 'flex') {
      gsap.to(el, {
        clipPath: 'circle(0% at 92% 4%)',
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete: () => {
          gsap.set(el, { display: 'none' });
          startScroll();
        },
      });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (e, id) => {
    e.preventDefault();
    if (open) {
      setOpen(false);
      setTimeout(() => scrollToTarget(`#${id}`), 450);
    } else scrollToTarget(`#${id}`);
  };

  return (
    <>
      <header className={`nav ${light ? 'nav--light' : ''} ${scrolled ? 'nav--scrolled' : ''}`}>
        <a className="nav__logo" href="#top" onClick={(e) => go(e, 'top')} aria-label="Dreamers Pizza — back to top">
          <img src={asset("/brand/logo-lockup-light-sm.webp")} alt="" className="nav__logo-img nav__logo-img--light" width="360" height="244" />
          <img src={asset("/brand/logo-lockup-color-sm.webp")} alt="" className="nav__logo-img nav__logo-img--color" width="360" height="244" />
        </a>

        <nav className="nav__pills" aria-label="Main">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => go(e, l.id)}
              className={`pill ${l.icon ? 'pill--dark' : 'pill--glass'} ${active === l.id ? 'is-active' : ''}`}
            >
              {l.icon && <IconGrid width={14} height={14} />}
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <div className="nav__icons pill--glass">
            <a href={SITE.phoneHref} aria-label={`Call ${SITE.phoneDisplay}`} title={`Call ${SITE.phoneDisplay}`}>
              <IconPhone />
            </a>
            <a href={`mailto:${SITE.email}`} aria-label="Email us" title="Email us">
              <IconMail />
            </a>
            {SITE.socials.instagram && (
              <a href={SITE.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <IconInstagram />
              </a>
            )}
            {SITE.socials.facebook && (
              <a href={SITE.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <IconFacebook />
              </a>
            )}
          </div>
          <a className="nav__bag" href={SITE.uberEatsUrl} target="_blank" rel="noopener noreferrer" aria-label="Order on Uber Eats" title="Order on Uber Eats">
            <IconBag />
          </a>
          <button className="nav__burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </header>

      <div className="mnav" id="mobile-nav" ref={overlay} aria-hidden={!open}>
        <span className="cloud mnav__cloud" />
        <ul className="mnav__list">
          {MOBILE_LINKS.map((l, i) => (
            <li key={l.id} className="mnav__item">
              <a className="mnav__link display" href={`#${l.id}`} onClick={(e) => go(e, l.id)} tabIndex={open ? 0 : -1}>
                <span className="mnav__num">0{i + 1}</span>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mnav__foot">
          <p className="mnav__status">
            <span className={`status-dot ${status.open ? '' : 'status-dot--closed'}`} />
            {status.label} · {status.detail}
          </p>
          <div className="mnav__btns">
            <a className="btn btn--light" href={SITE.phoneHref} tabIndex={open ? 0 : -1}>
              <IconPhone /> {SITE.phoneDisplay}
            </a>
            <a className="btn btn--dark" href={SITE.uberEatsUrl} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
              <IconBag /> Uber Eats
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
