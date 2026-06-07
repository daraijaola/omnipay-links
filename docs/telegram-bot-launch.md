# Telegram Mini App launch checklist

Use this after the app is pushed to GitHub and deployed to Vercel.

## 1. Deploy the website

1. Import the GitHub repo into Vercel.
2. Use build command: `npm run build`.
3. Use output directory: `dist`.
4. Deploy and copy the production URL, for example `https://omnipay-links.vercel.app`.

## 2. Update public app config

Edit `public/config.js` before the final deploy:

```js
window.OMNIPAY_CONFIG = {
  publicAppUrl: 'https://YOUR-VERCEL-DOMAIN.vercel.app',
  omnistonApiUrl: 'https://omniston.ston.fi',
  tonApiBaseUrl: 'https://tonapi.io/v2',
  telegramBotUsername: 'YOUR_BOT_USERNAME'
};
```

## 3. Update TON Connect manifest

Edit `public/tonconnect-manifest.json` with the same production domain:

```json
{
  "url": "https://YOUR-VERCEL-DOMAIN.vercel.app",
  "name": "OmniPay Links",
  "iconUrl": "https://YOUR-VERCEL-DOMAIN.vercel.app/favicon.svg",
  "termsOfUseUrl": "https://YOUR-VERCEL-DOMAIN.vercel.app/terms",
  "privacyPolicyUrl": "https://YOUR-VERCEL-DOMAIN.vercel.app/privacy"
}
```

## 4. Configure BotFather

1. Open `@BotFather` in Telegram.
2. Create or select the bot for OmniPay Links.
3. Use BotFather's Mini App / Web App configuration and set the Web App URL to the Vercel production URL.
4. Set the bot menu button to open the same Vercel URL.
5. Test from Telegram mobile by opening the bot and tapping the menu/web app button.

## 5. What credentials are needed

For the basic Mini App launch, the app only needs:

- Telegram bot username.
- Vercel production URL.
- TON Connect manifest domain.

The bot token is only needed if you want a backend bot that sends messages, handles `/start`, or creates invoices from chat. Do not commit the bot token to this repo.

## 6. Submission-ready demo path

1. Open the Mini App in Telegram.
2. Tap **Create link**.
3. Create Alice Studio's `50 USDT` invoice.
4. Share/copy the payment link.
5. Open the link as Bob.
6. Select a payment asset.
7. Fetch the Omniston quote.
8. Confirm with TON Connect or use the labeled demo fallback.
9. Show the receipt and dashboard.
