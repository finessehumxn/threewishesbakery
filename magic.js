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
  /* THE LAMP IS THE LOGO.
     lamp-logo.png is cropped straight out of logo-pink.jpg — the ornate
     engraved lamp with the tapered spout, the domed finial, the scrolled
     C-handle and the pedestal foot. Earlier versions used a lamp I drew,
     which was not the brand's lamp and looked nothing like it.

     The source is black linework on cream, so blend modes do the work of a
     transparent PNG: `multiply` drops the cream on light backgrounds, and
     `invert + screen` turns it into glowing light linework on the dark
     smoke veil. Volume comes from stacked drop-shadows in CSS.
     `variant` picks which treatment applies. */
  function lampSVG(cls, uid) {
    // lamp-3d.png is the 3D render from the Lovable build — purple and gold
    // with real alpha. Same asset at both sizes, so the hero lamp and the
    // one sitting on each veiled image are unmistakably the same object.
    return `<img class="${cls}" src="lamp-3d.png" alt="" width="560" height="420" decoding="async">`;
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

    // Deliberately NOT .card-photo. Covering a menu photo in opaque smoke
    // hides the product at the exact moment someone is deciding whether to
    // buy it — a food shop has to show the food. The reveal runs on the
    // gallery, where the delight costs nothing.
    const shots = document.querySelectorAll(".drop-tile");
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
      }, 700);
    };

    /* Fire only when a tile reaches the middle band of the viewport, so each
       one reveals as you actually scroll to it. A whole row still enters
       together on desktop, so stagger by position — it cascades left to
       right instead of the whole row popping at once. */
    const io = new IntersectionObserver(
      entries => {
        const arriving = entries.filter(e => e.isIntersecting).map(e => e.target);
        arriving.forEach((el, i) => {
          io.unobserve(el);
          setTimeout(() => grant(el), i * 220);
        });
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 }
    );
    shots.forEach(s => io.observe(s));

    /* Safety without spoiling the effect: reveal only what the visitor has
       already scroll PAST. A blanket timer used to blow every tile on the
       page at once while they were still reading the hero, which is exactly
       what "all at once" looked like. */
    let sweeping;
    addEventListener("scroll", () => {
      clearTimeout(sweeping);
      sweeping = setTimeout(() => {
        shots.forEach(el => {
          if (el.dataset.granted) return;
          if (el.getBoundingClientRect().bottom < 0) {
            el.dataset.granted = "1";
            el.classList.add("blown");
          }
        });
      }, 250);
    }, { passive: true });
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
