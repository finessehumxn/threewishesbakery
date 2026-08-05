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
  const LAMP_SVG = `
<svg class="lamp" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Genie lamp">
  <ellipse cx="68" cy="92" rx="42" ry="5" fill="rgba(20,10,10,.14)"/>
  <!-- handle -->
  <path d="M100 54c22-6 28 4 26 15-2 10-12 14-25 13" stroke="#d14d6b" stroke-width="8" stroke-linecap="round"/>
  <path d="M100 54c22-6 28 4 26 15" stroke="#ff9db5" stroke-width="3" stroke-linecap="round"/>
  <!-- spout -->
  <path d="M38 56 12 30l-6 7 24 27z" fill="#d14d6b"/>
  <ellipse cx="10" cy="34" rx="6" ry="5" transform="rotate(-42 10 34)" fill="#a83853"/>
  <!-- body -->
  <ellipse cx="66" cy="63" rx="36" ry="21" fill="#d14d6b"/>
  <path d="M30 63c0 12 16 21 36 21s36-9 36-21c0 0-8 14-36 14S30 63 30 63z" fill="#a83853"/>
  <ellipse cx="52" cy="54" rx="14" ry="6" transform="rotate(-16 52 54)" fill="rgba(255,255,255,.5)"/>
  <!-- lid + knob -->
  <path d="M47 46c4-11 11-16 19-16s15 5 19 16z" fill="#ff85a1"/>
  <ellipse cx="66" cy="46" rx="20" ry="4" fill="#a83853"/>
  <circle cx="66" cy="25" r="6" fill="#f5c451"/>
  <circle cx="64" cy="23" r="2" fill="#fff0c9"/>
  <!-- base -->
  <path d="M44 82h44l6 8H38z" fill="#a83853"/>
</svg>`;

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
