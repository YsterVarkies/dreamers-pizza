import { useMemo } from 'react';
import CurvedLoop from './reactbits/CurvedLoop';
import { HOURS, SITE, asset } from '../data/site';
import { openStatus } from '../lib/hours';
import { scrollToTarget } from '../lib/smoothScroll';
import { IconArrowRight, IconPhone, IconMail, IconBag, IconInstagram, IconFacebook } from './Icons';
import './Footer.css';

/** Night falls — the Dreamers go to sleep (and dream of pizza). */
export default function Footer() {
  const status = openStatus();
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: `${(i * 37.7) % 100}%`,
        top: `${(i * 53.3) % 100}%`,
        size: 1 + ((i * 7) % 3),
        delay: `${(i % 10) * 0.37}s`,
      })),
    [],
  );
  const go = (e, id) => {
    e.preventDefault();
    scrollToTarget(id);
  };

  return (
    <footer className="footer">
      <div className="footer__stars" aria-hidden="true">
        {stars.map((s, i) => (
          <span key={i} style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }} />
        ))}
      </div>
      <span className="footer__moon" aria-hidden="true" />

      <div className="footer__loop" aria-hidden="true">
        <CurvedLoop marqueeText="Dream Big ✦ Dream Pizza ✦ " speed={1.4} curveAmount={220} fontSize={88} fontWeight={800} interactive={false} color="#fff7ea" />
      </div>

      <div className="container footer__grid">
        <div className="footer__brand">
          <img src={asset("/brand/logo-full-light.webp")} alt="Dreamers Pizza — Dream Big. Dream Pizza." width="690" height="516" loading="lazy" />
          <p className="footer__sleep hand">
            {status.open ? 'We’re open — come grab a slice!' : `Sweet dreams — ${status.detail.toLowerCase()}.`}
          </p>
        </div>

        <div className="footer__col">
          <h3>Hours</h3>
          <ul>
            {HOURS.map((r) => (
              <li key={r.label}>
                <span>{r.short}</span>
                <span>{r.closed ? 'Closed' : `${r.open}–${r.close}`}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h3>Order</h3>
          <ul className="footer__links">
            <li><a href={SITE.phoneHref}><IconPhone /> {SITE.phoneDisplay}</a></li>
            <li><a href={SITE.uberEatsUrl} target="_blank" rel="noopener noreferrer"><IconBag /> Uber Eats</a></li>
            <li><a href={`mailto:${SITE.email}`}><IconMail /> {SITE.email}</a></li>
            {SITE.socials.instagram && <li><a href={SITE.socials.instagram} target="_blank" rel="noopener noreferrer"><IconInstagram /> Instagram</a></li>}
            {SITE.socials.facebook && <li><a href={SITE.socials.facebook} target="_blank" rel="noopener noreferrer"><IconFacebook /> Facebook</a></li>}
          </ul>
        </div>

        <div className="footer__col">
          <h3>Explore</h3>
          <ul className="footer__links">
            <li><a href="#lineup" onClick={(e) => go(e, '#lineup')}>The pizzas</a></li>
            <li><a href="#specials" onClick={(e) => go(e, '#specials')}>Blue Monday</a></li>
            <li><a href="#new" onClick={(e) => go(e, '#new')}>What’s new</a></li>
            <li><a href="#menu" onClick={(e) => go(e, '#menu')}>Full menu</a></li>
            <li><a href="#about" onClick={(e) => go(e, '#about')}>Our story</a></li>
          </ul>
        </div>
      </div>

      <div className="container footer__bar">
        <p>© {new Date().getFullYear()} Dreamers Pizza · Takeout only · Thank you for supporting local ♥</p>
        <a className="footer__top" href="#top" onClick={(e) => go(e, 0)}>
          Back to the sky <IconArrowRight />
        </a>
      </div>
    </footer>
  );
}
