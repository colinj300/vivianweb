# Vivian's Art Shop 💜

A cute, purple/pink website for displaying art and selling custom commissions,
built with Next.js, Tailwind CSS, and Stripe.

## Pages
- **Home** — welcome, featured styles, gallery preview, how-it-works
- **Gallery** — grid of artwork
- **Commissions** — customize a commission (style, canvas size, add-ons) with a
  live price total, then pay via Stripe Checkout
- **About** — artist bio
- **Contact** — a message form for questions/requests before buying

---

## 👀 Preview it on your computer

You need [Node.js](https://nodejs.org) installed (version 18 or newer).

```bash
npm install        # one time — downloads everything the site needs
npm run dev        # starts the site
```

Then open **http://localhost:3000** in your browser. Edit any file and the page
updates instantly.

> The site fully works in preview *without* any keys. The "Pay" button will show
> a friendly "payments aren't connected yet" message until you add your Stripe
> key (below). The contact form works too — messages print to the terminal until
> you connect email.

---

## ✏️ Customize the content

Almost everything you'll want to change lives in **`lib/config.js`**:
- Artist name, tagline, bio, social links, contact email
- Commission **styles** and their prices
- **Canvas sizes** and their prices
- **Add-ons** and their prices
- The gallery list

### Adding your own art
1. Put image files in the `public/art/` folder (e.g. `public/art/bunny.jpg`).
2. In `lib/config.js`, add them to the `gallery` list, e.g.
   `{ src: "/art/bunny.jpg", title: "Bunny", note: "watercolor" }`.

(Until real images are added, pretty gradient placeholders are shown.)

---

## 💳 Connect Stripe (to take real payments)

1. Make a free account at https://stripe.com
2. Copy this file: rename `.env.example` to `.env.local`
3. Paste your **Secret key** from
   https://dashboard.stripe.com/apikeys into `STRIPE_SECRET_KEY`
   - Use the **test** key (`sk_test_…`) first to try fake payments
     (card `4242 4242 4242 4242`, any future date, any CVC).
   - Switch to the **live** key (`sk_live_…`) when ready for real money.
4. Restart `npm run dev`.

Each order's details (style, size, add-ons, the buyer's description) are attached
to the payment in your Stripe Dashboard, so you'll know exactly what to make.

---

## 📬 Connect the contact form to email (optional)

1. Sign up free at https://resend.com and create an API key.
2. Put it in `.env.local` as `RESEND_API_KEY`.
3. Messages from the contact form will be emailed to the `contactEmail`
   set in `lib/config.js`.

---

## 🚀 Deploy (go live)

Easiest option is **Vercel** (free, made by the Next.js team):

1. Push this repo to GitHub (already set up).
2. Go to https://vercel.com, "Add New Project", and import this repo.
3. In the Vercel project settings → **Environment Variables**, add the same
   keys from your `.env.local` (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` set
   to your live URL, and optionally `RESEND_API_KEY` / `CONTACT_FROM`).
4. Click Deploy. Done! 🎉

> Note: we use Vercel instead of plain GitHub Pages because Stripe needs a small
> secure server function to process payments, which GitHub Pages can't run.
