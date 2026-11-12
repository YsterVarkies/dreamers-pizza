import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/smoothScroll';
import ScrollReveal from './reactbits/ScrollReveal';
import CountUp from './reactbits/CountUp';
import { IMAGES, src, srcSet } from '../data/site';
import { emit } from '../lib/store';
import './Story.css';

const STATS = [
  { n: 9, label: 'Pizzas on the menu', sub: '5 classic · 4 signature' },
  { n: 2, label: 'Sizes', sub: '20cm & 30cm' },
  { n: 3, label: 'Loaded subs', sub: 'The Dreamer, The Boss, The Pizza' },
  { n: 6, label: 'Days a week', sub: 'Monday to Saturday' },
];

export default function Story() {
  const root = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.story__photo--a', { yPercent: 18, rotate: -7 }, { yPercent: -12, rotate: -3, ease: 'none', scrollTrigger: { trigger: root.current, scrub: true } });
      gsap.fromTo('.story__photo--b', { yPercent: 30, rotate: 8 }, { yPercent: -18, rotate: 4, ease: 'none', scrollTrigger: { trigger: root.current, scrub: true } });
      gsap.to('.story__cloud--a', { xPercent: 35, ease: 'none', scrollTrigger: { trigger: root.current, scrub: true } });
      gsap.to('.story__cloud--b', { xPercent: -30, ease: 'none', scrollTrigger: { trigger: root.current, scrub: true } });
      gsap.from('.story__stat', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.story__stats', start: 'top 88%' },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const open = (img, alt) => emit('lightbox', { src: src(img), alt, w: img.w, h: img.h });

  return (
    <section id="about" className="story section" ref={root} aria-labelledby="story-title">
      <span className="cloud story__cloud story__cloud--a" aria-hidden="true" />
      <span className="cloud story__cloud story__cloud--b" aria-hidden="true" />

      <div className="container story__grid">
        <div className="story__copy">
          <p className="eyebrow" id="story-title">Our story</p>
          <ScrollReveal
            baseOpacity={0.12}
            enableBlur
            baseRotation={2}
            blurStrength={6}
            containerClassName="story__reveal"
            textClassName="story__text display"
          >
            We’re Dreamers — a small, local pizza spot with one big idea: make pizza worth dreaming about. Fresh ingredients, big flavour, everything made with love.
          </ScrollReveal>
          <p className="story__more">
            Every pizza starts the same way — a tomato base and mozzarella — then we load it up. Grab it for takeout, or have it delivered with Uber Eats. Thank you for supporting local.
            <span className="story__heart hand"> ♥</span>
          </p>
        </div>

        <div className="story__photos">
          <button
            className="story__photo story__photo--a"
            onClick={() => open(IMAGES.ovenHero, 'Dreamers Pizza logo beside a pepperoni pizza and a glowing pizza oven.')}
          >
            <img
              src={src(IMAGES.ovenHero, 0)}
              srcSet={srcSet(IMAGES.ovenHero)}
              sizes="(max-width: 760px) 80vw, 460px"
              alt="Dreamers Pizza logo beside a pepperoni pizza and a glowing pizza oven."
              width={IMAGES.ovenHero.w}
              height={IMAGES.ovenHero.h}
              loading="lazy"
              decoding="async"
            />
            <span className="story__caption hand">fresh from the oven</span>
          </button>
          <button
            className="story__photo story__photo--b"
            onClick={() => open(IMAGES.storePlatter, 'Inside the shop: a Dreamers platter and pizza on a wooden table under the Dreamers Pizza sign.')}
          >
            <img
              src={src(IMAGES.storePlatter, 0)}
              srcSet={srcSet(IMAGES.storePlatter)}
              sizes="(max-width: 760px) 60vw, 330px"
              alt="Inside the shop: a Dreamers platter and pizza on a wooden table under the Dreamers Pizza sign."
              width={IMAGES.storePlatter.w}
              height={IMAGES.storePlatter.h}
              loading="lazy"
              decoding="async"
            />
            <span className="story__caption hand">our shop ♥ come say hi</span>
          </button>
        </div>
      </div>

      <div className="container">
        <ul className="story__stats">
          {STATS.map((s) => (
            <li key={s.label} className="story__stat">
              <span className="story__num display">
                <CountUp to={s.n} duration={1.6} />
              </span>
              <span className="story__label">{s.label}</span>
              <span className="story__sub">{s.sub}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
