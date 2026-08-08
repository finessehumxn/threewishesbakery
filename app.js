/* ============================================================
   Three Wishes Bakery — cart + checkout
   ------------------------------------------------------------
   HOW TO EDIT:
   1. PRICES — every size price lives in PRODUCTS below. The
      "from $" prices match the original site; the larger-size
      prices are placeholders — set your real ones.
   2. STRIPE — create a Payment Link per product/size in your
      Stripe dashboard (Products → Payment Links) and paste the
      URL into stripeLink for that size. When a cart has items,
      checkout will use Stripe links when every item has one;
      otherwise it falls back to an email order.
   3. ORDER EMAIL — change ORDER_EMAIL if needed.
   ============================================================ */

const ORDER_EMAIL = "hello@3wishesbakery.com";

/* Paste your main Stripe Payment Link (buy.stripe.com/...) here.
   Create it in Stripe: Payment Links → Create link → "Products or
   subscriptions" → add your products → Create → copy the URL.
   When set, the cart's Checkout button sends customers straight to it. */
const STRIPE_CHECKOUT_LINK = "";

const PRODUCTS = {
  classic: {
    name: "The Three Wishes Classic",
    sizes: [
      { label: "6",  price: 15, stripeLink: "https://buy.stripe.com/fZu8wJaJV88edd4bLqeUU00" },
      { label: "12", price: 26, stripeLink: "" },
      { label: "24 Party Box", price: 39, stripeLink: "" },
    ],
  },
  cocoa: {
    name: "The Midnight Magic Wish",
    sizes: [
      { label: "6",  price: 15, stripeLink: "" },
      { label: "12", price: 26, stripeLink: "" },
      { label: "24 Party Box", price: 39, stripeLink: "" },
    ],
  },
  whitechip: {
    name: "The Pearl Wish",
    sizes: [
      { label: "6",  price: 15, stripeLink: "" },
      { label: "12", price: 26, stripeLink: "" },
      { label: "24 Party Box", price: 39, stripeLink: "" },
    ],
  },
  pbsandwich: {
    name: "The Peanut Butter Treasure",
    sizes: [
      { label: "6",  price: 15, stripeLink: "" },
      { label: "12", price: 26, stripeLink: "" },
      { label: "24 Party Box", price: 39, stripeLink: "" },
    ],
  },
  variety: {
    name: "Baker's Variety Wish",
    sizes: [
      { label: "6",  price: 15, stripeLink: "" },
      { label: "12", price: 26, stripeLink: "" },
      { label: "24 Party Box", price: 39, stripeLink: "" },
    ],
  },
  doughsleeve: {
    name: "Take-&-Bake Cookie Dough",
    sizes: [
      { label: "12 dough pucks", price: 22, stripeLink: "" },
      { label: "24 dough pucks", price: 40, stripeLink: "" },
    ],
  },
  brownies: {
    name: "The Fudgy Fortune Brownie",
    sizes: [
      { label: "6 brownies",  price: 18, stripeLink: "" },
      { label: "12 brownies", price: 32, stripeLink: "" },
      { label: "36-count party box", price: 78, stripeLink: "" },
    ],
  },
  tangybars: {
    name: "The Citrus Spell",
    sizes: [
      { label: "6",  price: 18, stripeLink: "" },
      { label: "12", price: 32, stripeLink: "" },
    ],
  },
  sourclassic: {
    name: "Classic Sourdough Loaf",
    sizes: [
      { label: "Half loaf", price: 7,  stripeLink: "" },
      { label: "Full loaf", price: 12, stripeLink: "" },
    ],
  },
  sourbacon: {
    name: "Bacon & Cheddar Sourdough",
    sizes: [
      { label: "Half loaf", price: 9, stripeLink: "" },
      { label: "Full loaf", price: 16, stripeLink: "" },
    ],
  },
  sourseasonal: {
    name: "Patti's Mystery Loaf",
    sizes: [
      { label: "Half loaf", price: 8, stripeLink: "" },
      { label: "Full loaf", price: 14, stripeLink: "" },
    ],
  },
  minibox: {
    name: "36-Count Mini Box",
    sizes: [
      { label: "36 minis", price: 36, stripeLink: "" },
    ],
  },
};

const FREE_SHIP_THRESHOLD = 100;

/* ---------- storage (falls back to memory if blocked) ---------- */
let memoryCart = [];
function loadCart() {
  try { return JSON.parse(localStorage.getItem("tw_cart") || "[]"); }
  catch { return memoryCart; }
}
function saveCart(cart) {
  memoryCart = cart;
  try { localStorage.setItem("tw_cart", JSON.stringify(cart)); } catch {}
}

/* ---------- cart ops ---------- */
function addToCart(productKey, sizeIndex) {
  const p = PRODUCTS[productKey];
  if (!p) return;
  const size = p.sizes[sizeIndex];
  const cart = loadCart();
  const existing = cart.find(l => l.key === productKey && l.size === size.label);
  if (existing) existing.qty += 1;
  else cart.push({ key: productKey, name: p.name, size: size.label, price: size.price, qty: 1 });
  saveCart(cart);
  renderCart();
  toast(`✨ Wish added to your basket — ${p.name}`);
}

function changeQty(index, delta) {
  const cart = loadCart();
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty < 1) cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function removeLine(index) {
  const cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

/* ---------- render ---------- */
function money(n) { return "$" + n.toFixed(2); }

function renderCart() {
  const cart = loadCart();
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);

  document.querySelectorAll("[data-cart-count]").forEach(el => (el.textContent = count));
  const itemsEl = document.getElementById("cartItems");
  if (!itemsEl) return;

  if (!cart.length) {
    itemsEl.innerHTML =
      '<div class="cart-empty"><span class="emoji">🧺</span><strong>Empty Wish Basket</strong><br>Your Wish Basket is waiting for a little magic.</div>';
  } else {
    itemsEl.innerHTML = cart.map((l, i) => `
      <div class="cart-line">
        <strong>${l.name}</strong>
        <span>${money(l.price * l.qty)}</span>
        <span class="sub">${l.size} · ${money(l.price)} each</span>
        <div class="qty-row">
          <button type="button" aria-label="Decrease quantity" onclick="changeQty(${i},-1)">−</button>
          <span>${l.qty}</span>
          <button type="button" aria-label="Increase quantity" onclick="changeQty(${i},1)">+</button>
          <button type="button" class="line-remove" onclick="removeLine(${i})">remove</button>
        </div>
      </div>`).join("");
  }

  const ship = !cart.length ? "—" : subtotal >= FREE_SHIP_THRESHOLD ? "FREE" : "at confirmation";
  document.getElementById("cartSubtotal").textContent = money(subtotal);
  document.getElementById("cartShipping").textContent = ship;
  document.getElementById("cartTotal").textContent =
    money(subtotal) + (ship === "at confirmation" ? " + ship" : "");
}

/* ---------- checkout ---------- */
async function checkout() {
  const cart = loadCart();
  if (!cart.length) { toast("Your Wish Basket is waiting for a little magic ✦"); return; }
  let cardCheckoutFailed = false;

  // Preferred: live Stripe Checkout via serverless function (no product catalog needed)
  try {
    const fulfillEl = document.getElementById("fulfillment");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Only what and how many. The price is looked up server-side in
        // netlify/functions/checkout.mjs — anything sent from here is ignored.
        items: cart.map(l => ({ key: l.key, size: l.size, qty: l.qty })),
        fulfillment: fulfillEl ? fulfillEl.value : "Ship nationwide",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.url) { window.location.href = data.url; return; }
    } else {
      // Card checkout is configured but Stripe refused. Say so out loud —
      // silently dropping to a mailto: made the button look broken.
      let detail = "";
      try { const d = await res.json(); detail = d.code || d.type || ""; } catch {}
      console.error("Card checkout unavailable:", res.status, detail);
      cardCheckoutFailed = true;
    }
  } catch (e) {
    console.error("Could not reach the checkout service:", e);
    cardCheckoutFailed = true;
  }

  // 1) Single item with its own Stripe Payment Link → straight to Stripe.
  if (cart.length === 1) {
    const p = PRODUCTS[cart[0].key];
    const size = p && p.sizes.find(s => s.label === cart[0].size);
    if (size && size.stripeLink) { window.location.href = size.stripeLink; return; }
  }

  // 2) Main store Payment Link configured → straight to Stripe.
  if (STRIPE_CHECKOUT_LINK) { window.location.href = STRIPE_CHECKOUT_LINK; return; }

  // 3) Last resort: an itemized order email — but tell the customer that is
  //    what is happening, and confirm it in the page in case no mail client
  //    opens, which is the common case on phones.
  if (cardCheckoutFailed) {
    toast("Card checkout is down — sending your order by email instead");
  }
  const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const lines = cart.map(l => `• ${l.name} — ${l.size} × ${l.qty} = ${money(l.price * l.qty)}`);
  const fulfillEl = document.getElementById("fulfillment");
  const fulfillment = fulfillEl ? fulfillEl.value : "Ship nationwide";
  const body = [
    "Hi Jeanie & Patti,",
    "",
    "I'd like to place an order:",
    "",
    ...lines,
    "",
    `Subtotal: ${money(subtotal)}`,
    `Fulfillment: ${fulfillment}`,
    fulfillment === "Ship nationwide"
      ? (subtotal >= FREE_SHIP_THRESHOLD ? "Shipping: FREE ($100+ order)" : "Shipping: please confirm")
      : "Local pickup/delivery — Riverside County (delivery fee by distance; we will confirm before charging)",
    "",
    "Ship to:",
    "Name:",
    "Address:",
    "Phone:",
    "",
    "Thank you!",
  ].join("\n");
  const mailto = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent("Three Wishes order ✦")}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;

  // If no mail client took over, the page is still here a moment later — so
  // put the order somewhere the customer can actually copy it from.
  setTimeout(() => {
    const items = document.getElementById("cartItems");
    if (!items || document.hidden) return;
    items.insertAdjacentHTML("afterbegin",
      '<div class="cart-fallback">' +
      "<strong>Didn't your email open?</strong>" +
      "<p>Card checkout is temporarily unavailable. Copy the order below and send it to " +
      '<a href="mailto:' + ORDER_EMAIL + '">' + ORDER_EMAIL + "</a> and we'll confirm by reply.</p>" +
      "<textarea readonly rows=\"9\">" + body.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])) + "</textarea>" +
      "</div>");
  }, 1200);
}

/* ---------- drawer / UI ---------- */
/* The cart is a modal dialog, so it has to behave like one: focus moves in,
   Tab is trapped inside while it's open, and focus returns to whatever
   opened it. Previously focus stayed on the page behind it. */
let cartOpener = null;

function openCart() {
  closeNav();
  cartOpener = document.activeElement;
  document.body.classList.add("cart-open");
  const drawer = document.querySelector(".drawer");
  if (!drawer) return;
  const first = drawer.querySelector(".drawer-close");
  if (first) first.focus();
}

function closeCart() {
  const wasOpen = document.body.classList.contains("cart-open");
  document.body.classList.remove("cart-open");
  if (wasOpen && cartOpener && typeof cartOpener.focus === "function") {
    cartOpener.focus();
  }
  cartOpener = null;
}

/* Trap Tab inside the drawer while it's open. */
document.addEventListener("keydown", e => {
  if (e.key !== "Tab" || !document.body.classList.contains("cart-open")) return;
  const drawer = document.querySelector(".drawer");
  if (!drawer) return;
  const focusable = [...drawer.querySelectorAll('button, select, a[href], input, [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.disabled && el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ---------- mobile nav ---------- */
function setNav(open) {
  document.body.classList.toggle("nav-open", open);
  const btn = document.querySelector(".nav-toggle");
  if (btn) btn.setAttribute("aria-expanded", String(open));
}
function toggleNav() { setNav(!document.body.classList.contains("nav-open")); }
function closeNav() { setNav(false); }

let toastTimer;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------- size selector + live price ---------- */
/* Picking a size used to only move the aria-pressed flag, so the card kept
   showing "from $15" whether you'd chosen 6 or a 24 Party Box. The chip now
   shows the price of the size actually selected. */
function priceForCard(cardEl) {
  const p = PRODUCTS[cardEl.dataset.product];
  if (!p) return null;
  const pressed = cardEl.querySelector('.size-btn[aria-pressed="true"]');
  const idx = pressed ? Number(pressed.dataset.sizeIndex) : 0;
  return p.sizes[idx] || null;
}

function refreshCardPrice(cardEl) {
  const size = priceForCard(cardEl);
  const chip = cardEl.querySelector(".price-chip");
  if (!size || !chip) return;
  // whole dollars read better on a small chip: $15, not $15.00
  chip.textContent = Number.isInteger(size.price) ? "$" + size.price : money(size.price);
  chip.setAttribute("aria-label", `${size.label} — ${money(size.price)}`);
}

function selectSize(btn) {
  const row = btn.closest(".size-row");
  row.querySelectorAll(".size-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
  btn.setAttribute("aria-pressed", "true");
  refreshCardPrice(btn.closest(".card"));
}

/* Set every chip from PRODUCTS on load, so the markup can never drift out of
   sync with the real prices — one source of truth. */
function initCardPrices() {
  document.querySelectorAll(".card[data-product]").forEach(refreshCardPrice);
}
function addFromCard(cardEl) {
  const key = cardEl.dataset.product;
  const pressed = cardEl.querySelector('.size-btn[aria-pressed="true"]');
  const idx = pressed ? Number(pressed.dataset.sizeIndex) : 0;
  grantWish(cardEl.querySelector(".add-btn"));
  addToCart(key, idx);
}

/* The wish-granted moment: smoke off the button, then the cart reacts.
   Purely decorative — magic.js may not be loaded, and that's fine. */
function grantWish(btn) {
  const fx = window.TWMagic;
  if (btn) {
    btn.classList.remove("granting");
    void btn.offsetWidth; // restart the animation on rapid clicks
    btn.classList.add("granting");
    if (fx) fx.poofAt(btn, { count: 12, rise: 150 });
  }
  const cart = document.querySelector(".cart-btn");
  if (cart) {
    cart.classList.remove("filled");
    void cart.offsetWidth;
    setTimeout(() => cart.classList.add("filled"), 140);
  }
}

/* catering form → email */
function sendCateringInquiry(e) {
  e.preventDefault();
  const f = e.target;
  const get = n => (f.elements[n] ? f.elements[n].value : "");
  const body = [
    `Name: ${get("name")}`,
    `Company/Org: ${get("company")}`,
    `Email: ${get("email")}`,
    `Phone: ${get("phone")}`,
    `Event type: ${get("eventType")}`,
    `Event date: ${get("eventDate")}`,
    `Guest count: ${get("guests")}`,
    `Delivery city, state: ${get("city")}`,
    "",
    "Details:",
    get("details"),
  ].join("\n");
  window.location.href =
    `mailto:catering@3wishesbakery.com?subject=${encodeURIComponent("Catering inquiry — " + get("eventType"))}&body=${encodeURIComponent(body)}`;
}

/* hide broken images gracefully (until real photos are added) */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img[data-optional]").forEach(img => {
    img.addEventListener("error", () => { img.style.display = "none"; });
  });
  // tapping a nav link closes the mobile menu (in-page anchors don't reload)
  document.querySelectorAll("#navLinks a").forEach(a => a.addEventListener("click", closeNav));
  initCardPrices();
  renderCart();
});

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  closeNav();
  closeCart();
});


/* Make 3 Wishes -> email to the sisters */
function sendWishes(e) {
  e.preventDefault();
  const f = e.target;
  if (window.TWMagic) {
    const btn = f.querySelector('button[type="submit"]');
    window.TWMagic.poofAt(btn, { count: 18, rise: 220, spread: 150, sparks: 16 });
  }
  const g = n => (f.elements[n] ? f.elements[n].value : "");
  const body = [
    `Name: ${g("wname")}`,
    `Email: ${g("wemail")}`,
    "",
    "My three wishes:",
    `1. ${g("wish1")}`,
    `2. ${g("wish2") || "-"}`,
    `3. ${g("wish3") || "-"}`,
    "",
    "Thank you! \u2726",
  ].join("\n");
  window.location.href =
    `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent("My 3 Wishes \u2726")}&body=${encodeURIComponent(body)}`;
}
