# Three Wishes Bakery — clean static rebuild

Twin nurse-owned small-batch bakery ✦ Jeanie & Patti ✦ California.
Pure HTML/CSS/JS — no build step, no framework, no Lovable dependencies. Deploys straight to GitHub Pages.

## Structure

```
index.html          Homepage (menu, minis, sisters, cookie care, recipes teaser)
catering/index.html Catering inquiry form (composes email to catering@3wishesbakery.com)
recipes/index.html  Recipes & notes
styles.css          Brand stylesheet (rose #ff85a1 · cream #fdf2f2 · cocoa #140a0a)
js/app.js           Cart, prices, checkout — EDIT PRICES + STRIPE LINKS HERE
images/             Drop your product photos here (see images/README.md)
```

## Deploy to GitHub Pages (and wipe the Lovable bot from Contributors in the same move)

The contributors list on GitHub is computed from **commit history** — deleting the `.lovable` folder doesn't remove `lovable-dev[bot]`. The only way to remove it is to replace the history. Since this is a full rebuild anyway, start fresh:

```bash
# 1. New empty folder with ONLY these rebuild files in it
cd threewishes

# 2. Fresh history authored by you
git init -b main
git add .
git commit -m "Three Wishes Bakery — clean static rebuild"

# 3. Point at the existing repo and overwrite everything
git remote add origin https://github.com/finessehumxn/3wishesbakery.git
git push --force origin main
```

Then in the repo: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save.**
Site goes live at `https://finessehumxn.github.io/3wishesbakery/`.

Also do these two so the bot can't come back:
1. **Uninstall the Lovable GitHub App**: github.com → your avatar → Settings → Applications → Installed GitHub Apps → Lovable → Configure → Uninstall (or remove this repo from its access list).
2. Inside Lovable, disconnect the GitHub integration for this project.

The Contributors panel is cached — it can take a few hours to a day to refresh after the force-push. If you want it gone instantly, the nuclear option is: delete the repo entirely and create a new `3wishesbakery` repo, then push this code — a brand-new repo has only your commits from second one.

> Note: `--force` erases the old TanStack/Lovable history permanently. You already have the export zip as a backup; if you want the old code too, download the repo zip first (Code → Download ZIP).

## Before launch checklist

1. **Photos** — the Lovable export referenced images on Lovable's CDN, which aren't included and will die when you disconnect. Save your real photos into `images/` using the filenames in `images/README.md`. Until then, cards show a branded rose/dough gradient instead of a broken image.
2. **Prices** — `js/app.js` → `PRODUCTS`. The "from" prices ($18 cookies, $14 loaf, $9 sourdough…) match your original site; the larger-size prices are placeholders I set — confirm/change them.
3. **Stripe checkout** — you're already in the right screen (Payment Links → Create link → "Products or subscriptions"):
   - **Main store link (do this first):** add your products to one Payment Link, turn on "Let customers adjust quantity" in Options, hit Create, and copy the `buy.stripe.com/...` URL. Paste it into `STRIPE_CHECKOUT_LINK` at the top of `js/app.js`. From that moment, the cart's **Checkout button sends every customer to Stripe payments.**
   - **Optional per-product links:** you can also create one Payment Link per product/size and paste each URL into that size's `stripeLink` in `PRODUCTS` — then a customer buying a single item lands directly on that product's Stripe page.
   - Only if no links are set does Checkout fall back to composing an order email to hello@3wishesbakery.com.
4. **Socials** — footer Instagram/TikTok links are placeholders; point them at the real profiles.
5. **Custom domain** (optional) — Settings → Pages → Custom domain (e.g. 3wishesbakery.com), then add the CNAME/A records at your registrar.
