/* Belal Salah — portfolio behaviour.
   No external libraries: the page is drawn by hand-rolled agent cursors,
   native anchors, native smooth scroll, and a small scroll-linked motion layer. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = getComputedStyle(document.documentElement);
const [GOLD, VOLT] = ['--gold', '--volt'].map(v => css.getPropertyValue(v).trim());
const clamp01 = n => Math.min(1, Math.max(0, n));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ── The intro: a swarm of agent cursors draws the first screen ──
   Only the header and hero are drawn this way. They're broken down to
   their smallest parts, each part starts as a dashed wireframe, and
   agents grab parts at random, click a random corner and drag to the
   opposite one — the part is clipped open exactly as far as the drag
   has got. Then the swarm gathers on the right and flies off, so
   nothing moves while you read. The rest of the page just fades in. */

// on phones the nav links sit in the closed burger menu: leave them as they are
if (document.querySelector('.burger').offsetParent) {
  document.querySelectorAll('.nav .reveal').forEach(a => a.classList.replace('reveal', 'in'));
}

const INTRO = '.head .reveal, .hero .reveal';

// break each block into parts: anything holding its own text, or media, is a
// leaf; a wrapper becomes a frame whose chrome (fill, border, shadow) is drawn
// on its own while its children build independently
const hasText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
const atomize = el => {
  if (hasText(el) || el.matches('svg, img, video, canvas')) return;
  const kids = [...el.children].filter(k => { const r = k.getBoundingClientRect(); return r.width >= 3 && r.height >= 3; });
  if (!kids.length) return;
  el.classList.add('frame');
  kids.forEach(k => { k.classList.add('reveal'); atomize(k); });
};
if (!reduce) document.querySelectorAll(INTRO).forEach(atomize);

// pieces hidden at this width (display: none) can't be drawn, so they start built
const visible = sel => [...document.querySelectorAll(sel)].filter(el => {
  if (el.getClientRects().length) return true;
  el.classList.add('in');
});
const intro = visible(INTRO);
const rest = visible('.reveal').filter(el => !intro.includes(el));

if (reduce) [...intro, ...rest].forEach(el => el.classList.add('in'));
else {
  /* the rest of the page: a quiet fade as each block scrolls in */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.classList.add('in');
  }), { rootMargin: '0px 0px -8% 0px', threshold: .05 });
  rest.forEach(el => io.observe(el));

  /* the first screen: the swarm */
  const layer = document.createElement('div');
  const stat = document.createElement('div');
  layer.className = 'agents';
  stat.className = 'bstat';
  layer.ariaHidden = stat.ariaHidden = 'true';
  document.body.append(layer, stat);

  const rand = (a, b) => a + Math.random() * (b - a);
  const add = (cls, html = '') => {
    const n = document.createElement('div');
    n.className = cls;
    n.innerHTML = html;
    return layer.appendChild(n);
  };
  const place = (n, x, y, w, h) => Object.assign(n.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  const fade = n => n.animate({ opacity: [1, 0] }, 200).finished.then(() => n.remove());
  const click = (x, y) => {
    const n = add('bclick');
    place(n, x, y, 22, 22);
    n.animate({ scale: [.2, 1.5], opacity: [1, 0] }, 380).finished.then(() => n.remove());
  };
  const docRect = el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, onScreen: r.bottom > 0 && r.top < innerHeight };
  };

  const ARROW = '<svg viewBox="0 0 13 18" width="13" height="18"><path d="M1 1v14l3.6-3.4 2.6 5.7 2.4-1.1-2.6-5.6H12z" fill="#F4F1FF" stroke="#0A0912" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  const agents = [];
  let built = 0, last = performance.now(), running = true, docked;
  const allDocked = new Promise(r => { docked = r; });

  const report = () => {
    stat.innerHTML = `<b><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></b>${agents.length} agents · ${built}/${intro.length} layers`;
  };

  // each agent has its own pace (a.p), so the swarm never moves in step
  const go = (a, x, y, k) => new Promise(done => Object.assign(a, { tx: x, ty: y, k: Math.min(.8, k * a.p), done }));

  // the box grows from the clicked corner (sx, sy) toward the cursor
  const drag = ({ x, y, job: j }) => {
    const w = Math.min(j.w, Math.abs(x - j.sx)), h = Math.min(j.h, Math.abs(y - j.sy));
    const l = j.fx ? j.sx - w : j.sx, t = j.fy ? j.sy - h : j.sy;
    place(j.sel, l, t, w, h);
    const L = (l - j.x) / j.w * 100, T = (t - j.y) / j.h * 100;
    if (!j.frame) j.el.style.clipPath = `inset(${T}% ${100 - L - w / j.w * 100}% ${100 - T - h / j.h * 100}% ${L}%)`;
  };

  const frame = now => {
    const dt = Math.min(50, now - last) / 16.7;
    last = now;
    for (const a of agents) {
      if (a.dock) {
        // docked agents hold a tight cluster on the right edge, mid-screen
        a.tx = document.documentElement.clientWidth - 48 + a.ox;
        a.ty = scrollY + innerHeight / 2 + a.oy;
      }
      const f = 1 - (1 - a.k) ** dt;
      a.x += (a.tx - a.x) * f;
      a.y += (a.ty - a.y) * f;
      a.el.style.translate = `${a.x}px ${a.y}px`;
      if (a.job) drag(a);
      if (a.done && Math.hypot(a.tx - a.x, a.ty - a.y) < 2.5) { const d = a.done; a.done = null; d(); }
    }
    if (running) requestAnimationFrame(frame);
  };

  const finish = job => {
    job.wire.remove();
    job.el.classList.add('in');
    job.el.style.clipPath = '';
    built++;
    report();
  };

  const build = async (a, job) => {
    await wait(rand(0, 220));
    Object.assign(job, docRect(job.el));
    job.frame = job.el.classList.contains('frame');
    if (!job.onScreen) return finish(job);

    job.fx = Math.random() < .5;
    job.fy = Math.random() < .5;
    job.sx = job.x + (job.fx ? job.w : 0);
    job.sy = job.y + (job.fy ? job.h : 0);
    await go(a, job.sx, job.sy, .22);

    click(job.sx, job.sy);
    job.sel = add('bsel', `<i></i><i></i><i></i><i></i><span>${Math.round(job.w)} × ${Math.round(job.h)}</span>`);
    const guide = add('bguide');
    place(guide, job.sx, job.y - 48, 1, job.h + 96);
    job.wire.remove();
    if (!job.frame) job.el.classList.add('in');
    a.job = job;
    drag(a);

    await go(a, job.sx + (job.fx ? -job.w : job.w), job.sy + (job.fy ? -job.h : job.h), .15);
    a.job = null;
    finish(job);
    setTimeout(() => { fade(job.sel); fade(guide); }, 80);
  };

  const pool = intro.map(el => {
    const { x, y, w, h } = docRect(el);
    const wire = add('bwire');
    place(wire, x, y, w, h);
    return { el, wire };
  });

  const run = async a => {
    while (pool.length) await build(a, pool.splice(Math.random() * pool.length | 0, 1)[0]);
    a.k = .1 * a.p;
    a.dock = true;
    if (built === intro.length) docked();
    await allDocked;
    // the swarm leaves together, off the right edge
    await wait(900 + rand(0, 250));
    a.dock = false;
    await go(a, document.documentElement.clientWidth + 60 + a.ox, a.y, .06);
    a.el.remove();
    agents.splice(agents.indexOf(a), 1);
    if (!agents.length) {
      running = false;
      layer.remove();
      stat.remove();
    }
  };

  // the swarm flies in from every edge; each agent has a slot in the dock,
  // where a golden-angle spiral packs them into a tight disc
  for (let i = innerWidth < 700 ? 12 : 32; i > 0; i--) {
    const side = Math.random() < .5;
    const x = side ? (Math.random() < .5 ? -30 : innerWidth + 30) : rand(0, innerWidth);
    const y = scrollY + (side ? rand(0, innerHeight) : (Math.random() < .5 ? -30 : innerHeight + 30));
    const t = agents.length * 2.4, d = 5 * Math.sqrt(agents.length);
    agents.push({ el: add('agent', ARROW), x, y, tx: x, ty: y, k: .1, p: rand(.7, 1.5), ox: Math.cos(t) * d, oy: Math.sin(t) * d });
  }
  report();
  stat.classList.add('on');
  allDocked.then(() => stat.classList.remove('on'));
  agents.forEach(run);
  requestAnimationFrame(frame);
}

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
  const featMedia = [...document.querySelectorAll('.feat__media')];
  const tl = document.querySelector('.tl');

  // timeline lock: corner brackets that snap onto the entry nearest mid-screen
  const items = tl ? [...tl.querySelectorAll('.tl__item')] : [];
  const lock = document.createElement('div');
  lock.className = 'tl__lock';
  lock.innerHTML = '<b></b><b></b><b></b><b></b><span class="tl__read"></span>';
  tl?.append(lock);
  const pad2 = n => String(n).padStart(2, '0');
  let locked = null;

  const lockOnto = it => {
    lock.style.setProperty('--ly', `${it.offsetTop - 14}px`);
    lock.style.setProperty('--lh', `${it.offsetHeight + 28}px`);
    if (it === locked) return;
    locked?.classList.remove('is-on');
    it.classList.add('is-on');
    locked = it;
    lock.querySelector('.tl__read').textContent = `LOCK ${pad2(items.indexOf(it) + 1)}/${pad2(items.length)}`;
    tl.classList.add('locked');
    lock.animate([
      { transform: 'translateX(-5px)', opacity: .3 },
      { transform: 'translateX(4px)', opacity: 1 },
      { transform: 'translateX(-1px)' },
      { transform: 'none' },
    ], { duration: 280, easing: 'steps(4)' });
  };

  let ticking = false;
  const updateScrollFX = () => {
    ticking = false;
    const vh = innerHeight;

    // portrait drifts against the scroll, across the hero section
    if (hero && portrait) {
      const p = clamp01((scrollY - hero.offsetTop) / hero.offsetHeight);
      portrait.style.transform = `translateY(${p * -13}%)`;
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

      if (r.top < vh && r.bottom > 0) {
        const dist = it => { const b = it.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - vh / 2); };
        lockOnto(items.reduce((a, b) => (dist(b) < dist(a) ? b : a)));
      }
    }
  };

  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateScrollFX); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  updateScrollFX();
}

/* ── Hero knot: a wireframe (2,3) torus knot, hand-projected ──
   No 3D library: the tube mesh is built once, then each frame is
   two rotations, a perspective divide, and six depth-binned paths.
   Gold faces you, volt falls away behind the portrait. */
const knot = document.querySelector('.knot');
const hero = document.querySelector('.hero');
if (knot) {
  const ctx = knot.getContext('2d');
  const N = 200, M = 9, TUBE = .42, BINS = 6;
  const at = t => { const r = 2 + Math.cos(3 * t); return [r * Math.cos(2 * t), r * Math.sin(2 * t), Math.sin(3 * t)]; };
  const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  const mesh = [];
  for (let i = 0; i < N; i++) {
    const t = i / N * Math.PI * 2, p = at(t), q = at(t + .01), o = at(t - .01);
    const T = norm(q.map((v, k) => v - o[k]));
    const A = norm(cross(T, [0, 0, 1])), B = cross(T, A);
    for (let j = 0; j < M; j++) {
      const a = j / M * Math.PI * 2, ca = Math.cos(a) * TUBE, sa = Math.sin(a) * TUBE;
      mesh.push(p.map((v, k) => v + ca * A[k] + sa * B[k]));
    }
  }

  const proj = new Float32Array(N * M * 3);
  let ay = 0, spin = 0, px = 0, py = 0, tx = 0, ty = 0, lastY = scrollY;

  const draw = () => {
    const dpr = Math.min(devicePixelRatio, 2), w = knot.clientWidth, h = knot.clientHeight;
    if (knot.width !== Math.round(w * dpr)) { knot.width = Math.round(w * dpr); knot.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const s = Math.min(w, h) * .14, yaw = ay + px * .6, pitch = .55 + py * .4;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
    mesh.forEach(([x, y, z], n) => {
      const x1 = x * cy + z * sy, z1 = z * cy - x * sy;
      const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx, f = 9 / (9 - z2);
      proj[n * 3] = w / 2 + x1 * s * f;
      proj[n * 3 + 1] = h / 2 + y2 * s * f;
      proj[n * 3 + 2] = z2;
    });

    const paths = Array.from({ length: BINS }, () => new Path2D());
    const seg = (a, b) => {
      const z = (proj[a * 3 + 2] + proj[b * 3 + 2]) / 2;
      const p = paths[Math.min(BINS - 1, Math.max(0, Math.floor((z + 3.5) / 7 * BINS)))];
      p.moveTo(proj[a * 3], proj[a * 3 + 1]);
      p.lineTo(proj[b * 3], proj[b * 3 + 1]);
    };
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
      seg(i * M + j, ((i + 1) % N) * M + j);
      if (i % 5 === 0) seg(i * M + j, i * M + (j + 1) % M);
    }

    paths.forEach((p, b) => {
      ctx.strokeStyle = b < BINS / 2 ? VOLT : GOLD;
      ctx.globalAlpha = [.16, .26, .38, .55, .8, 1][b];
      ctx.lineWidth = b < BINS / 2 ? 1 : 1.25;
      ctx.stroke(p);
    });
  };

  if (reduce) {
    draw();
    addEventListener('resize', draw);
  } else {
    let running = false;
    const loop = () => {
      if (!running) return;
      spin += Math.min(.05, Math.abs(scrollY - lastY) * .0004);
      lastY = scrollY;
      spin *= .92;
      ay += .004 + spin;
      px += (tx - px) * .05; py += (ty - py) * .05;
      draw();
      requestAnimationFrame(loop);
    };
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) loop();
    }).observe(hero);
    hero.addEventListener('pointermove', e => {
      tx = e.clientX / innerWidth * 2 - 1;
      ty = e.clientY / innerHeight * 2 - 1;
    });
  }
}
