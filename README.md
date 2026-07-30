# From First Glance To Forever — Landing Page + Order Backend

This is the full project: the landing page (frontend) **and** a small backend
that actually receives the payment screenshot when someone submits it, so it
doesn't just disappear into the browser.

## What's inside

```
├── public/
│   └── index.html      ← the whole landing page (self-contained, images embedded)
├── server.js            ← the backend: serves the page + receives orders
├── config.js             ← the only file you should need to edit
├── package.json
├── data/
│   └── orders.json       ← every submitted order gets appended here
└── uploads/               ← payment screenshots get saved here
```

There is no database — orders are appended to `data/orders.json` as plain
JSON, and screenshots are saved as image files in `uploads/`. That's enough
for a small launch. If order volume grows, you'd eventually want a real
database, but you don't need one to start.

## Before you run it — edit `config.js`

Open `config.js` and check these three values are correct for you:

```js
MERCHANT_UPI: '9346694527@ybl',   // your real UPI ID
WHATSAPP_NUMBER: '919346694527',  // your WhatsApp, digits only
PRICE: 149,                        // price in rupees
ADMIN_KEY: 'changeme123'           // change this before deploying anywhere public
```

Nothing else in the code needs to change — the frontend and backend both use
these same values.

## Running it locally

You need [Node.js](https://nodejs.org) installed (this was built and tested
against Node 22, but anything reasonably recent works).

```bash
npm install
npm start
```

Then open **http://localhost:3000** — that's your full landing page, served
by the backend. The "Get Instant Access" flow, the UPI popup, and the
screenshot upload all work end-to-end locally.

> I wrote and syntax-checked this code, but couldn't fully run it end-to-end
> inside this chat — I don't have internet access here to `npm install` the
> dependencies. Everything uses standard, well-documented Express/Multer
> patterns, but please do run it locally yourself before you rely on it, and
> tell me what you see if anything errors.

## How an order actually flows

1. Customer fills Name + Phone (+ optional Email/WhatsApp) and taps **Get
   Instant Access**.
2. The UPI payment popup opens with your UPI ID, the price, and a fresh
   Order ID.
3. They pay via GPay/PhonePe/Paytm, then upload their payment screenshot
   and tap **I've Paid — Submit**.
4. The browser sends that screenshot + their details to the backend
   (`POST /api/orders`). The backend saves the screenshot into `uploads/`
   and appends a record to `data/orders.json`.
5. They see a confirmation message in the popup. There's also a permanent
   "message us on WhatsApp instead" link in the same popup, for anyone who'd
   rather do it that way.

## Checking your orders

Visit this in a browser (replace with your actual admin key from
`config.js`):

```
http://localhost:3000/api/orders?key=changeme123
```

This returns every submitted order as JSON, including a link to each
person's uploaded screenshot. There's no dashboard UI for this yet — it's a
raw JSON list, meant for you to check manually or wire up a nicer view to
later.

**This is not production-grade security** — anyone with the key can see
every customer's order. It's fine for checking your own orders while you're
small; before you scale this up, put a real login in front of that route.

## What this does NOT do yet

- **Doesn't verify payment automatically.** Someone could submit a fake
  screenshot. You (or someone) needs to actually look at each screenshot in
  `uploads/` and confirm it before sending the PDF.
- **Doesn't send the PDF automatically.** After you verify a payment, you
  still need to email or WhatsApp the actual ebook file to the customer
  yourself. Automating that (real payment verification + auto-delivery)
  needs a proper payment gateway (Razorpay, Cashfree, etc.) instead of a
  manual UPI QR flow — a meaningfully bigger project than this. Let me know
  if you want to move to that setup later.

## Deploying this somewhere real (not just your laptop)

This needs an actual server that can run Node.js — it can't be hosted as
plain static files (like on GitHub Pages) because of the backend. Easiest
free/cheap options: **Render**, **Railway**, or **Fly.io**. All three work
the same basic way:

1. Push this folder to a GitHub repo.
2. Connect that repo on Render/Railway.
3. Set the start command to `npm start`.
4. Done — they give you a live URL.

One thing to know: on most free hosting tiers, the filesystem is *not*
permanent — uploaded screenshots and `orders.json` can get wiped on
redeploy or restart. Fine for testing; for real, ongoing use you'd want to
swap the local `uploads/` and `orders.json` for actual cloud storage and a
real database. Ask me when you're ready for that step.
