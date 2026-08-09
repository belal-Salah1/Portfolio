/* Belal Salah — portfolio behaviour.
   No external libraries: IntersectionObserver reveals, native anchors,
   native smooth scroll, and a small hand-rolled scroll-linked motion layer. */

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
    toggle.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#icon-${paused ? 'play' : 'pause'}"></use></svg>`;
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

/* ── Polish layer: scroll-linked motion, no animation library ──
   Hand-rolled so ~130KB of third-party JS never has to load and
   compete with the hero image for the main thread (it was hurting LCP). */
if (!reduce) {
  const hero = document.querySelector('.hero');
  const portrait = document.querySelector('.portrait');
  const aura = document.querySelector('.aura');
  const featMedia = [...document.querySelectorAll('.feat__media')];
  const tl = document.querySelector('.tl');
  const clamp01 = n => Math.min(1, Math.max(0, n));

  let ticking = false;
  const updateScrollFX = () => {
    ticking = false;
    const vh = innerHeight;

    // portrait drifts against the scroll, across the hero section
    if (hero && portrait) {
      const p = clamp01((scrollY - hero.offsetTop) / hero.offsetHeight);
      portrait.style.transform = `translateY(${p * -13}%)`;
    }

    // the ambient glow trails behind the page
    if (aura) {
      const p = clamp01(scrollY / (document.documentElement.scrollHeight - vh));
      aura.style.transform = `translateY(${p * 10}%)`;
    }

    // featured demos float as they cross the viewport
    featMedia.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = clamp01((vh - r.top) / (vh + r.height));
      el.style.transform = `translateY(${36 - 72 * p}px)`;
    });

    // the timeline spine fills as you read down it
    if (tl) {
      const r = tl.getBoundingClientRect();
      const start = 0.78 * vh, end = 0.65 * vh - r.height;
      tl.style.setProperty('--f', clamp01((start - r.top) / (start - end)));
    }
  };

  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateScrollFX); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  updateScrollFX();
}
