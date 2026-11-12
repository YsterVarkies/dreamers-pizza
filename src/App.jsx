import { useCallback, useEffect, useState } from 'react';
import { initSmoothScroll, ScrollTrigger } from './lib/smoothScroll';
import ClickSpark from './components/reactbits/ClickSpark';
import Preloader from './components/Preloader';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Lineup from './components/Lineup';
import Marquee from './components/Marquee';
import BlueMonday from './components/BlueMonday';
import WhatsNew from './components/WhatsNew';
import MenuSection from './components/MenuSection';
import Story from './components/Story';
import Visit from './components/Visit';
import Footer from './components/Footer';
import Lightbox from './components/Lightbox';

export default function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initSmoothScroll();
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => window.removeEventListener('load', refresh);
  }, []);

  useEffect(() => {
    if (loaded) ScrollTrigger.refresh();
  }, [loaded]);

  const onSceneReady = useCallback(() => setSceneReady(true), []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Preloader sceneReady={sceneReady} onDone={() => setLoaded(true)} />
      <Nav />
      <ClickSpark sparkColor="#ffc93c" sparkSize={11} sparkRadius={24} sparkCount={9} duration={480}>
        <main id="main">
          <Hero ready={loaded} onSceneReady={onSceneReady} />
          <Lineup />
          <Marquee />
          <BlueMonday />
          <WhatsNew />
          <MenuSection />
          <Story />
          <Visit />
        </main>
        <Footer />
      </ClickSpark>
      <Lightbox />
    </>
  );
}
