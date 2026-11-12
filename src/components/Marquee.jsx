import ScrollVelocity from './reactbits/ScrollVelocity';
import './Marquee.css';

/** Two crossing "tape" bands that speed up with your scroll (React Bits ScrollVelocity). */
export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__tape marquee__tape--red">
        <ScrollVelocity
          texts={['Hot ✦ Fresh ✦ Delicious ✦ Made With Love ✦ ']}
          velocity={42}
          numCopies={6}
          className="marquee__text"
          parallaxClassName="marquee__parallax"
          scrollerClassName="marquee__scroller"
        />
      </div>
      <div className="marquee__tape marquee__tape--yellow">
        <ScrollVelocity
          texts={['Dream Big ✦ Dream Pizza ✦ Takeout & Uber Eats ✦ ']}
          velocity={-36}
          numCopies={6}
          className="marquee__text"
          parallaxClassName="marquee__parallax"
          scrollerClassName="marquee__scroller"
        />
      </div>
    </div>
  );
}
