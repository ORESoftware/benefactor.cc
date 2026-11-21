import 'lenis/dist/lenis.css';
import { resolveMotionPolicy } from './motion-policy';
import type { MotionCapabilities } from './motion-policy';

/**
 * A progressive enhancement, never required for content or navigation.
 * Motion is rebuilt on responsive breakpoint changes; Lenis is isolated
 * behind its own media query and is destroyed whenever it stops matching.
 */
const revealGroups = [
  ['.stats__grid', '.stats__item'],
  ['.services__grid', '.services__card'],
  ['.competencies__rows', '.competencies__row'],
  ['.process__timeline', '.process__step'],
  ['.portfolio__grid', '.portfolio__card'],
  ['.team__grid', '.team__member'],
  ['.voices__grid', '.voices__card'],
] as const;

const headerSelector = [
  '.services__header',
  '.competencies__header',
  '.process__header',
  '.portfolio__header',
  '.team__header',
  '.voices__header',
  '.cta__content',
].join(', ');

interface ConnectionWithSaveData {
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
}

function capabilities(): MotionCapabilities {
  const match = (query: string) => window.matchMedia(query).matches;
  const connection = (navigator as Navigator & { connection?: ConnectionWithSaveData }).connection;
  return {
    reducedMotion: match('(prefers-reduced-motion: reduce)'),
    reducedData: match('(prefers-reduced-data: reduce)'),
    saveData: Boolean(connection?.saveData),
    compactViewport: match('(max-width: 768px)'),
    wideViewport: match('(min-width: 1024px)'),
    finePointer: match('(pointer: fine)'),
  };
}

let bootPromise: Promise<void> | undefined;

export function bootHomeMotion(): Promise<void> {
  if (bootPromise) return bootPromise;
  bootPromise = initializeMotion();
  return bootPromise;
}

async function initializeMotion(): Promise<void> {
  if (typeof window === 'undefined' || !document.querySelector('#hero')) return;
  if (!resolveMotionPolicy(capabilities()).animate) return;

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);

  // Loading takes time; recheck user preferences before changing any styles.
  if (!resolveMotionPolicy(capabilities()).animate) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  const html = document.documentElement;
  const connection = (navigator as Navigator & { connection?: ConnectionWithSaveData }).connection;
  const reducedData = window.matchMedia('(prefers-reduced-data: reduce)');

  function setup(compact: boolean): (() => void) | undefined {
    const policy = resolveMotionPolicy(capabilities());
    if (!policy.animate) return;

    html.classList.add('motion-enhanced');
    const rise = compact ? 18 : 32;
    const stagger = compact ? 0.065 : 0.105;
    const unbind: Array<() => void> = [];

    // Do not replay the intro when the user rotates/resizes mid-page.
    if (window.scrollY < window.innerHeight * 0.5) {
      const hero = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity,visibility' } });
      hero
        .from('.hero__heading .badge', { y: 14, opacity: 0, duration: 0.65 }, 0.04)
        .from('.hero__title', { y: 34, opacity: 0, duration: 0.9 }, 0.12)
        .from('.hero__subtitle', { y: 23, opacity: 0, duration: 0.75 }, 0.34)
        .from('.hero__actions', { y: 22, opacity: 0, duration: 0.7 }, 0.48)
        .from('.hero__capabilities', { y: 16, opacity: 0, duration: 0.65 }, 0.61)
        .from('.hero__video', { x: compact ? 0 : 32, y: compact ? 16 : 0, scale: 0.975, opacity: 0, duration: 1.05 }, 0.25);
    }

    document.querySelectorAll<HTMLElement>(headerSelector).forEach((header) => {
      const items = header.querySelectorAll(':scope > .badge, :scope > h2, :scope > p, :scope > .cta__actions');
      if (!items.length) return;
      gsap.from(items, {
        y: rise, opacity: 0, duration: compact ? 0.65 : 0.85,
        stagger, ease: 'power3.out', clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: header, start: 'top 88%', once: true },
      });
    });

    for (const [selector, itemSelector] of revealGroups) {
      const group = document.querySelector(selector);
      if (!group) continue;
      const items = group.querySelectorAll(itemSelector);
      if (!items.length) continue;

      if (compact) {
        // Tall single-column mobile sections need per-card entrance triggers.
        // A grid-wide trigger would animate lower cards long before they appear.
        items.forEach((item) => {
          gsap.from(item, {
            y: rise, opacity: 0, duration: 0.62, ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: item, start: 'top 91%', once: true },
          });
        });
      } else {
        gsap.from(items, {
          y: rise, opacity: 0, duration: 0.82,
          stagger, ease: 'power3.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger: group, start: 'top 89%', once: true },
        });
      }
    }

    if (policy.parallax) {
      // Ambient decoration only. Interactive content is never scroll-scrubbed.
      gsap.to('.hero__orb', {
        xPercent: -9, yPercent: 22, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
      gsap.to('.hero__orb--2', {
        xPercent: 12, yPercent: -15, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.1 },
      });
    }

    if (!compact && capabilities().finePointer) {
      document.querySelectorAll<HTMLElement>('#hero-cta-primary, #cta-contact-btn').forEach((button) => {
        const leave = () => gsap.to(button, {
          x: 0, y: 0, duration: 0.4, ease: 'power3.out',
          overwrite: 'auto', clearProps: 'transform',
        });
        const move = (event: PointerEvent) => {
          if (button.matches(':focus-visible')) return;
          const rect = button.getBoundingClientRect();
          gsap.to(button, {
            x: (event.clientX - rect.left - rect.width / 2) * 0.075,
            y: (event.clientY - rect.top - rect.height / 2) * 0.075,
            duration: 0.32, ease: 'power3.out', overwrite: 'auto',
          });
        };
        const focus = () => { gsap.killTweensOf(button); gsap.set(button, { x: 0, y: 0, clearProps: 'transform' }); };
        button.addEventListener('pointermove', move, { passive: true });
        button.addEventListener('pointerleave', leave);
        button.addEventListener('focusin', focus);
        unbind.push(() => {
          button.removeEventListener('pointermove', move);
          button.removeEventListener('pointerleave', leave);
          button.removeEventListener('focusin', focus);
          gsap.killTweensOf(button);
          gsap.set(button, { clearProps: 'transform' });
        });
      });
    }

    ScrollTrigger.refresh();
    return () => {
      unbind.forEach((release) => release());
      html.classList.remove('motion-enhanced');
    };
  }

  // Distinct media scopes guarantee responsive GSAP teardown/recreation.
  media.add('(prefers-reduced-motion: no-preference) and (max-width: 768px)', () => setup(true));
  media.add('(prefers-reduced-motion: no-preference) and (min-width: 769px)', () => setup(false));

  // Lenis lifecycle is independent of the 768px animation breakpoint. Lazy
  // importing is cancellable, so a resize cannot resurrect a stale instance.
  media.add('(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    if (!resolveMotionPolicy(capabilities()).smoothScroll) return;
    let active = true;
    let lenis: { destroy: () => void } | undefined;

    void import('lenis').then(({ default: Lenis }) => {
      if (!active || !resolveMotionPolicy(capabilities()).smoothScroll) return;
      const instance = new Lenis({
        autoRaf: true,
        anchors: { offset: -72 },
        smoothWheel: true,
        syncTouch: false,
        duration: 1.05,
      });
      instance.on('scroll', ScrollTrigger.update);
      lenis = instance;
      ScrollTrigger.refresh();
    }).catch(() => {
      // Native scrolling is always available; an optional chunk is never fatal.
    });

    return () => { active = false; lenis?.destroy(); };
  });

  // React to data-saving requests made after initialization. Reduced-motion
  // changes are managed automatically by the media scopes above.
  const onDataChange = () => {
    if (!resolveMotionPolicy(capabilities()).animate) {
      media.revert();
      html.classList.remove('motion-enhanced');
    }
  };
  connection?.addEventListener?.('change', onDataChange);
  reducedData.addEventListener?.('change', onDataChange);

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) ScrollTrigger.refresh();
  };
  window.addEventListener('pageshow', onPageShow);
}
