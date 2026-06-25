# Vivian's Art Shop 💜

A cute, pastel-purple website for displaying art and taking custom commission
requests, built with Next.js, Tailwind CSS, and Stripe.

## Pages
- **Home** — welcome, how commissions work, gallery preview
- **Gallery** — grid of artwork
- **Commissions** — pick a canvas size, add subjects/background, describe the
  idea, and get an **estimate**. Sends a request (no instant charge).
- **About** — artist bio
- **Contact** — a message form for questions before ordering
- **Admin** (`/admin`) — your private dashboard to review requests, manage the
  8-slot limit + waitlist, and send Stripe payment links

## How a commission flows
1. Buyer builds a request and sees an **estimate** (canvas base price + $20 per
   extra subject + $10 for a complex background).
2. You get a **text (and email)** with the request. It's saved to `/admin`.
3. You review it, set the **final price**, and click **Create payment link** —
   Stripe makes a secure link (optionally emailed to the buyer).
4. They pay; you make the art. 🎨
5. While 8 commissions are **in progress**, new requests auto-join a **waitlist**.

---

## 👀 Preview it on your computer
Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev      # open http://localhost:3000
```

Everything works in preview **without any keys**: payment links show a notice,
texts/emails print to the terminal, and the waitlist uses temporary storage.
To open the admin page in preview, set a password first:
`ADMIN_PASSWORD=test npm run dev`, then go to `/admin`.

---

## ✏️ Customize content
Almost everything lives in **`lib/config.js`**: artist name, bio, socials,
**canvas sizes & prices**, the **per-subject** and **background** prices, the
**8-commission limit**, and the gallery list. Add art images to `public/art/`.

---

## 🔌 Turn on the real features (env vars)
Copy `.env.example` to `.env.local` and fill in what you want. Each is optional.

| Feature | What to set | Where to get it |
|---|---|---|
| 📱 Text me requests | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `OWNER_PHONE` | [twilio.com](https://twilio.com) |
| 💾 Save requests + waitlist | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Vercel **Storage** tab → Upstash, or [upstash.com](https://upstash.com) |
| 🔐 Admin login | `ADMIN_PASSWORD` | pick something long & private |
| 💳 Payment links | `STRIPE_SECRET_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| 📬 Email copies | `RESEND_API_KEY`, `CONTACT_FROM` | [resend.com](https://resend.com) |

> **Important:** the database (Upstash) is what makes the 8-slot limit and
> waitlist remember between visits. In preview it works but resets when the
> server restarts — add Upstash before going live.

---

## 🚀 Deploy on Vercel
1. Push to GitHub (already set up).
2. At [vercel.com](https://vercel.com): **Add New Project** → import this repo.
3. **Storage** tab → create a free **Upstash Redis** (auto-fills the two
   `UPSTASH_…` vars).
4. **Settings → Environment Variables**: add the rest from your `.env.local`
   (Stripe, Twilio, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` = your live URL).
5. **Deploy.** 🎉

> We use Vercel (not plain GitHub Pages) because the backend — payments, texts,
> and the waitlist database — needs a small secure server, which GitHub Pages
> can't run.

---

## 🌐 Connect your own domain
After you buy a domain (Namecheap, GoDaddy, Google Domains, etc.):

1. In Vercel: **Project → Settings → Domains → Add**, type your domain
   (e.g. `vivianart.com`), and Vercel shows the DNS records to set.
2. At your domain registrar, add those records:
   - An **A record** for `@` → the IP Vercel gives, **or** the easiest route:
     set the domain's nameservers to Vercel's, or add a **CNAME** for `www`
     → `cname.vercel-dns.com`.
3. Wait a few minutes for it to verify (the green checkmark in Vercel). HTTPS is
   automatic and free.
4. Update `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com` and redeploy so
   payment links use your real domain.

That's it — no code changes needed to switch domains. 💜
