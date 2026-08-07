// Three Wishes Bakery — cart → Stripe Checkout
// No npm dependencies: calls Stripe's REST API directly.
// Requires env var STRIPE_SECRET_KEY (set in Netlify: Site configuration → Environment variables).
// Optional env var SHIP_RATE_CENTS (default 1500 = $15 nationwide cold-pack shipping).

const FREE_SHIP_CENTS = 10000; // $100+

/* ------------------------------------------------------------------
   AUTHORITATIVE PRICE LIST — prices in cents.

   This exists because the browser cannot be trusted. The previous
   version read `it.price` straight out of the request body, so anyone
   could POST a 50-cent price for a $78 party box and Stripe would
   honour it. The client now sends only WHAT and HOW MANY; every
   amount charged is looked up here.

   Keep in sync with PRODUCTS in app.js (app.js drives display only).
   If a key or size label doesn't appear here, the request is rejected.
   ------------------------------------------------------------------ */
const CATALOG = {
  classic: { name: "The Classic Wish", sizes: { "6": 1500, "12": 2600, "24 Party Box": 3900 } },
  cocoa: { name: "Cozy Cocoa Wish", sizes: { "6": 1500, "12": 2600, "24 Party Box": 3900 } },
  whitechip: { name: "White Chip Wish", sizes: { "6": 1500, "12": 2600, "24 Party Box": 3900 } },
  pbsandwich: { name: "PB Wish Sandwiches", sizes: { "6": 1500, "12": 2600, "24 Party Box": 3900 } },
  variety: { name: "Baker's Variety Wish", sizes: { "6": 1500, "12": 2600, "24 Party Box": 3900 } },
  doughsleeve: { name: "Take-&-Bake Cookie Dough", sizes: { "12 dough pucks": 2200, "24 dough pucks": 4000 } },
  brownies: { name: "Gooey Wish Brownies", sizes: { "6 brownies": 1800, "12 brownies": 3200, "36-count party box": 7800 } },
  lemonloaf: { name: "Golden Lemon Bliss Loaf", sizes: { "Half loaf": 1400, "Full loaf": 2400 } },
  tangybars: { name: "Tangy Wish Bars", sizes: { "6": 1800, "12": 3200 } },
  sourclassic: { name: "Classic Sourdough Loaf", sizes: { "Half loaf": 700, "Full loaf": 1200 } },
  sourbacon: { name: "Bacon & Cheddar Sourdough", sizes: { "Half loaf": 900, "Full loaf": 1600 } },
  sourseasonal: { name: "Patti's Mystery Loaf", sizes: { "Half loaf": 800, "Full loaf": 1400 } },
  minibox: { name: "36-Count Mini Box", sizes: { "36 minis": 3600 } },
};


export default async (req) => {
  const headers = { "Content-Type": "application/json" };
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "not_configured" }), { status: 503, headers });
  }

  let payload;
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "bad_json" }), { status: 400, headers });
  }
  const items = Array.isArray(payload.items) ? payload.items.slice(0, 30) : [];
  const fulfillment = String(payload.fulfillment || "Ship nationwide").slice(0, 80);
  if (!items.length) {
    return new Response(JSON.stringify({ error: "empty_cart" }), { status: 400, headers });
  }

  const origin = req.headers.get("origin") || "https://3wishesbakery.com";
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", origin + "/thanks.html?session_id={CHECKOUT_SESSION_ID}");
  params.set("cancel_url", origin + "/");
  params.set("metadata[fulfillment]", fulfillment);
  params.set("shipping_address_collection[allowed_countries][0]", "US");
  params.set("phone_number_collection[enabled]", "true");

  let subtotal = 0;
  const rejected = [];
  let line = 0;

  for (const it of items) {
    // Look the price up. Never read one from the request.
    const product = CATALOG[String(it.key || "")];
    const size = String(it.size || "").slice(0, 60);
    const cents = product ? product.sizes[size] : undefined;

    if (!product || typeof cents !== "number") {
      rejected.push({ key: it.key, size });
      continue;
    }

    const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 50);
    subtotal += cents * qty;
    params.set(`line_items[${line}][quantity]`, String(qty));
    params.set(`line_items[${line}][price_data][currency]`, "usd");
    params.set(`line_items[${line}][price_data][unit_amount]`, String(cents));
    params.set(`line_items[${line}][price_data][product_data][name]`, `${product.name} — ${size}`);
    line++;
  }

  if (rejected.length) {
    console.error("Rejected unknown catalog items:", rejected);
  }
  if (!line) {
    return new Response(JSON.stringify({ error: "no_valid_items" }), { status: 400, headers });
  }

  // Shipping option based on fulfillment + free-shipping threshold
  const shipCents = parseInt(process.env.SHIP_RATE_CENTS || "1500", 10);
  let shipName = "Nationwide cold-pack shipping";
  let shipAmount = shipCents;
  if (fulfillment.startsWith("Free pickup")) { shipName = "Free pickup — Riverside County"; shipAmount = 0; }
  else if (fulfillment.startsWith("Local delivery")) { shipName = "Local delivery — fee confirmed separately"; shipAmount = 0; }
  else if (subtotal >= FREE_SHIP_CENTS) { shipName = "FREE shipping ($100+ order)"; shipAmount = 0; }
  params.set("shipping_options[0][shipping_rate_data][display_name]", shipName);
  params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shipAmount));
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await resp.json();
  if (!resp.ok || !data.url) {
    // Stripe explains exactly what it didn't like — bad key, test/live mismatch,
    // account not activated. Log it so it's readable in Netlify → Logs → Functions.
    // Never returned to the browser: it can name account details.
    console.error("Stripe rejected the checkout session:", {
      status: resp.status,
      type: data?.error?.type,
      code: data?.error?.code,
      message: data?.error?.message,
      param: data?.error?.param,
    });
    // Return Stripe's type/code — these are safe, fixed identifiers like
    // "invalid_request_error" / "api_key_expired". The message is NOT returned,
    // because it can name account details.
    return new Response(JSON.stringify({
      error: "stripe_error",
      type: data?.error?.type || null,
      code: data?.error?.code || null,
      param: data?.error?.param || null,
    }), { status: 502, headers });
  }
  return new Response(JSON.stringify({ url: data.url }), { status: 200, headers });
};

export const config = { path: "/api/checkout" };
