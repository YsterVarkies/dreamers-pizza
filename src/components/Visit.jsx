import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '../lib/smoothScroll';
import TiltedCard from './reactbits/TiltedCard';
import Magnet from './reactbits/Magnet';
import AlarmClock from './AlarmClock';
import { HOURS, IMAGES, SITE, src } from '../data/site';
import { openStatus, shopNow } from '../lib/hours';
import { emit } from '../lib/store';
import { IconPhone, IconBag, IconMail, IconArrowRight, IconPin } from './Icons';
import './Visit.css';

// Magnet wraps children in an inline-block by default; make the order cards fill their grid cells
const MAGNET_BLOCK = { display: 'block', width: '100%', height: '100%' };

export default function Visit() {
  const root = useRef(null);
  const [status, setStatus] = useState(openStatus());
  const [today, setToday] = useState(shopNow().day);

  useEffect(() => {
    const id = setInterval(() => {
      setStatus(openStatus());
      setToday(shopNow().day);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.visit__row', {
        x: -30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.visit__table', start: 'top 85%' },
      });
      gsap.from('.order-card', {
        y: 50,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.visit__orders', start: 'top 88%' },
      });
      gsap.from('.visit__clock', {
        scale: 0.6,
        rotate: -20,
        opacity: 0,
        duration: 1.2,
        ease: 'back.out(1.6)',
        scrollTrigger: { trigger: '.visit__status', start: 'top 85%' },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const flyer = IMAGES.tradingHours;
  const openFlyer = () =>
    emit('lightbox', {
      src: src(flyer),
      alt: 'Dreamers Pizza trading hours: Monday to Thursday 10:00–19:00, Friday and Saturday 10:00–20:00.',
      w: flyer.w,
      h: flyer.h,
    });

  return (
    <section id="hours" className="visit section" ref={root} aria-labelledby="visit-title">
      <span className="cloud visit__cloud visit__cloud--a" aria-hidden="true" />
      <span className="cloud visit__cloud visit__cloud--b" aria-hidden="true" />
      <span className="visit__sun" aria-hidden="true" />

      <div className="container visit__grid">
        <div className="visit__left">
          <p className="eyebrow">Hours &amp; ordering</p>
          <h2 id="visit-title" className="visit__title display display--shadow">
            Open six days <span>a week</span>
          </h2>

          <div className="visit__status">
            <div className="visit__clock">
              <AlarmClock size={150} ringing={status.open} />
            </div>
            <div>
              <p className="visit__state">
                <span className={`status-dot ${status.open ? '' : 'status-dot--closed'}`} />
                {status.label}
              </p>
              <p className="visit__detail">{status.detail}</p>
              <p className="visit__tz">Shop time (South Africa)</p>
            </div>
          </div>

          <ul className="visit__table">
            {HOURS.map((r) => {
              const isToday = r.days.includes(today);
              return (
                <li key={r.label} className={`visit__row ${isToday ? 'is-today' : ''}`}>
                  <span className="visit__days">
                    <span className="visit__days-long">{r.label}</span>
                    <span className="visit__days-short">{r.short}</span>
                    {isToday && <em>Today</em>}
                  </span>
                  <span className="visit__time">{r.closed ? 'Closed' : `${r.open} – ${r.close}`}</span>
                </li>
              );
            })}
          </ul>
          {SITE.address && (
            <a className="visit__address" href={SITE.mapsUrl || '#'} target="_blank" rel="noopener noreferrer">
              <IconPin /> {SITE.address}
            </a>
          )}
        </div>

        <div className="visit__right">
          <TiltedCard
            imageSrc={src(flyer)}
            altText="Dreamers Pizza trading hours flyer."
            captionText="Tap to enlarge"
            containerHeight="var(--th)"
            containerWidth="var(--th)"
            imageHeight="var(--th)"
            imageWidth="var(--th)"
            rotateAmplitude={9}
            scaleOnHover={1.03}
            flipOnClick={false}
            onClick={openFlyer}
            radius={22}
            glare={0.3}
            floating
          />
        </div>
      </div>

      <div className="container">
        <ul className="visit__orders">
          <li>
            <Magnet padding={40} magnetStrength={6} style={MAGNET_BLOCK} innerClassName="magnet-fill">
              <a className="order-card order-card--call" href={SITE.phoneHref}>
                <span className="order-card__icon"><IconPhone /></span>
                <span className="order-card__label">Call to order</span>
                <span className="order-card__value display">{SITE.phoneDisplay}</span>
                <IconArrowRight className="order-card__arrow" />
              </a>
            </Magnet>
          </li>
          <li>
            <Magnet padding={40} magnetStrength={6} style={MAGNET_BLOCK} innerClassName="magnet-fill">
              <a className="order-card order-card--uber" href={SITE.uberEatsUrl} target="_blank" rel="noopener noreferrer">
                <span className="order-card__icon"><IconBag /></span>
                <span className="order-card__label">Delivered fast</span>
                <span className="order-card__value display">Uber Eats</span>
                <IconArrowRight className="order-card__arrow" />
              </a>
            </Magnet>
          </li>
          <li>
            <Magnet padding={40} magnetStrength={6} style={MAGNET_BLOCK} innerClassName="magnet-fill">
              <a className="order-card order-card--mail" href={`mailto:${SITE.email}`}>
                <span className="order-card__icon"><IconMail /></span>
                <span className="order-card__label">Questions &amp; big orders</span>
                <span className="order-card__value order-card__value--sm">{SITE.email}</span>
                <IconArrowRight className="order-card__arrow" />
              </a>
            </Magnet>
          </li>
        </ul>
        <p className="visit__note">Takeout only — call ahead and we’ll have it hot and ready, or order through Uber Eats.</p>
      </div>
    </section>
  );
}
