import 'lenis/dist/lenis.css';

/**
 * Progressive enhancement for the Benefactor home page.
 * GSAP + ScrollTrigger choreograph the hero and reveal sections once.
 * Lenis is optional, desktop-only, and never takes over touch scrolling.
 * Nothing is hidden in the static HTML or when JavaScript fails.
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

export async function bootHomeMotion(): Promise<void> {
  if (typeof window === 'undefined' || !document.querySelector('#hero')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedData = window.matchMedia('(prefers-reduced-data: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (reducedMotion.matches || reducedData.matches || connection?.saveData) return;

  // Load the animation engine only for visitors who can benefit from it.
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const html = document.documentElement;
    html.classList.add('motion-enhanced');

    const compact = window.matchMedia('(max-width: 768px)').matches;
    const rise = compact ? 18 : 32;
    const stagger = compact ? 0.065 : 0.105;

    // The first frame stays visible without JS; only enhanced mode takes over.
    const hero = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity,visibility' } });
    hero
      .from('.hero__heading .badge', { y: 14, autoAlpha: 0, duration: 0.65 }, 0.04)
      .from('.hero__title', { y: 34, autoAlpha: 0, duration: 0.9 }, 0.12)
      .from('.hero__subtitle', { y: 23, autoAlpha: 0, duration: 0.75 }, 0.34)
      .from('.hero__actions', { y: 22, autoAlpha: 0, duration: 0.7 }, 0.48)
      .from('.hero__capabilities', { y: 16, autoAlpha: 0, duration: 0.65 }, 0.61)
      .from('.hero__video', { x: compact ? 0 : 32, y: compact ? 16 : 0, scale: 0.975, autoAlpha: 0, duration: 1.05 }, 0.25);

    document.querySelectorAll<HTMLElement>(headerSelector).forEach((header) => {
      const items = header.querySelectorAll(':scope > .badge, :scope > h2, :scope > p, :scope > .cta__actions');
      if (!items.length) return;
      gsap.from(items, {
        y: rise,
        autoAlpha: 0,
        duration: compact ? 0.65 : 0.85,
        stagger,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: header, start: 'top 88%', once: true },
      });
    });

    for (const [selector, itemSelector] of revealGroups) {
      const group = document.querySelector(selector);
      if (!group) continue;
      const items = group.querySelectorAll(itemSelector);
      if (!items.length) continue;
      gsap.from(items, {
        y: rise,
        autoAlpha: 0,
        duration: compact ? 0.62 : 0.82,
        stagger,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: group, start: 'top 89%', once: true },
      });
    }

    // Decorative-only depth; never move interactive content while scrolling.
    if (!compact) {
      gsap.to('.hero__orb', {
        xPercent: -9, yPercent: 22, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
      gsap.to('.hero__orb--2', {
        xPercent: 12, yPercent: -15, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.1 },
      });
    }

    // Light magnetic feedback on CTA links, mouse only. Keyboard and touch
    // users keep stable targets and native focus/hover behavior.
    const unbind: Array<() => void> = [];
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll<HTMLElement>('#hero-cta-primary, #cta-contact-btn').forEach((button) => {
        const move = (event: PointerEvent) => {
          const rect = button.getBoundingClientRect();
          gsap.to(button, {
            x: (event.clientX - rect.left - rect.width / 2) * 0.075,
            y: (event.clientY - rect.top - rect.height / 2) * 0.075,
            duration: 0.35, ease: 'power3.out', overwrite: 'auto',
          });
        };
        const leave = () => gsap.to(button, {
          x: 0, y: 0, duration: 0.45, ease: 'power3.out',
          overwrite: 'auto', clearProps: 'transform',
        });
        button.addEventListener('pointermove', move);
        button.addEventListener('pointerleave', leave);
        unbind.push(() => {
          button.removeEventListener('pointermove', move);
          button.removeEventListener('pointerleave', leave);
          gsap.set(button, { clearProps: 'transform' });
        });
      });
    }

    let lenis: { destroy: () => void } | undefined;
    let cancelled = false;
    if (window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) {
      // Native scrolling remains fully functional if the optional chunk fails.
      void import('lenis').then(({ default: Lenis }) => {
        if (cancelled) return;
        const instance = new Lenis({
          autoRaf: true,
          anchors: { offset: -72 },
          smoothWheel: true,
          syncTouch: false,
          duration: 1.05,
        });
        instance.on('scroll', ScrollTrigger.update);
        lenis = instance;
      }).catch(() => {});
    }

    ScrollTrigger.refresh();
    return () => {
      cancelled = true;
      lenis?.destroy();
      unbind.forEach((release) => release());
      html.classList.remove('motion-enhanced');
    };
  });
}
