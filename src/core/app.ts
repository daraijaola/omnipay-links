import { ASSETS, paymentAssets, settlementAssets } from '../data/assets.js';
import { publicAppUrl } from './config.js';
import { escapeAttribute, escapeHtml } from './security.js';
import { buildOmnistonPaymentPayload, requestOmnistonQuote } from '../integrations/omniston/client.js';
import { configureBackButton, hapticLight, hapticSuccess, initTelegramMiniApp, isTelegramWebApp, shareTelegramLink } from '../integrations/telegram/webapp.js';
import { buildSettlementTransfer, connectWallet, getTonConnect, sendTonTransaction } from '../integrations/ton/wallet.js';
import { getInvoiceBySlug, getInvoices, getReceipt, saveInvoice, saveReceipt, seedDemoData, updateInvoice } from './storage.js';
import type { Invoice, Quote, Receipt } from './types.js';

const appUrl = () => publicAppUrl() || window.location.origin;
const money = (value: string, symbol: string) => `${value} ${symbol}`;
const short = (value?: string) => value ? `${value.slice(0, 8)}…${value.slice(-5)}` : 'Not connected';
const route = () => window.location.pathname;

export const startApp = () => {
  initTelegramMiniApp();
  seedDemoData();
  window.addEventListener('popstate', render);
  document.addEventListener('click', handleClicks);
  render();
  window.setTimeout(() => getTonConnect(), 500);
};

const navigate = (path: string) => {
  history.pushState({}, '', path);
  render();
};

const handleClicks = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const link = target.closest('[data-nav]') as HTMLElement | null;
  if (!link) return;
  event.preventDefault();
  hapticLight();
  navigate(link.dataset.nav || '/');
};

const shell = (content: string) => `
  <div class="ambient"></div>
  <main class="shell">
    <nav class="nav">
      <a class="brand" data-nav="/" href="/"><span class="brand-mark">◆</span><span>OmniPay Links</span></a>
      <div class="nav-actions"><a data-nav="/dashboard" href="/dashboard">Dashboard</a><a class="button button-small" data-nav="/create" href="/create">Create link</a></div>
    </nav>
    <section class="runtime-pill">${isTelegramWebApp() ? 'Running inside Telegram Mini App' : 'Web fallback active'} · STON.fi Omniston v1beta8 adapter</section>
    ${content}
    <footer class="footer">Built for STON.fi Vibe Coding Hackathon Cohort 2 · Wallet in Telegram ready · non-custodial TON checkout.</footer>
  </main>`;

const render = () => {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) return;
  const current = route();
  configureBackButton(current !== '/', () => history.back());
  if (current === '/') root.innerHTML = shell(landing());
  else if (current === '/create') root.innerHTML = shell(createPage());
  else if (current === '/dashboard') root.innerHTML = shell(dashboard());
  else if (current.startsWith('/checkout/')) root.innerHTML = shell(checkoutPage(current.split('/').pop() || ''));
  else if (current.startsWith('/receipt/')) root.innerHTML = shell(receiptPage(current.split('/').pop() || ''));
  else root.innerHTML = shell(notFound());
  bindPage();
};

const landing = () => `
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Telegram-native payment links for TON</p>
      <h1>Accept any supported token. Settle in the TON asset you want.</h1>
      <p class="lead">OmniPay Links turns STON.fi Omniston routing into a premium checkout for creators, freelancers, DAOs, and mini-app merchants.</p>
      <div class="hero-actions"><a class="button" data-nav="/create" href="/create">Create payment link</a><a class="button secondary" data-nav="/checkout/alice-design-50-usdt" href="/checkout/alice-design-50-usdt">Try judge demo</a></div>
      <div class="trust-row"><span>Omniston RFQ</span><span>TON Connect</span><span>Telegram share</span><span>Receipt tracking</span></div>
    </div>
    <div class="phone-frame">
      <div class="phone-top"></div>
      <div class="checkout-card">
        <span class="status live">Omniston-powered checkout</span>
        <h2>Design sprint deposit</h2>
        <p>Alice Studio requests <strong>50 USDT</strong> settlement.</p>
        <div class="quote-grid"><span>Bob pays</span><strong>162.5000 TON</strong><span>Alice receives</span><strong>50.00 USDT</strong><span>Route</span><strong>TON → Omniston → USDT</strong></div>
        <button class="button full">Confirm with TON wallet</button>
      </div>
    </div>
  </section>
  <section class="feature-grid">
    ${['Payment links, not swap forms', 'Merchant chooses settlement asset', 'Payer chooses what they hold', 'Quote status is transparent'].map((item) => `<article class="feature"><h3>${item}</h3><p>Built for normal Telegram commerce while Omniston hides liquidity fragmentation behind a clear routing panel.</p></article>`).join('')}
  </section>`;

const createPage = () => `
  <section class="panel narrow">
    <p class="eyebrow">Merchant flow</p><h1>Create an Omniston payment link</h1><p class="muted">Connect a wallet, choose what you want to receive, then share the checkout directly in Telegram.</p>
    <div id="ton-connect-root" class="ton-root"></div>
    <form id="invoice-form" class="form">
      <label>Merchant name<input name="merchantName" value="Alice Studio" required /></label>
      <label>Merchant TON wallet<input name="merchantWallet" value="EQDmerchantDemoWalletForJudges7r9Qh9" required /></label>
      <label>Invoice title<input name="title" value="Design sprint deposit" required /></label>
      <label>Amount<input name="settlementAmount" type="number" min="0.01" step="0.01" value="50" required /></label>
      <label>Settlement asset<select name="settlementAsset">${settlementAssets.map((asset) => `<option>${asset.symbol}</option>`).join('')}</select></label>
      <label>Note<textarea name="note">Telegram-native checkout for a landing page audit.</textarea></label>
      <button class="button full" type="submit">Generate Telegram payment link</button>
    </form>
    <div id="created-link" class="result-card hidden"></div>
  </section>`;

const checkoutPage = (slug: string) => {
  const invoice = getInvoiceBySlug(slug);
  if (!invoice) return notFound();
  const title = escapeHtml(invoice.title);
  const merchantName = escapeHtml(invoice.merchantName);
  const settlementAsset = escapeHtml(invoice.settlementAsset);
  const settlementAmount = escapeHtml(invoice.settlementAmount);
  const note = escapeHtml(invoice.note);
  return `
    <section class="checkout-layout">
      <aside class="panel"><p class="eyebrow">Invoice checkout</p><h1>${title}</h1><p class="lead">${merchantName} requests settlement in ${settlementAsset}.</p><div class="amount-due">${money(settlementAmount, settlementAsset)}</div><p class="muted">Expires ${new Date(invoice.expiresAt).toLocaleString()}</p><p>${note}</p><div id="ton-connect-root" class="ton-root"></div><button id="connect-wallet" class="button secondary full">Connect TON wallet</button></aside>
      <section class="panel quote-panel"><div class="stepper"><span class="active">1 Asset</span><span>2 Quote</span><span>3 Confirm</span></div><label>Pay with<select id="pay-asset">${paymentAssets.map((asset) => `<option>${escapeHtml(asset.symbol)}</option>`).join('')}</select></label><button id="quote-button" class="button full">Fetch Omniston quote</button><div id="quote-output" class="quote-output"></div></section>
    </section>`;
};

const receiptPage = (id: string) => {
  const receipt = getReceipt(id);
  if (!receipt) return notFound();
  const shareText = `Receipt ${receipt.id}: paid ${receipt.amount} ${receipt.receivedAsset} through OmniPay Links.`;
  const rows = [['Merchant', short(receipt.merchantWallet)], ['Payer', short(receipt.payerWallet)], ['Paid asset', receipt.paidAsset], ['Received', `${receipt.amount} ${receipt.receivedAsset}`], ['Tx hash', short(receipt.txHash)], ['Timestamp', new Date(receipt.timestamp).toLocaleString()]];
  return `<section class="panel narrow receipt"><span class="status ${receipt.status === 'paid' ? 'live' : 'demo'}">${escapeHtml(receipt.status)}</span><h1>Payment receipt</h1><div class="receipt-mark">✓</div><dl>${rows.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><button class="button full" id="share-receipt" data-share-text="${escapeAttribute(shareText)}">Share receipt in Telegram</button></section>`;
};

const dashboard = () => {
  const invoices = getInvoices();
  const paid = invoices.filter((invoice) => invoice.status === 'paid');
  return `<section class="dashboard"><div class="panel"><p class="eyebrow">Merchant dashboard</p><h1>${invoices.length} invoices</h1><div class="metrics"><div><strong>${paid.length}</strong><span>paid</span></div><div><strong>${invoices.filter((i) => i.status === 'pending').length}</strong><span>pending</span></div><div><strong>${paid.reduce((sum, i) => sum + Number(i.settlementAmount), 0).toFixed(2)}</strong><span>settled</span></div></div></div><div class="invoice-list">${invoices.map(invoiceCard).join('')}</div></section>`;
};

const invoiceCard = (invoice: Invoice) => {
  const checkoutUrl = `${appUrl()}/checkout/${invoice.slug}`;
  return `<article class="invoice-card"><div><span class="status ${invoice.status === 'paid' ? 'live' : 'demo'}">${escapeHtml(invoice.status)}</span><h3>${escapeHtml(invoice.title)}</h3><p>${escapeHtml(invoice.merchantName)} · ${money(escapeHtml(invoice.settlementAmount), escapeHtml(invoice.settlementAsset))}</p></div><div class="card-actions"><a class="button button-small secondary" data-nav="/checkout/${escapeAttribute(invoice.slug)}" href="/checkout/${escapeAttribute(invoice.slug)}">Open</a><button class="button button-small" data-copy="${escapeAttribute(checkoutUrl)}">Copy</button></div></article>`;
};
const notFound = () => `<section class="panel narrow"><h1>Link not found</h1><p class="muted">Create a fresh invoice or open the Alice demo checkout.</p><a class="button" data-nav="/create" href="/create">Create invoice</a></section>`;

const bindPage = () => {
  document.querySelector('#invoice-form')?.addEventListener('submit', createInvoice);
  document.querySelector('#quote-button')?.addEventListener('click', quoteFlow);
  document.querySelector('#connect-wallet')?.addEventListener('click', async () => { await connectWallet(); hapticSuccess(); });
  document.querySelector('#share-receipt')?.addEventListener('click', (event) => shareTelegramLink(location.href, (event.currentTarget as HTMLElement).dataset.shareText || 'OmniPay receipt'));
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => { await navigator.clipboard.writeText(button.dataset.copy || ''); button.textContent = 'Copied'; }));
};

const createInvoice = (event: Event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget as HTMLFormElement);
  const title = String(form.get('title'));
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
  const now = new Date();
  const invoice: Invoice = {
    id: crypto.randomUUID(), slug,
    merchantWallet: String(form.get('merchantWallet')), merchantName: String(form.get('merchantName')),
    settlementAsset: String(form.get('settlementAsset')), settlementAmount: String(form.get('settlementAmount')),
    title, note: String(form.get('note')), createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(), status: 'pending'
  };
  saveInvoice(invoice);
  const link = `${appUrl()}/checkout/${invoice.slug}`;
  const result = document.querySelector<HTMLDivElement>('#created-link');
  if (result) result.className = 'result-card', result.innerHTML = `<h3>Payment link ready</h3><p>${escapeHtml(link)}</p><div class="hero-actions"><button class="button" data-copy="${escapeAttribute(link)}">Copy link</button><button id="share-created" class="button secondary">Share in Telegram</button></div>`;
  document.querySelector('#share-created')?.addEventListener('click', () => shareTelegramLink(link, `Pay ${invoice.title} with OmniPay Links`));
  bindPage();
  hapticSuccess();
};

const quoteFlow = async () => {
  const slug = route().split('/').pop() || '';
  const invoice = getInvoiceBySlug(slug);
  const source = ASSETS.find((asset) => asset.symbol === (document.querySelector<HTMLSelectElement>('#pay-asset')?.value || 'TON'));
  const target = ASSETS.find((asset) => asset.symbol === invoice?.settlementAsset);
  const output = document.querySelector<HTMLDivElement>('#quote-output');
  if (!invoice || !source || !target || !output) return;
  output.innerHTML = '<div class="loading">Requesting Omniston quote…</div>';
  const quote = await requestOmnistonQuote({ sourceAsset: source, targetAsset: target, invoice, slippageBps: 50 });
  output.innerHTML = quoteCard(quote) + '<button id="pay-button" class="button full">Confirm payment with TON wallet</button>';
  document.querySelector('#pay-button')?.addEventListener('click', () => payInvoice(invoice, quote));
};

const quoteCard = (quote: Quote) => `<article class="quote-card"><span class="status ${quote.status === 'live' ? 'live' : 'demo'}">${quote.status === 'live' ? 'Omniston live quote' : 'Demo fallback quote'}</span><div class="quote-grid"><span>Pay asset</span><strong>${escapeHtml(quote.sourceAmount)} ${escapeHtml(quote.sourceAsset)}</strong><span>Settlement</span><strong>${escapeHtml(quote.expectedTargetAmount)} ${escapeHtml(quote.targetAsset)}</strong><span>Route</span><strong>${quote.route.map(escapeHtml).join(' → ')}</strong><span>Fee</span><strong>${escapeHtml(quote.fee)}</strong><span>Slippage</span><strong>${escapeHtml(quote.slippage)}</strong><span>ETA</span><strong>${escapeHtml(quote.eta)}</strong></div>${quote.status === 'demo' ? '<p class="warning">Live Omniston endpoint/SDK was unavailable in this environment, so this quote is clearly labeled as demo fallback.</p>' : ''}</article>`;

const payInvoice = async (invoice: Invoice, quote: Quote) => {
  const payload = buildOmnistonPaymentPayload(invoice, quote);
  const tx = buildSettlementTransfer(invoice.merchantWallet, String(Math.round(Number(invoice.settlementAmount) * 1_000_000_000)), payload);
  const result = await sendTonTransaction(tx);
  const receipt: Receipt = { id: crypto.randomUUID(), invoiceId: invoice.id, status: result.status === 'submitted' ? 'paid' : 'pending', merchantWallet: invoice.merchantWallet, payerWallet: 'connected-ton-wallet', paidAsset: quote.sourceAsset, receivedAsset: invoice.settlementAsset, amount: invoice.settlementAmount, txHash: result.txHash, timestamp: new Date().toISOString() };
  saveReceipt(receipt);
  updateInvoice({ ...invoice, status: receipt.status, paymentTxHash: receipt.txHash, payerWallet: receipt.payerWallet, payerAsset: receipt.paidAsset, quoteId: quote.id });
  hapticSuccess();
  navigate(`/receipt/${receipt.id}`);
};
