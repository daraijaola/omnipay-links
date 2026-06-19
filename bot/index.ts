const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const APP_URL = 'https://omnipay-links.vercel.app';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendStartMessage(chatId: number) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `Welcome to *OmniPay Links* 🔗\n\nAccept any supported token, settle in the TON asset you want.\n\n*How it works:*\n1️⃣ Create a payment link\n2️⃣ Share it with your payer\n3️⃣ They pay in any token — you receive what you chose\n\nPowered by STON.fi Omniston on TON.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🚀 Open App', web_app: { url: APP_URL } }
        ], [
          { text: '📖 How it works', url: `${APP_URL}/checkout/alice-design-50-usdt` }
        ]]
      }
    })
  });
}

async function poll() {
  let offset = 0;
  console.log('Bot polling started...');
  while (true) {
    try {
      const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
      const data = await res.json() as any;
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          const msg = update.message;
          if (msg?.text === '/start') {
            await sendStartMessage(msg.chat.id);
          } else if (msg?.text === '/create') {
            await fetch(`${API}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                text: 'Create a new payment link:',
                reply_markup: { inline_keyboard: [[{ text: '➕ Create Link', web_app: { url: `${APP_URL}/create` } }]] }
              })
            });
          } else if (msg?.text === '/dashboard') {
            await fetch(`${API}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                text: 'View your invoices:',
                reply_markup: { inline_keyboard: [[{ text: '📊 Open Dashboard', web_app: { url: `${APP_URL}/dashboard` } }]] }
              })
            });
          }
        }
      }
    } catch (e) {
      console.error('Poll error:', e);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll();
