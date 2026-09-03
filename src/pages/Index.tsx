import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import LazySection from '../components/common/LazySection';
import { useDeviceCapabilities } from '../context/DeviceCapabilitiesContext';
import { analyticsAPI } from '../api/services';
import { restoreHashTarget } from '../lib/scrollTo';

/**
 * Code-split sections with custom ShimmerSkeleton variants matching their layouts.
 */
const About = lazy(() => import('../components/About'));
const Projects = lazy(() => import('../components/Projects'));
const Skills = lazy(() => import('../components/Skills'));
const Experience = lazy(() => import('../components/Experience'));
const Services = lazy(() => import('../components/Services'));
const Certificates = lazy(() => import('../components/Certificates'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const Contact = lazy(() => import('../components/Contact'));
const Footer = lazy(() => import('../components/Footer'));

/** Overlays: mounted conditionally when opened */
const ChatBot = lazy(() => import('../components/ChatBot'));
const CommandPalette = lazy(() => import('../components/common/CommandPalette'));
const CyberTerminal = lazy(() => import('../components/common/CyberTerminal'));
const ParticleCanvas = lazy(() => import('../components/common/ParticleCanvas'));

const Index = () => {
  const { enableParticles } = useDeviceCapabilities();

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isTerminalOpen, setTerminalOpen] = useState(false);

  const openTerminal = useCallback(() => setTerminalOpen(true), []);
  const closeTerminal = useCallback(() => setTerminalOpen(false), []);
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  // Analytics is fire-and-forget
  useEffect(() => {
    void analyticsAPI.track('pageview');
  }, []);

  /*
   * Deep links like `/#contact` must still work even though that section is
   * mounted lazily: the native fragment jump happens before the chunk exists.
   * `restoreHashTarget` keeps nudging the reserved placeholder into view until
   * the real section mounts, then lands on it with the navbar clearance applied.
   */
  useEffect(() => restoreHashTarget(), []);

  useEffect(() => {
    const handleOpenPalette = () => setCommandPaletteOpen(true);
    const handleOpenTerminal = () => setTerminalOpen(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
        return;
      }

      if ((event.ctrlKey && event.key === '\\') || (event.altKey && key === 't')) {
        event.preventDefault();
        setTerminalOpen((open) => !open);
      }
    };

    window.addEventListener('open-command-palette', handleOpenPalette);
    window.addEventListener('open-cyber-terminal', handleOpenTerminal);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-command-palette', handleOpenPalette);
      window.removeEventListener('open-cyber-terminal', handleOpenTerminal);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-gray-50 text-gray-900 transition-colors duration-300 selection:bg-cyan-500 selection:text-black dark:bg-gray-950 dark:text-white">
      {/* Ambient background particles */}
      {enableParticles && (
        <Suspense fallback={null}>
          <ParticleCanvas />
        </Suspense>
      )}

      {/* Overlays */}
      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette isOpen onClose={closeCommandPalette} />
        </Suspense>
      )}

      {isTerminalOpen && (
        <Suspense fallback={null}>
          <CyberTerminal isOpen onClose={closeTerminal} />
        </Suspense>
      )}

      <Navigation onOpenCommandPalette={openCommandPalette} onOpenTerminal={openTerminal} />

      <main className="relative z-10">
        <Hero />

        <LazySection minHeight="100vh" skeletonVariant="default" sectionId="about">
          <About />
        </LazySection>

        <LazySection minHeight="100vh" skeletonVariant="cards" sectionId="projects">
          <Projects />
        </LazySection>

        <LazySection minHeight="100vh" skeletonVariant="cards" sectionId="skills">
          <Skills />
        </LazySection>

        <LazySection minHeight="80vh" skeletonVariant="timeline" sectionId="experience">
          <Experience />
        </LazySection>

        <LazySection minHeight="90vh" skeletonVariant="cards" sectionId="services">
          <Services />
        </LazySection>

        <LazySection minHeight="80vh" skeletonVariant="cards" sectionId="certificates">
          <Certificates />
        </LazySection>

        <LazySection minHeight="80vh" skeletonVariant="cards" sectionId="testimonials">
          <Testimonials />
        </LazySection>

        <LazySection minHeight="90vh" skeletonVariant="default" sectionId="contact">
          <Contact />
        </LazySection>
      </main>

      <LazySection minHeight="40vh" rootMargin="400px 0px" skeletonVariant="default">
        <Footer onOpenTerminal={openTerminal} />
      </LazySection>

      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
    </div>
  );
};

export default Index;
