# Three Wishes Bakery

Twin nurse-owned small-batch bakery ✦ Jeanie & Patti ✦ California.
Designed and built by **Millennials Creatives LLC**.

Plain HTML, CSS, and JavaScript. No build step, no framework, no dependencies —
edit a file, refresh the browser, push.

## Ownership

This site has no third-party platform dependency. There is no `package.json`,
no lockfile, no framework, and no generated code — it is hand-authored HTML,
CSS, and JS that any static host can serve. Nothing about it can be locked to,
or reclaimed by, a site builder.

- Site code and design © Millennials Creatives LLC
- Bakery brand, recipes, copy, and photography © Three Wishes Bakery
- See [LICENSE](LICENSE) — the repo is public to be viewable as portfolio work,
  which is not the same as being licensed for reuse.

The genie effect system (`magic.css` + `magic.js`) is original work: an SVG lamp
rendered with layered gradients for volume, a smoke-curtain reveal driven by
IntersectionObserver, and a self-cleaning particle layer. ~600 lines, no
libraries.

- **Repo:** https://github.com/finessehumxn/threewishesbakery
- **Live (GitHub Pages):** https://finessehumxn.github.io/threewishesbakery/
- **Old pre-rebuild history:** preserved on the `pre-rebuild-backup` branch

## Files

```
index.html              Homepage — hero, menu, gallery, wishes, FAQ
story.html              Our story — Jeanie, Patti, and George
catering.html           Catering inquiry form
recipes.html            Recipe index
recipe-*.html           The five articles
thanks.html             Post-checkout landing page (Stripe returns here)

styles.css              Layout, components, typography
magic.css / magic.js    The genie layer — smoke, sparkles, reveals
app.js                  Cart, prices, checkout  ← EDIT PRICES HERE

netlify/functions/
  checkout.mjs          Cart → Stripe Checkout session (the real checkout)
  seed.mjs              One-time Stripe product catalog seeder
netlify.toml            Points Netlify at the functions directory

*.jpg                   All photos live at the root
logo-mark.jpg           128px header logo (logo-pink.jpg is the full-size original)
```

## Editing prices

Every price lives in `PRODUCTS` at the top of `app.js`, as dollars:

```js
classic: {
  name: "The Classic Wish",
  sizes: [
    { label: "6",  price: 15, stripeLink: "" },
    ...
```

Change the number, save, push. The cart, the totals, and the Stripe line items
all read from this one place.

## Turning on card payments

**The checkout code is finished.** `netlify/functions/checkout.mjs` builds a real
Stripe Checkout session from whatever is in the cart, applies the $100 free-shipping
threshold, handles the pickup/delivery options, and sends the customer to Stripe.

It just needs a host that can run functions — **GitHub Pages cannot.** On Pages,
`/api/checkout` returns a 404, and `checkout()` in `app.js` quietly falls back to
composing an order email instead. Orders still arrive; they just aren't paid for
online.

To switch it on:

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an
   existing project** → GitHub → pick `threewishesbakery`.
2. Leave the build command empty and the publish directory as `.`. Deploy.
3. In **Site configuration → Environment variables**, add:
   - `STRIPE_SECRET_KEY` — your live secret key from the Stripe dashboard
   - `SHIP_RATE_CENTS` — optional, defaults to `1500` ($15 nationwide cold-pack)
4. Redeploy. Card checkout is now live.

> Never paste the secret key into a file in this repo. It belongs only in Netlify's
> environment variables — the repo is public.

### The fallback chain

`checkout()` tries these in order, so the store always does *something*:

1. `POST /api/checkout` → real Stripe Checkout **(needs Netlify)**
2. A single-item cart whose size has a `stripeLink` → that Payment Link
3. `STRIPE_CHECKOUT_LINK` set at the top of `app.js` → that Payment Link
4. An itemized order email to `hello@3wishesbakery.com`

## Custom domain

Once Netlify is live: **Domain management → Add a custom domain** → `3wishesbakery.com`,
then follow its DNS instructions at your registrar. The `canonical` and `og:url` tags
in the HTML already point at that domain.

## Still to do

- **Social links** — the Instagram and TikTok links in the footer point at
  `instagram.com` and `tiktok.com`. The whole ordering model depends on Instagram
  ("menu reveals Sundays"), so these need the real handles.
- **Re-shoot `extra-pumpkin-cheesecake.jpg`** — it has social-media text burned into
  the frame, so it's the one photo not used on the site.
- **Confirm the larger-size prices** in `app.js`. The "from" prices match the
  original site; the bigger sizes were placeholders.

## Accessibility & motion

Every animation — the lamp, the smoke, the reveals, the marquee — is switched off
under `prefers-reduced-motion: reduce`. Reveal animations also force themselves
visible after 6 seconds so content can never get stuck hidden.
