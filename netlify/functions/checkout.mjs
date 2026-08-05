// Three Wishes Bakery — cart → Stripe Checkout
// No npm dependencies: calls Stripe's REST API directly.
// Requires env var STRIPE_SECRET_KEY (set in Netlify: Site configuration → Environment variables).
// Optional env var SHIP_RATE_CENTS (default 1500 = $15 nationwide cold-pack shipping).

const FREE_SHIP_CENTS = 10000; // $100+

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
  items.forEach((it, i) => {
    const name = String(it.name || "Treat").slice(0, 120);
    const size = String(it.size || "").slice(0, 60);
    const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 50);
    const cents = Math.min(Math.max(Math.round(Number(it.price) * 100) || 0, 50), 50000);
    subtotal += cents * qty;
    params.set(`line_items[${i}][quantity]`, String(qty));
    params.set(`line_items[${i}][price_data][currency]`, "usd");
    params.set(`line_items[${i}][price_data][unit_amount]`, String(cents));
    params.set(`line_items[${i}][price_data][product_data][name]`, size ? `${name} — ${size}` : name);
  });

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
    return new Response(JSON.stringify({ error: "stripe_error" }), { status: 502, headers });
  }
  return new Response(JSON.stringify({ url: data.url }), { status: 200, headers });
};

export const config = { path: "/api/checkout" };
