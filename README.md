# Belal Salah — Portfolio
Live Demo:https://belal-salah1.github.io/Portfolio/

Personal site for **Belal Salah**, full-stack engineer in Cairo. Its job is to get a project
inquiry: it states what I do, shows the work (two with video walkthroughs, plus a client project from Upwork with its review
and roadmap), lists the stack and certifications, and hands over every way to reach me.

Static site — three files, no build step, no framework. Open `index.html` and it runs.

## Design

The direction is **warm signal on deep plum**. The colour axis is semantic rather than
decorative: it runs warm to cool along the depth of the stack, and every tag, service icon,
process step and project chip inherits its hue from the layer it belongs to.

| Layer | Token | Colour |
|---|---|---|
| 01 Frontend | `.l1` | `#FFC65C` gold |
| 02 Backend | `.l2` | `#FF6A3D` flame |
| 03 AI | `.l3` | `#E23E8C` rose |
| 04 Infrastructure | `.l4` | `#5AE4F0` volt |

**Type** — Bricolage Grotesque (display), Figtree (body), JetBrains Mono (labels, eyebrows, data).

**Signature** — the stack section: four slabs whose coloured spine thickens as you engage,
running along that same warm-to-cool axis. It is the job title made legible.

**Accent** — no gradients. One flat gold (`--accent`) carries actions and emphasis; the four layer
colours above are kept for the stack.

The hero headline carries the same idea typographically: *whiteboard* is set in mono inside a
dashed wireframe box, *production* is set in the solid accent. Hovering the headline
resolves the sketch into the finished thing.

## Files

```
index.html    all markup, one page
style.css     tokens, components, motion, responsive
script.js     reveals, nav, video, scroll-linked motion
assets/
  myPhoto.webP           portrait, 4:5, shown as shot
  favicon.svg            four-slab stack mark
  Belal-Salah-CV.pdf     downloadable CV
  real-estate-demo.mp4   44 MB — click to play, never preloaded
  marketplace-demo.mp4   745 KB — ambient loop, pausable
  projects-images/       project screenshots (~2.1:1)
```

## How the JavaScript is layered

The baseline needs no libraries: `IntersectionObserver` drives every reveal, anchors are native,
scrolling is native. GSAP, ScrollTrigger and Lenis load from a CDN and only add polish on top —
smooth scroll, portrait and demo parallax, and the experience timeline's spine filling as you
read down it. If a CDN fails the page still works and nothing stays invisible.

`prefers-reduced-motion: reduce` short-circuits all of it: no smooth scroll, no parallax, no
autoplaying loop, and every reveal starts visible.

## Video handling

The two demos are treated differently on purpose:

- **Real Estate** (2 min 42 s, 44 MB) — `preload="none"` behind a designed cover. Nothing
  downloads until the visitor presses play.
- **Market-Place** (16 s, 745 KB) — muted loop that plays only while on screen, with a pause
  button so it satisfies WCAG 2.2.2.

Both were copied in as-is; re-encoding the 44 MB one down to a few MB is worth doing when
`ffmpeg` is available.

## Running it

```bash
npm run dev          # same as: python3 -m http.server 8000
# then open http://localhost:8000
```

There is nothing to install: `package.json` only holds the script, and the site has no dependencies.
A file:// open works too, but a server is closer to production.

## Deploying

GitHub Pages serves it directly from the repo root — no build. Note the 44 MB video is under
GitHub's 100 MB file limit but is the heaviest thing here by far.

## Accessibility

Skip link, semantic landmarks, visible focus rings, labelled icon-only links, `aria-expanded`
on the menu button, reduced-motion support, and a layout that holds down to 360 px.
