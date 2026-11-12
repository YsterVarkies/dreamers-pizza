import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/smoothScroll';
import TiltedCard from './reactbits/TiltedCard';
import CircularText from './reactbits/CircularText';
import CountUp from './reactbits/CountUp';
import SplitText from './reactbits/SplitText';
import { BLUE_MONDAY } from '../data/menu';
import { IMAGES, SITE, src } from '../data/site';
import { blueMondayStatus } from '../lib/hours';
import { emit } from '../lib/store';
import { IconPhone, IconEye, IconCalendar } from './Icons';
import './BlueMonday.css';

export default function BlueMonday() {
  const root = useRef(null);
  const status = blueMondayStatus();
  const flyer = IMAGES.blueMonday;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.bm__list li', {
        y: 30,
        opacity: 0,
        stagger: 0.07,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.bm__list', start: 'top 85%' },
      });
      gsap.from('.bm__flyer', {
        y: 80,
        rotate: -6,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.bm__flyer', start: 'top 85%' },
      });
      gsap.to('.bm__cloud--a', { xPercent: 30, ease: 'none', scrollTrigger: { trigger: root.current, scrub: true } });
      gsap.to('.bm__cloud--b', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: root.current, scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  const openFlyer = () =>
    emit('lightbox', {
      src: src(flyer),
      alt: 'Blue Monday Special flyer — any 2 classic pizzas for R199, Mondays only, takeaway only.',
      w: flyer.w,
      h: flyer.h,
    });

  return (
    <section id="specials" className="bm section" ref={root} aria-labelledby="bm-title">
      <span className="cloud bm__cloud bm__cloud--a" aria-hidden="true" />
      <span className="cloud bm__cloud bm__cloud--b" aria-hidden="true" />
      <span className="cloud bm__cloud bm__cloud--c" aria-hidden="true" />

      <div className="container bm__grid">
        <div className="bm__flyer">
          <TiltedCard
            imageSrc={src(flyer)}
            altText="Blue Monday Special flyer: choose any 2 of our classic pizzas for R199. Mondays only, takeaway only."
            captionText="Tap to view the flyer"
            containerHeight="var(--flyer-h)"
            containerWidth="var(--flyer-w)"
            imageHeight="var(--flyer-h)"
            imageWidth="var(--flyer-w)"
            rotateAmplitude={10}
            scaleOnHover={1.04}
            flipOnClick={false}
            onClick={openFlyer}
            radius={22}
            glare={0.35}
            shadow={0.55}
            floating
          />
          <div className="bm__sticker">
            <CircularText text="MONDAYS ONLY ✦ TAKEAWAY ONLY ✦ " size={146} fontSize={13.5} spinDuration={16} color="#fff" onHover="speedUp">
              <span className="bm__sticker-core display">R199</span>
            </CircularText>
          </div>
        </div>

        <div className="bm__content">
          <span className="pill pill--dark bm__eyebrow">
            <IconCalendar width={14} height={14} /> Weekly special
          </span>
          <SplitText
            tag="h2"
            text="Blue Monday"
            className="bm__title display"
            splitType="chars"
            delay={40}
            duration={1}
            textAlign="left"
            effect="rise"
            threshold={0.2}
            rootMargin="-60px"
          />
          <p className="bm__deal">
            Choose any <strong>2</strong> of our classic pizzas for
          </p>
          <p className="bm__price display" aria-label={`R${BLUE_MONDAY.price}`}>
            <span className="bm__r">R</span>
            <CountUp to={BLUE_MONDAY.price} duration={1.8} />
            <span className="bm__cents">.00</span>
          </p>
          <p className={`bm__status ${status.today ? 'is-today' : ''}`}>
            <span className={`status-dot ${status.today ? '' : 'status-dot--closed'}`} />
            {status.text}
          </p>

          <ul className="bm__list" aria-label="Pizzas included in Blue Monday">
            {BLUE_MONDAY.pizzas.map((p) => (
              <li key={p.name} className="bm__item">
                <strong>{p.name}</strong>
                <span>{p.desc}</span>
              </li>
            ))}
          </ul>

          <div className="bm__ctas">
            <a className="btn btn--dark btn--lg" href={SITE.phoneHref}>
              <IconPhone /> Call {SITE.phoneDisplay}
            </a>
            <button className="btn btn--glass btn--lg" onClick={openFlyer}>
              <IconEye /> View the flyer
            </button>
          </div>
          <p className="bm__fine">Mondays only · Takeaway only · Thank you for supporting local ♥</p>
        </div>
      </div>
    </section>
  );
}
