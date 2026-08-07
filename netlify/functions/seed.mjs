// Three Wishes Bakery — one-time Stripe catalog seeder
// Visit once in a browser:  https://3wishesbakery.com/api/seed?token=YOUR_SEED_TOKEN
// Requires env vars: STRIPE_SECRET_KEY and SEED_TOKEN (both set in Netlify → Environment variables).
// Safe to re-run: skips any product whose name already exists.

const CATALOG = [
  { name: "The Classic Wish", img: "real-classic.jpg",
    desc: "Our signature chocolate chip. Buttery brown-butter dough, semi-sweet chips, crisp edges, soft center, flaky sea salt. Baked to order, shipped nationwide.",
    prices: [["6 Pack", 1500], ["12 Pack", 2600], ["24 Party Box", 3900]] },
  { name: "Cozy Cocoa Wish", img: "real-cocoa-white.jpg",
    desc: "Midnight-dark cocoa dough studded with white chocolate. Fudgy, warm, quietly dramatic.",
    prices: [["6 Pack", 1500], ["12 Pack", 2600], ["24 Party Box", 3900]] },
  { name: "White Chip Wish", img: "real-white-chip.jpg",
    desc: "Golden brown-butter dough crowded with creamy white chocolate chips. Jeanie's own order, every time.",
    prices: [["6 Pack", 1500], ["12 Pack", 2600], ["24 Party Box", 3900]] },
  { name: "PB Wish Sandwiches", img: "extra-pb-held.jpg",
    desc: "Two soft peanut butter cookies pressed around a whipped PB filling. Contains peanuts.",
    prices: [["6 Pack", 1500], ["12 Pack", 2600], ["24 Party Box", 3900]] },
  { name: "Baker's Variety Wish", img: "real-lineup.jpg",
    desc: "The Classic, the Cocoa, the White Chip — one box, zero decisions.",
    prices: [["6 Pack", 1500], ["12 Pack", 2600], ["24 Party Box", 3900]] },
  { name: "Take-&-Bake Cookie Dough", img: "dough-balls.jpg",
    desc: "Classic Wish dough scooped into frozen ready-to-bake pucks. Bake from frozen at 350°F. Keep frozen.",
    prices: [["12 Dough Pucks", 2200], ["24 Dough Pucks", 4000]] },
  { name: "Gooey Wish Brownies", img: "brownie.jpg",
    desc: "Crackle top, molten dark-chocolate center. Best eaten over the box.",
    prices: [["6 Brownies", 1800], ["12 Brownies", 3200], ["36-Count Party Box", 7800]] },
  { name: "Golden Lemon Bliss Loaf", img: "real-lemon-loaf.jpg",
    desc: "Fresh lemon juice and zest in a buttery crumb, finished with vanilla glaze. Sunshine, sliced.",
    prices: [["Half Loaf", 1400], ["Full Loaf", 2400]] },
  { name: "Tangy Wish Bars", img: "lemon-bar.jpg",
    desc: "Sharp lemon filling on buttery shortbread, under a snowfall of powdered sugar.",
    prices: [["6 Pack", 1800], ["12 Pack", 3200]] },
  { name: "Classic Sourdough Loaf", img: "real-sourdough-boule.jpg",
    desc: "Long-fermented, hand-shaped, dutch-oven baked. Crackling crust, soft open crumb. Monthly bread drop.",
    prices: [["Half Loaf", 700], ["Full Loaf", 1200]] },
  { name: "Bacon & Cheddar Sourdough", img: "real-sourdough-bacon.jpg",
    desc: "Smoky bacon and sharp cheddar folded through an open crumb. Monthly bread drop.",
    prices: [["Half Loaf", 900], ["Full Loaf", 1600]] },
  { name: "Patti's Mystery Loaf", img: "real-sourdough-crumb.jpg",
    desc: "One secret sourdough flavor a month, revealed only when it arrives. Trust the twins.",
    prices: [["Half Loaf", 800], ["Full Loaf", 1400]] },
  { name: "36-Count Mini Box", img: "cookie-tray.jpg",
    desc: "Every signature flavor, shrunk to a single perfect bite and packed 36 to a box.",
    prices: [["36 Minis", 3600]] },
];

async function stripe(key, path, params) {
  const resp = await fetch("https://api.stripe.com/v1/" + path, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + key,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? params.toString() : undefined,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error ? data.error.message : "stripe error");
  return data;
}

export default async (req) => {
  const headers = { "Content-Type": "application/json" };
  const key = process.env.STRIPE_SECRET_KEY;
  const token = process.env.SEED_TOKEN;
  const url = new URL(req.url);
  if (!key || !token) {
    return new Response(JSON.stringify({ error: "Set STRIPE_SECRET_KEY and SEED_TOKEN in Netlify environment variables first." }), { status: 503, headers });
  }
  if (url.searchParams.get("token") !== token) {
    return new Response(JSON.stringify({ error: "wrong or missing token" }), { status: 403, headers });
  }

  try {
    // fetch existing product names (up to 100) so re-runs never duplicate
    const existing = await stripe(key, "products?active=true&limit=100");
    const have = new Set((existing.data || []).map(p => p.name));

    const created = [], skipped = [];
    for (const item of CATALOG) {
      if (have.has(item.name)) { skipped.push(item.name); continue; }
      const p = new URLSearchParams();
      p.set("name", item.name);
      p.set("description", item.desc);
      p.set("images[0]", "https://3wishesbakery.com/" + item.img);
      p.set("metadata[source]", "3wishesbakery.com");
      const product = await stripe(key, "products", p);
      for (const [label, cents] of item.prices) {
        const pr = new URLSearchParams();
        pr.set("product", product.id);
        pr.set("currency", "usd");
        pr.set("unit_amount", String(cents));
        pr.set("nickname", label);
        pr.set("metadata[size]", label);
        await stripe(key, "prices", pr);
      }
      created.push(`${item.name} (${item.prices.length} price${item.prices.length > 1 ? "s" : ""})`);
    }
    return new Response(JSON.stringify({
      done: true,
      created,
      skipped_already_exist: skipped,
      next_step: "Open Stripe → Product catalog to see everything. You can now build Payment Links from these, and you may remove the SEED_TOKEN variable in Netlify.",
    }, null, 2), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers });
  }
};

export const config = { path: "/api/seed" };
