/* ============================================================
   Three Wishes Bakery — the genie layer (behaviour)
   ------------------------------------------------------------
   Smoke poofs, wish sparkles, scroll reveals, and the hero lamp.
   Pairs with magic.css. No dependencies.

   Ground rules:
   - Decoration only. If any of this fails, the store still works.
   - Nothing runs when the visitor asks for reduced motion.
   - Particles are capped and self-removing, so nothing piles up.
   ============================================================ */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const on = () => !reduced.matches;

  /* ---------- the particle stage ---------- */
  let layer;
  function stage() {
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "fx-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  const rand = (min, max) => min + Math.random() * (max - min);

  /* Animate a node, then take it back off the page. */
  function play(node, frames, opts) {
    const anim = node.animate(frames, opts);
    anim.onfinish = anim.oncancel = () => node.remove();
  }

  /* ------------------------------------------------------------
     Smoke poof — a burst of genie smoke at a point on screen.
     Used when a wish is granted (add to cart) and on the lamp.
     ------------------------------------------------------------ */
  function poof(x, y, opts) {
    if (!on()) return;
    const o = opts || {};
    const count = o.count || (coarse.matches ? 7 : 11);
    const spread = o.spread || 90;
    const rise = o.rise || 130;
    const host = stage();

    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "puff" + (i % 3 === 0 ? " rose" : "");
      const size = rand(18, 46);
      p.style.width = p.style.height = size + "px";
      p.style.left = x - size / 2 + "px";
      p.style.top = y - size / 2 + "px";
      host.appendChild(p);

      const dx = rand(-spread, spread);
      const dy = -rand(rise * 0.45, rise);
      play(
        p,
        [
          { transform: "translate(0,0) scale(.35)", opacity: 0 },
          { transform: `translate(${dx * 0.4}px,${dy * 0.35}px) scale(1)`, opacity: 0.9, offset: 0.28 },
          { transform: `translate(${dx}px,${dy}px) scale(1.9)`, opacity: 0 },
        ],
        { duration: rand(900, 1500), easing: "cubic-bezier(.2,.6,.3,1)", delay: i * 22 }
      );
    }
    sparkle(x, y, o.sparks || Math.round(count * 0.6));
  }

  /* ------------------------------------------------------------
     Sparkles — the wish-granted glitter that rides the smoke.
     ------------------------------------------------------------ */
  function sparkle(x, y, count) {
    if (!on()) return;
    const host = stage();
    const tones = ["", " rose", " white"];

    for (let i = 0; i < count; i++) {
      const s = document.createElement("div");
      s.className = "spark" + tones[i % tones.length];
      const size = rand(7, 16);
      s.style.width = s.style.height = size + "px";
      s.style.left = x - size / 2 + "px";
      s.style.top = y - size / 2 + "px";
      host.appendChild(s);

      const angle = rand(0, Math.PI * 2);
      const dist = rand(35, 130);
      play(
        s,
        [
          { transform: "translate(0,0) scale(0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist - 40}px) scale(1) rotate(180deg)`,
            opacity: 1,
            offset: 0.5,
          },
          {
            transform: `translate(${Math.cos(angle) * dist * 1.4}px,${Math.sin(angle) * dist * 1.4 - 70}px) scale(0) rotate(360deg)`,
            opacity: 0,
          },
        ],
        { duration: rand(700, 1200), easing: "cubic-bezier(.2,.7,.3,1)", delay: i * 30 }
      );
    }
  }

  /* Fire a poof centred on an element. */
  function poofAt(el, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    poof(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  /* Expose for app.js and inline handlers. */
  window.TWMagic = { poof, sparkle, poofAt };

  /* ------------------------------------------------------------
     The hero lamp — an SVG genie lamp that breathes smoke, and
     puffs on demand when you rub it.
     ------------------------------------------------------------ */
  /* A single lamp drawing, reused at three sizes: the hero centrepiece, the
     marker on each unrevealed image, and anywhere else it's wanted.
     Volume comes from layered gradients — a top highlight, a core shadow, a
     reflected bounce along the bottom edge, plus a specular hotspot. `uid`
     keeps the gradient ids unique so multiple lamps on one page don't
     inherit each other's <defs>. */
  function lampSVG(cls, uid) {
    const g = n => `${n}-${uid}`;
    return `
<svg class="${cls}" viewBox="0 0 140 104" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Genie lamp">
  <defs>
    <radialGradient id="${g('body')}" cx="36%" cy="26%" r="82%">
      <stop offset="0%" stop-color="#d9b3f2"/>
      <stop offset="26%" stop-color="#a45ee5"/>
      <stop offset="64%" stop-color="#7a45ad"/>
      <stop offset="100%" stop-color="#3d2359"/>
    </radialGradient>
    <linearGradient id="${g('bounce')}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#c58ff0" stop-opacity=".85"/>
      <stop offset="100%" stop-color="#c58ff0" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${g('spout')}" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#5b3a80"/>
      <stop offset="45%" stop-color="#9867c5"/>
      <stop offset="100%" stop-color="#c99cee"/>
    </linearGradient>
    <linearGradient id="${g('lid')}" x1="0" y1="1" x2=".4" y2="0">
      <stop offset="0%" stop-color="#7a45ad"/>
      <stop offset="55%" stop-color="#b478ea"/>
      <stop offset="100%" stop-color="#e3c9f8"/>
    </linearGradient>
    <radialGradient id="${g('gem')}" cx="34%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#fff6d8"/>
      <stop offset="45%" stop-color="#f5c451"/>
      <stop offset="100%" stop-color="#b8862a"/>
    </radialGradient>
    <linearGradient id="${g('handle')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#b478ea"/>
      <stop offset="60%" stop-color="#7a45ad"/>
      <stop offset="100%" stop-color="#4a2c6b"/>
    </linearGradient>
  </defs>

  <!-- contact shadow grounds it -->
  <ellipse cx="68" cy="96" rx="44" ry="6" fill="rgba(43,24,64,.32)"/>

  <!-- handle, behind the body -->
  <path d="M101 55c23-7 30 4 28 16-2 11-13 15-27 14" stroke="url(#${g('handle')})" stroke-width="9" stroke-linecap="round"/>
  <path d="M103 57c17-5 23 2 22 11" stroke="#d9b3f2" stroke-width="2.5" stroke-linecap="round" opacity=".75"/>

  <!-- spout -->
  <path d="M38 57 12 29l-7 8 25 28z" fill="url(#${g('spout')})"/>
  <path d="M14 31 8 38l3 3 6-7z" fill="#e3c9f8" opacity=".55"/>
  <ellipse cx="10" cy="33" rx="6.5" ry="5" transform="rotate(-42 10 33)" fill="#2b1840"/>
  <ellipse cx="10" cy="33" rx="4" ry="2.8" transform="rotate(-42 10 33)" fill="#150b20"/>

  <!-- body: base gradient, core shadow, reflected bounce, specular -->
  <ellipse cx="67" cy="64" rx="37" ry="22" fill="url(#${g('body')})"/>
  <path d="M30 64c0 13 17 22 37 22s37-9 37-22c0 0-9 15-37 15S30 64 30 64z" fill="#3d2359" opacity=".55"/>
  <path d="M34 74c7 8 19 12 33 12s26-4 33-12c-6 11-19 17-33 17s-27-6-33-17z" fill="url(#${g('bounce')})"/>
  <ellipse cx="51" cy="54" rx="15" ry="6.5" transform="rotate(-17 51 54)" fill="#fff" opacity=".42"/>
  <ellipse cx="45" cy="51" rx="6" ry="2.6" transform="rotate(-20 45 51)" fill="#fff" opacity=".75"/>

  <!-- lid -->
  <path d="M47 46c4-12 11-17 20-17s16 5 20 17z" fill="url(#${g('lid')})"/>
  <ellipse cx="67" cy="46" rx="21" ry="4.5" fill="#4a2c6b"/>
  <path d="M56 34c2-3 6-5 10-5" stroke="#f0dffa" stroke-width="2" stroke-linecap="round" opacity=".8"/>

  <!-- gem -->
  <circle cx="67" cy="24" r="6.5" fill="url(#${g('gem')})"/>
  <circle cx="65" cy="22" r="2" fill="#fffdf2"/>

  <!-- foot -->
  <path d="M45 84h44l7 9H38z" fill="#4a2c6b"/>
  <path d="M45 84h44l1 2H44z" fill="#b478ea" opacity=".5"/>
</svg>`;
  }

  let lampUid = 0;
  const LAMP_SVG = lampSVG("lamp", "hero");

  function mountLamp() {
    // sits in the hero's text column, just under the CTAs — .hero-photo
    // clips its overflow, which would cut the smoke off mid-curl
    const ctas = document.querySelector(".hero-ctas");
    if (!ctas || document.querySelector(".lamp-stage")) return;

    const stageEl = document.createElement("div");
    stageEl.className = "lamp-stage";
    stageEl.setAttribute("aria-hidden", "true");
    stageEl.innerHTML =
      LAMP_SVG +
      '<i class="lamp-smoke"></i><i class="lamp-smoke"></i><i class="lamp-smoke"></i>' +
      '<i class="lamp-smoke"></i><i class="lamp-smoke"></i>' +
      '<span class="lamp-hint">rub the lamp ✦</span>';
    ctas.insertAdjacentElement("afterend", stageEl);

    // rub the lamp for an extra wish
    const lamp = stageEl.querySelector(".lamp");
    lamp.style.pointerEvents = "auto";
    lamp.style.cursor = "pointer";
    stageEl.style.pointerEvents = "none";
    lamp.addEventListener("click", () => {
      const r = lamp.getBoundingClientRect();
      poof(r.left + r.width * 0.25, r.top + r.height * 0.2, { count: 14, rise: 190, spread: 120 });
    });
  }

  /* ------------------------------------------------------------
     Mystery loaf — swap the flat gradient for turning fog.
     ------------------------------------------------------------ */
  function mountFog() {
    document.querySelectorAll(".mystery-photo").forEach(el => {
      if (el.querySelector(".fog")) return;
      el.insertAdjacentHTML("afterbegin", '<i class="fog"></i><i class="fog b"></i>');
    });
  }

  /* ------------------------------------------------------------
     Scroll reveal — content rises in as you travel down the page.
     Classes are added by JS so a no-JS visitor sees everything.
     ------------------------------------------------------------ */
  function mountReveals() {
    if (!on() || !("IntersectionObserver" in window)) return;

    const singles = document.querySelectorAll(
      ".section-head, .minis, .sisters, .cta, .page-hero, .form-wrap, .recipe-list"
    );
    const groups = document.querySelectorAll(".grid, .care-grid, .badge-row, .facts-grid");

    singles.forEach(el => el.classList.add("reveal"));
    groups.forEach(el => el.classList.add("reveal-stagger"));

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          // photos catch the light as their card arrives
          e.target.querySelectorAll?.(".card-photo").forEach((ph, i) =>
            setTimeout(() => ph.classList.add("is-revealed"), 220 + i * 90)
          );
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    const watched = [...singles, ...groups];
    watched.forEach(el => io.observe(el));

    // Safety net: reveal animations hide content until they fire. If anything
    // is still hidden after 6s — observer edge case, offscreen container,
    // a deep link that skipped past it — show it. Content is never optional.
    setTimeout(() => {
      watched.forEach(el => el.classList.add("in"));
      io.disconnect();
    }, 6000);
  }

  /* ------------------------------------------------------------
     Wish form — each filled wish earns a spark.
     ------------------------------------------------------------ */
  function mountWishForm() {
    document.querySelectorAll('input[name^="wish"]').forEach(input => {
      const wrap = input.closest(".wish-field") || input.parentElement;
      input.addEventListener("change", () => {
        const filled = input.value.trim().length > 0;
        if (wrap) wrap.classList.toggle("granted", filled);
        if (filled && on()) {
          const r = input.getBoundingClientRect();
          sparkle(r.right - 20, r.top + r.height / 2, 5);
        }
      });
    });
  }

  /* ------------------------------------------------------------
     Boot.
     ------------------------------------------------------------ */
  /* ------------------------------------------------------------
     THE WISH REVEAL
     Each product photo starts behind an opaque iris smoke curtain.
     When it scrolls in: the lamp rattles, then the smoke blasts
     out with a flash and shockwave and the photo is exposed.

     The curtain is built here in JS and never lives in the HTML —
     if this script fails to run, every photo is simply visible.
     A shop must not hide its products behind an animation.
     ------------------------------------------------------------ */
  function mountWishReveals() {
    if (!on() || !("IntersectionObserver" in window)) return;

    const shots = document.querySelectorAll(".card-photo:not(.mystery-photo), .drop-tile");
    if (!shots.length) return;

    shots.forEach(shot => {
      shot.classList.add("wish-shot");
      shot.insertAdjacentHTML(
        "beforeend",
        '<i class="veil"></i>' +
          lampSVG("veil-lamp", "v" + lampUid++) +
          '<span class="veil-label">make a wish ✦</span>' +
          '<i class="pow-flash"></i><i class="pow-ring"></i>' +
          '<span class="granted-tag">✦ wish granted ✦</span>'
      );
    });

    const grant = shot => {
      if (shot.dataset.granted) return;
      shot.dataset.granted = "1";

      // 1. the lamp rattles, building tension
      shot.classList.add("rattling");

      // 2. then it blows — flash, shockwave, smoke out, photo exposed
      setTimeout(() => {
        shot.classList.remove("rattling");
        shot.classList.add("blown");

        const r = shot.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // heavy smoke bursting off the image, plus a gold spark shower
        poof(cx, cy, {
          count: coarse.matches ? 12 : 20,
          rise: Math.max(140, r.height * 0.9),
          spread: Math.max(120, r.width * 0.55),
          sparks: 14,
        });
      }, 500);
    };

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          grant(e.target);
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.45 }
    );
    shots.forEach(s => io.observe(s));

    // Failsafe: never leave a product photo behind a curtain.
    setTimeout(() => {
      shots.forEach(s => {
        if (s.dataset.granted) return;
        s.dataset.granted = "1";
        s.classList.add("blown");
      });
      io.disconnect();
    }, 9000);
  }

  /* ------------------------------------------------------------
     Cursor sparkle trail — desktop only, throttled to one spark
     every ~60ms so it reads as a trail, not a particle storm.
     ------------------------------------------------------------ */
  function mountTrail() {
    if (!on() || coarse.matches) return;
    let last = 0;
    document.addEventListener("pointermove", e => {
      const now = performance.now();
      if (now - last < 60) return;
      last = now;
      sparkle(e.clientX, e.clientY, 1);
    });
  }

  /* ------------------------------------------------------------
     The arrival — the genie announces itself on first paint.
     ------------------------------------------------------------ */
  function mountArrival() {
    if (!on()) return;
    const hero = document.querySelector(".hero-photo") || document.querySelector(".hero");
    if (!hero) return;
    const r = hero.getBoundingClientRect();
    setTimeout(() => {
      poof(r.left + r.width / 2, r.top + r.height / 2, {
        count: 20, rise: 240, spread: 200, sparks: 18,
      });
    }, 420);
  }

  function init() {
    mountFog();
    mountReveals();
    mountWishReveals();
    mountWishForm();
    mountLamp();      // the lamp is part of the brand, not just an animation —
                      // it mounts even under reduced motion, it just holds still
    mountTrail();
    mountArrival();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
