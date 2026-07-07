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
    name: "The Classic Wish",
    sizes: [
      { label: "6",  price: 18, stripeLink: "" },
      { label: "12", price: 32, stripeLink: "" },
      { label: "24 (jumbo)", price: 58, stripeLink: "" },
    ],
  },
  cocoa: {
    name: "Cozy Cocoa Wish",
    sizes: [
      { label: "6",  price: 18, stripeLink: "" },
      { label: "12", price: 32, stripeLink: "" },
      { label: "24 (jumbo)", price: 58, stripeLink: "" },
    ],
  },
  whitechip: {
    name: "White Chip Wish",
    sizes: [
      { label: "6",  price: 18, stripeLink: "" },
      { label: "12", price: 32, stripeLink: "" },
      { label: "24 (jumbo)", price: 58, stripeLink: "" },
    ],
  },
  pbsandwich: {
    name: "PB Wish Sandwiches",
    sizes: [
      { label: "6",  price: 18, stripeLink: "" },
      { label: "12", price: 32, stripeLink: "" },
      { label: "24 (jumbo)", price: 58, stripeLink: "" },
    ],
  },
  variety: {
    name: "Baker's Variety Wish",
    sizes: [
      { label: "6",  price: 18, stripeLink: "" },
      { label: "12", price: 32, stripeLink: "" },
      { label: "24 (jumbo)", price: 58, stripeLink: "" },
    ],
  },
  brownies: {
    name: "Gooey Wish Brownies",
    sizes: [
      { label: "6 brownies",  price: 18, stripeLink: "" },
      { label: "12 brownies", price: 32, stripeLink: "" },
      { label: "36-count party box", price: 78, stripeLink: "" },
    ],
  },
  lemonloaf: {
    name: "Golden Lemon Bliss Loaf",
    sizes: [
      { label: "Half loaf", price: 14, stripeLink: "" },
      { label: "Full loaf", price: 24, stripeLink: "" },
    ],
  },
  tangybars: {
    name: "Tangy Wish Bars",
    sizes: [
      { label: "6",  price: 18, stripeLink: "" },
      { label: "12", price: 32, stripeLink: "" },
    ],
  },
  sourclassic: {
    name: "Classic Sourdough Loaf",
    sizes: [
      { label: "Half loaf", price: 9,  stripeLink: "" },
      { label: "Full loaf", price: 15, stripeLink: "" },
    ],
  },
  sourbacon: {
    name: "Bacon & Cheddar Sourdough",
    sizes: [
      { label: "Half loaf", price: 12, stripeLink: "" },
      { label: "Full loaf", price: 20, stripeLink: "" },
    ],
  },
  sourseasonal: {
    name: "Rotating Seasonal Sourdough",
    sizes: [
      { label: "Half loaf", price: 10, stripeLink: "" },
      { label: "Full loaf", price: 17, stripeLink: "" },
    ],
  },
  minibox: {
    name: "36-Count Mini Box",
    sizes: [
      { label: "36 minis", price: 48, stripeLink: "" },
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
  toast(`${p.name} (${size.label}) added ✦`);
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
      '<div class="cart-empty"><span class="emoji">🍪</span>Your box is empty.<br>Pick a cookie to make a wish.</div>';
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
function checkout() {
  const cart = loadCart();
  if (!cart.length) { toast("Your box is empty ✦"); return; }

  // 1) Single item with its own Stripe Payment Link → straight to Stripe.
  if (cart.length === 1) {
    const p = PRODUCTS[cart[0].key];
    const size = p && p.sizes.find(s => s.label === cart[0].size);
    if (size && size.stripeLink) { window.location.href = size.stripeLink; return; }
  }

  // 2) Main store Payment Link configured → straight to Stripe.
  if (STRIPE_CHECKOUT_LINK) { window.location.href = STRIPE_CHECKOUT_LINK; return; }

  // 3) Last resort: compose an itemized order email.
  const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const lines = cart.map(l => `• ${l.name} — ${l.size} × ${l.qty} = ${money(l.price * l.qty)}`);
  const body = [
    "Hi Jeanie & Patti,",
    "",
    "I'd like to place an order:",
    "",
    ...lines,
    "",
    `Subtotal: ${money(subtotal)}`,
    subtotal >= FREE_SHIP_THRESHOLD ? "Shipping: FREE ($100+ order)" : "Shipping: please confirm",
    "",
    "Ship to:",
    "Name:",
    "Address:",
    "Phone:",
    "",
    "Thank you!",
  ].join("\n");
  window.location.href =
    `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent("Three Wishes order ✦")}&body=${encodeURIComponent(body)}`;
}

/* ---------- drawer / UI ---------- */
function openCart() { document.body.classList.add("cart-open"); }
function closeCart() { document.body.classList.remove("cart-open"); }

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

/* size selector on product cards */
function selectSize(btn) {
  const row = btn.closest(".size-row");
  row.querySelectorAll(".size-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
  btn.setAttribute("aria-pressed", "true");
}
function addFromCard(cardEl) {
  const key = cardEl.dataset.product;
  const pressed = cardEl.querySelector('.size-btn[aria-pressed="true"]');
  const idx = pressed ? Number(pressed.dataset.sizeIndex) : 0;
  addToCart(key, idx);
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
  renderCart();
});
