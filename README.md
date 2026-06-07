# OmniPay Links

> **STON.fi Vibe Coding Hackathon — Cohort 2 Submission**

**One-liner:** Accept any supported token, settle in the TON asset you want — payment links powered by STON.fi Omniston.

OmniPay Links is a Telegram Mini App for creators, freelancers, DAOs, community admins, and mini-app sellers who need payment links. A merchant creates an invoice, chooses the settlement asset they want to receive (TON or USDT on TON), and shares a Telegram-native checkout link. The payer opens the link, chooses the supported asset they already hold, requests an Omniston quote, and confirms a TON wallet transaction.

## Live demo

| | |
|---|---|
| **Production URL** | https://dist-gywcctlx.devinapps.com |
| **Telegram Bot** | [@Omnipaylink_bot](https://t.me/Omnipaylink_bot) |
| **Track** | STON.fi (Omniston v1beta8) |
| **AI Tools Used** | Devin (Cognition AI) |

## Hackathon alignment

STON.fi Vibe Coding Hackathon Cohort 2 — targeting the **STON.fi track** with Omniston v1beta8 adapter integration.

- **STON.fi track:** Omniston v1beta8 quote/routing adapter in `src/integrations/omniston/client.ts`
- **TON Connect:** Real `@tonconnect/ui` SDK integration for wallet connection and transaction signing
- **Telegram Mini App:** Full WebApp SDK support with haptics, back button, share links, and theme params

## MVP flows

1. **Merchant onboarding** — Connect wallet → set settlement asset → generate shareable payment link
2. **Payer checkout** — Open link → select payment asset → fetch Omniston quote → confirm transaction
3. **Receipt** — Transaction status, merchant/payer wallets, amounts, tx hash, Telegram share
4. **Dashboard** — Invoice metrics, paid/pending status, quick actions

## Tech stack

- **TypeScript** with strict mode
- **Vite** for build and dev server
- **@tonconnect/ui** — Real TON Connect SDK for wallet connection
- **@ston-fi/omniston-sdk** — Omniston SDK (HTTP adapter with v1beta8 API)
- **Telegram WebApp SDK** — Native Mini App runtime
- **LocalStorage** persistence (hackathon MVP)
- **Vercel-ready** with SPA rewrites

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Environment variables

Copy `.env.example` and configure:

```bash
VITE_PUBLIC_APP_URL=https://your-domain.vercel.app
VITE_TONCONNECT_MANIFEST_URL=https://your-domain.vercel.app/tonconnect-manifest.json
VITE_OMNISTON_API_URL=https://omniston.ston.fi
VITE_TONAPI_BASE_URL=https://tonapi.io/v2
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

## Deployment

1. Push this repo to GitHub
2. Import in Vercel (or deploy `dist/` to any static host)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables from `.env.example`
6. Deploy

## Submission checklist

- [x] Project name: OmniPay Links
- [x] One-liner and short description
- [x] Functional working app
- [x] TON wallet integration (TON Connect UI SDK)
- [x] STON.fi Omniston v1beta8 adapter
- [x] Telegram Mini App runtime support
- [x] GitHub repository
- [x] Live production URL
- [ ] Video presentation / Loom demo
