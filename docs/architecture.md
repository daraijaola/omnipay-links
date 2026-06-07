# Architecture

## Routes

OmniPay Links is a static TypeScript single-page app using `history.pushState` routing:

- `/` — premium landing and judge demo entry.
- `/create` — merchant invoice creation.
- `/checkout/:slug` — payer checkout and Omniston quote request.
- `/receipt/:id` — receipt details and Telegram receipt sharing.
- `/dashboard` — merchant dashboard with invoice metrics.

## Data model

The app models hackathon data in `src/core/types.ts`:

- `Invoice`: merchant wallet, merchant name, settlement asset, amount, title, note, status, payer fields, transaction hash, and quote ID.
- `Asset`: TON assets with settlement/payment support flags.
- `Quote`: source asset, target asset, source amount, expected output, Omniston route, slippage, fee, ETA, quote status, confidence, and raw response.
- `Receipt`: status, wallets, assets, amount, transaction hash, and timestamp.

## Persistence

The MVP uses LocalStorage through `src/core/storage.ts` to keep generated invoices and receipts demo-stable without backend setup. A production version should replace this with Supabase, a TON-indexed backend, or another database. User-provided strings are escaped before rendering into the SPA templates to keep the demo safe while it uses string-rendered views.

## Omniston integration

`src/integrations/omniston/client.ts` sends a live quote request to an Omniston v1beta8-style HTTP endpoint and normalizes responses into the app quote model. If the endpoint is unreachable or blocked, it returns a quote with `status: "demo"`, and the checkout UI labels it as a demo fallback instead of a live quote.

The official React SDK packages should be added when registry access is available:

- `@ston-fi/omniston-sdk`
- `@ston-fi/omniston-sdk-react`
- `@ston-fi/api`

## Runtime config and deployment

`public/config.js` exposes non-secret public runtime config for the deployed app origin, Omniston API base URL, TonAPI base URL, and Telegram bot username. `vercel.json` configures SPA rewrites so `/checkout/:slug`, `/receipt/:id`, and `/dashboard` deep links resolve to `index.html` on Vercel.

## TON wallet integration

`src/integrations/ton/wallet.ts` initializes TON Connect UI from the browser runtime if the CDN script is available. It builds a TON transaction payload that includes OmniPay invoice/quote metadata and submits via TON Connect. If the runtime is unavailable, the app creates a demo receipt so judges can inspect the complete flow without a wallet. `src/integrations/ton/status.ts` is the TonAPI-ready status adapter for future receipt confirmation.

## Telegram Mini App integration

`src/integrations/telegram/webapp.ts` initializes Telegram WebApp runtime, expands the viewport, reads theme params into CSS variables, controls the back button, triggers haptic feedback, and opens Telegram share links.
