# 🚀 Launch checklist — Visuals by Vivian

Everything you need to take the site live today. You'll mostly be copying keys
into Vercel. Estimated time: ~30–45 min.

---

## Step 1 — Put the site on Vercel (≈5 min)
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. **Add New → Project** → import **`colinj300/vivianweb`**.
3. Set the production branch to **`claude/festive-noether-7y3g0t`** (or merge it
   into `main` first and use that).
4. Click **Deploy**. You'll get a URL like `vivianweb.vercel.app`.

You'll add the keys below under **Project → Settings → Environment Variables**,
then **redeploy** (Deployments → ⋯ → Redeploy) so they take effect.

---

## Step 2 — Database, so orders save (REQUIRED, ≈5 min)
Without this, commission requests and order tracking won't work on the live site
(serverless can't keep them in memory).
1. In your Vercel project → **Storage** tab → **Create** → **Upstash for Redis**
   (free tier is fine) → connect it to the project.
2. Vercel automatically adds `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`. Done.

---

## Step 3 — Admin password (REQUIRED, 1 min)
1. Add env var **`ADMIN_PASSWORD`** = a long, private password.
2. That unlocks your backend at **`yourdomain.com/admin`** from any device.
   Log in once and you stay signed in (secure cookie). Use the **Log out**
   button on a shared computer.

---

## Step 4 — Stripe payments (REQUIRED to get paid, ≈10 min)
1. In Stripe → **Developers → API keys**: copy your **Secret key**.
   - `sk_test_…` = test mode (use the card `4242 4242 4242 4242` to trial).
   - `sk_live_…` = real money.
2. Add env var **`STRIPE_SECRET_KEY`** = that key.
3. Add env var **`NEXT_PUBLIC_SITE_URL`** = your live URL
   (e.g. `https://vivianart.com` or the `.vercel.app` URL).
4. Redeploy.

**How payments work:** a customer sends a request → you review it in `/admin`,
set the final price, and click **Create payment link** → Stripe makes a secure
link (optionally emailed to them). They pay on Stripe's checkout page. You don't
handle card details, and no webhook is required to launch.

---

## Step 4b — Pet photo uploads (optional, ≈2 min)
So buyers can attach photos of their pet to a request.
1. In your Vercel project → **Storage** tab → **Create** → **Blob** store →
   connect it to the project.
2. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically. Photos then upload on the
   request form and show as thumbnails in `/admin`.
Without it, the form still works — people just can't attach photos.

## Step 5 — Live chat (optional, ≈10 min)
So you can message buyers in real time from your phone instead of email.
1. Sign up free at **[tawk.to](https://tawk.to)** and create a property for the
   site.
2. **Admin → Channels → Chat Widget** → copy the embed **`src`**
   (looks like `https://embed.tawk.to/XXXXXXXX/YYYYYYY`).
3. Add env var **`NEXT_PUBLIC_TAWK_SRC`** = that src, and redeploy.
4. Install the **Tawk.to app** on your phone to chat and get notifications.

The chat bubble appears in the corner site-wide once this is set.

---

## Step 6 — Notifications (optional but recommended)
- **Texts (Twilio):** add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_FROM` (your Twilio number), `OWNER_PHONE` (your cell) to get a text on
  every request and customer review.
- **Email copies (Resend):** add `RESEND_API_KEY` (and `CONTACT_FROM`) to email
  yourself requests and to auto-email payment links to customers.

Both are optional — the site works without them (you'll see everything in
`/admin`).

---

## Step 7 — Your own domain (optional)
Project → **Settings → Domains → Add** your domain, set the DNS records Vercel
shows at your registrar, then update `NEXT_PUBLIC_SITE_URL` to the new domain
and redeploy. HTTPS is automatic.

---

## Minimum to launch and get paid today
`ADMIN_PASSWORD` + Upstash (Step 2) + `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_SITE_URL`.
Add chat and notifications whenever you like.

## Your daily workflow
1. Request comes in → you get notified / see it in **/admin**.
2. Review it, set the **final price**, click **Create payment link**.
3. Click **Approve** → it gets an **order number**; share it with the customer.
4. Advance the **progress** (Not started → In progress → Ready for review).
5. Customer checks **/track**, hits **I love it!** or requests changes.
6. Mark it **Completed**.
