/* Belal Salah — portfolio behaviour.
   Baseline works with no libraries: IntersectionObserver reveals, native
   anchors, native scroll. GSAP + Lenis only layer polish on top, so a
   failed CDN never leaves the page blank or unusable. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Masked heading reveal ──────────────────────────── */
document.querySelectorAll('.head2 h2').forEach(h => {
  h.innerHTML = `<span class="msk"><span>${h.innerHTML}</span></span>`;
});

/* ── Reveal on enter ───────────────────────────────── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ── Navigation ─────────────────────────────────────── */
const nav = document.getElementById('nav');
const burger = document.querySelector('.burger');

const closeMenu = () => {
  nav.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Open menu');
};

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

const links = [...nav.querySelectorAll('a')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(l => l.classList.toggle('on', l.hash === `#${e.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });

links.forEach(l => {
  const section = document.querySelector(l.hash);
  if (section) spy.observe(section);
});

/* ── Scroll progress ───────────────────────────────── */
const bar = document.querySelector('.progress');
const drawProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.setProperty('--p', max > 0 ? scrollY / max : 0);
};
addEventListener('scroll', drawProgress, { passive: true });
addEventListener('resize', drawProgress);
drawProgress();

/* ── Cursor spotlight on cards ─────────────────────── */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

/* ── Magnetic buttons ──────────────────────────────── */
if (!reduce) {
  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mgx', `${(e.clientX - r.left - r.width / 2) * 0.16}px`);
      b.style.setProperty('--mgy', `${(e.clientY - r.top - r.height / 2) * 0.28}px`);
    });
    b.addEventListener('pointerleave', () => {
      b.style.setProperty('--mgx', '0px');
      b.style.setProperty('--mgy', '0px');
    });
  });
}

/* ── Video: click-to-load walkthrough ──────────────── */
const clicky = document.querySelector('[data-demo="click"]');
if (clicky) {
  const video = clicky.querySelector('video');
  clicky.querySelector('.demo__cover').addEventListener('click', () => {
    clicky.classList.add('is-playing');
    video.controls = true;
    video.play().catch(() => {});
  });
}

/* ── Video: ambient loop, on screen only ───────────── */
const looper = document.querySelector('[data-demo="loop"]');
if (looper) {
  const video = looper.querySelector('video');
  const toggle = looper.querySelector('.demo__toggle');
  let paused = reduce;

  const setIcon = () => {
    toggle.innerHTML = `<i class="fas fa-${paused ? 'play' : 'pause'}"></i>`;
    toggle.setAttribute('aria-label', paused ? 'Play demo' : 'Pause demo');
  };
  setIcon();
  if (reduce) toggle.style.opacity = '1';

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !paused) video.play().catch(() => {});
    else video.pause();
  }, { threshold: 0.25 }).observe(looper);

  toggle.addEventListener('click', () => {
    paused = !paused;
    if (paused) video.pause(); else video.play().catch(() => {});
    setIcon();
  });
}

/* ── Polish layer: smooth scroll + scroll-linked motion ── */
if (window.gsap && window.ScrollTrigger && !reduce) {
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.documentElement.style.scrollBehavior = 'auto';

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72 });
      });
    });
  }

  // portrait drifts against the scroll
  gsap.to('.portrait', {
    yPercent: -13, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // the ambient glow trails behind the page
  gsap.to('.aura', {
    yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true },
  });

  // featured demos float as they cross the viewport
  gsap.utils.toArray('.feat__media').forEach(el => {
    gsap.fromTo(el, { y: 36 }, {
      y: -36, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // the timeline spine fills as you read down it
  const tl = document.querySelector('.tl');
  if (tl) {
    ScrollTrigger.create({
      trigger: tl, start: 'top 78%', end: 'bottom 65%', scrub: true,
      onUpdate: self => tl.style.setProperty('--f', self.progress),
    });
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
