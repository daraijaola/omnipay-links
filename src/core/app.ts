import { ASSETS, paymentAssets, settlementAssets } from '../data/assets';
import { publicAppUrl } from './config';
import { escapeAttribute, escapeHtml } from './security';
import { buildOmnistonPaymentPayload, requestOmnistonQuote } from '../integrations/omniston/client';
import { configureBackButton, hapticLight, hapticSuccess, initTelegramMiniApp, isTelegramWebApp, shareTelegramLink } from '../integrations/telegram/webapp';
import { buildSettlementTransfer, connectWallet, getTonConnect, sendTonTransaction } from '../integrations/ton/wallet';
import { getInvoiceBySlug, getInvoices, getReceipt, saveInvoice, saveReceipt, seedDemoData, updateInvoice } from './storage';
import type { Invoice, Quote, Receipt } from './types';

const appUrl = () => publicAppUrl() || window.location.origin;
const money = (value: string, symbol: string) => `${value} ${symbol}`;
const short = (value?: string) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : 'Not connected';
const route = () => window.location.pathname;

export const startApp = () => {
  initTelegramMiniApp();
  seedDemoData();
  window.addEventListener('popstate', render);
  document.addEventListener('click', handleClicks);
  render();
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

const showBack = () => route() !== '/';

const shell = (content: string) => `
  <main class="shell">
    <nav class="nav">
      <a class="brand" data-nav="/" href="/">
        <span class="brand-mark"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M10 14l2-2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="12" x2="12" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="16" x2="15" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
        <span class="brand-word">OmniPay</span>
      </a>
      <span></span>
      <div class="nav-actions">
        ${showBack() ? '<button class="back-btn" id="nav-back">&larr;</button>' : ''}
        <a data-nav="/dashboard" href="/dashboard">Dashboard</a>
        <a class="button button-small" data-nav="/create" href="/create">+ Create</a>
      </div>
    </nav>
    <div class="runtime-pill">${isTelegramWebApp() ? 'Telegram Mini App' : 'Web'} &middot; Omniston v1beta8</div>
    ${content}
    <footer class="footer">OmniPay Links &middot; STON.fi Vibe Coding Hackathon &middot; Non-custodial</footer>
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
      <h1>Accept any token.<br>Settle in <span class="hl">what you want.</span></h1>
      <p class="lead">Create checkout links powered by <b>STON.fi Omniston</b>. Your payers choose their token &mdash; you receive exactly what you asked for.</p>
      <div class="hero-actions">
        <a class="button" data-nav="/create" href="/create">Create payment link</a>
        <a class="button secondary" data-nav="/checkout/alice-design-50-usdt" href="/checkout/alice-design-50-usdt">Try demo checkout</a>
      </div>
      <div class="trust-row">
        <span>Omniston RFQ</span>
        <span>TON Connect</span>
        <span>Telegram share</span>
        <span>Non-custodial</span>
      </div>
    </div>
    <div class="phone-frame">
      <div class="phone-top"></div>
      <div class="checkout-card">
        <span class="status live">Live Omniston quote</span>
        <h2>Design sprint deposit</h2>
        <p class="muted">Alice Studio &middot; 50 USDT settlement</p>
        <div class="quote-grid">
          <span>Bob pays</span><strong>162.50 TON</strong>
          <span>Alice receives</span><strong>50.00 USDT</strong>
          <span>Route</span><strong>TON &rarr; Omniston &rarr; USDT</strong>
          <span>ETA</span><strong>~6 seconds</strong>
        </div>
        <button class="button full">Confirm with TON wallet</button>
      </div>
    </div>
  </section>
  <section class="feature-grid">
    <article class="feature">
      <h3>Payment links, not swap UIs</h3>
      <p>Merchants share a link. Payers see a checkout. No terminal needed.</p>
    </article>
    <article class="feature">
      <h3>Merchant picks settlement</h3>
      <p>Choose TON, USDT, or any supported asset as your receive currency.</p>
    </article>
    <article class="feature">
      <h3>Payer picks payment asset</h3>
      <p>Pay with what you hold. Omniston routes the optimal swap path.</p>
    </article>
    <article class="feature">
      <h3>Transparent routing</h3>
      <p>See the quote, route, fee, slippage, and ETA before confirming.</p>
    </article>
  </section>`;

const createPage = () => `
  <section class="panel narrow">
    <p class="eyebrow">Merchant flow</p>
    <h1>Create a payment link</h1>
    <p class="muted">Connect your wallet, set what you want to receive, and share the checkout link in Telegram.</p>
    <div id="ton-connect-root" class="ton-root"></div>
    <form id="invoice-form" class="form">
      <label>Merchant name<input name="merchantName" value="Alice Studio" required /></label>
      <label>Merchant TON wallet<input name="merchantWallet" placeholder="EQ..." required /></label>
      <label>Invoice title<input name="title" placeholder="e.g. Design sprint deposit" required /></label>
      <label>Amount<input name="settlementAmount" type="number" min="0.01" step="0.01" value="50" required /></label>
      <label>Settlement asset<select name="settlementAsset">${settlementAssets.map((asset) => `<option value="${escapeAttribute(asset.symbol)}">${escapeHtml(asset.symbol)} &mdash; ${escapeHtml(asset.name)}</option>`).join('')}</select></label>
      <label>Note (optional)<textarea name="note" placeholder="Add a note for the payer..."></textarea></label>
      <button class="button full" type="submit">Generate payment link</button>
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
      <aside class="panel">
        <p class="eyebrow">Invoice checkout</p>
        <h1>${title}</h1>
        <p class="lead">${merchantName} requests settlement in <strong>${settlementAsset}</strong></p>
        <div class="amount-due">${money(settlementAmount, settlementAsset)}</div>
        <p class="muted">Expires ${new Date(invoice.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        ${note ? `<p class="muted">${note}</p>` : ''}
        <div id="ton-connect-root" class="ton-root"></div>
        <button id="connect-wallet" class="button secondary full">Connect TON wallet</button>
      </aside>
      <section class="panel quote-panel">
        <div class="stepper">
          <span class="active">1 Select asset</span>
          <span>2 Get quote</span>
          <span>3 Confirm</span>
        </div>
        <label>Pay with
          <select id="pay-asset">${paymentAssets.map((asset) => `<option value="${escapeAttribute(asset.symbol)}">${escapeHtml(asset.symbol)} &mdash; ${escapeHtml(asset.name)}</option>`).join('')}</select>
        </label>
        <button id="quote-button" class="button full">Fetch Omniston quote</button>
        <div id="quote-output" class="quote-output"></div>
      </section>
    </section>`;
};

const receiptPage = (id: string) => {
  const receipt = getReceipt(id);
  if (!receipt) return notFound();
  const shareText = `Payment receipt: ${receipt.amount} ${receipt.receivedAsset} via OmniPay Links`;
  const rows: [string, string][] = [
    ['Status', receipt.status],
    ['Merchant', short(receipt.merchantWallet)],
    ['Payer', short(receipt.payerWallet)],
    ['Paid asset', receipt.paidAsset],
    ['Received', `${receipt.amount} ${receipt.receivedAsset}`],
    ['Tx hash', short(receipt.txHash)],
    ['Timestamp', new Date(receipt.timestamp).toLocaleString()],
  ];
  return `
    <section class="panel narrow receipt">
      <span class="status ${receipt.status === 'paid' ? 'live' : 'pending'}">${escapeHtml(receipt.status)}</span>
      <h1>Payment receipt</h1>
      <div class="receipt-mark">&#10003;</div>
      <dl>${rows.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
      <button class="button full" id="share-receipt" data-share-text="${escapeAttribute(shareText)}">Share receipt in Telegram</button>
    </section>`;
};

const dashboard = () => {
  const invoices = getInvoices();
  const paid = invoices.filter((invoice) => invoice.status === 'paid');
  const pending = invoices.filter((i) => i.status === 'pending');
  const totalSettled = paid.reduce((sum, i) => sum + Number(i.settlementAmount), 0).toFixed(2);
  return `
    <section class="dashboard">
      <div class="panel">
        <p class="eyebrow">Merchant dashboard</p>
        <h1>${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}</h1>
        <div class="metrics">
          <div><strong>${paid.length}</strong><span>Paid</span></div>
          <div><strong>${pending.length}</strong><span>Pending</span></div>
          <div><strong>${totalSettled}</strong><span>Total settled</span></div>
        </div>
      </div>
      ${invoices.length ? `<div class="invoice-list">${invoices.map(invoiceCard).join('')}</div>` : '<p class="muted" style="text-align:center;padding:32px">No invoices yet. Create your first payment link above.</p>'}
    </section>`;
};

const invoiceCard = (invoice: Invoice) => {
  const checkoutUrl = `${appUrl()}/checkout/${invoice.slug}`;
  return `
    <article class="invoice-card">
      <div>
        <span class="status ${invoice.status === 'paid' ? 'live' : 'pending'}">${escapeHtml(invoice.status)}</span>
        <h3>${escapeHtml(invoice.title)}</h3>
        <p>${escapeHtml(invoice.merchantName)} &middot; ${money(escapeHtml(invoice.settlementAmount), escapeHtml(invoice.settlementAsset))}</p>
      </div>
      <div class="card-actions">
        <a class="button button-small secondary" data-nav="/checkout/${escapeAttribute(invoice.slug)}" href="/checkout/${escapeAttribute(invoice.slug)}">Open</a>
        <button class="button button-small" data-copy="${escapeAttribute(checkoutUrl)}">Copy link</button>
      </div>
    </article>`;
};

const notFound = () => `
  <section class="panel narrow" style="text-align:center">
    <h1>Link not found</h1>
    <p class="muted">This payment link doesn't exist or has expired.</p>
    <div class="hero-actions" style="justify-content:center">
      <a class="button" data-nav="/create" href="/create">Create a new link</a>
      <a class="button secondary" data-nav="/" href="/">Go home</a>
    </div>
  </section>`;

const bindPage = () => {
  document.querySelector('#invoice-form')?.addEventListener('submit', createInvoice);
  document.querySelector('#quote-button')?.addEventListener('click', quoteFlow);
  document.querySelector('#connect-wallet')?.addEventListener('click', async () => { await connectWallet(); hapticSuccess(); });
  document.querySelector('#share-receipt')?.addEventListener('click', (event) => shareTelegramLink(location.href, (event.currentTarget as HTMLElement).dataset.shareText || 'OmniPay receipt'));
  document.querySelector('#nav-back')?.addEventListener('click', () => { history.back(); });
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(button.dataset.copy || '');
    const original = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => { button.textContent = original; }, 1500);
  }));
  // Mount TonConnect when root element exists
  if (document.getElementById('ton-connect-root')) {
    initTonConnect();
  }
};

const initTonConnect = () => {
  window.setTimeout(() => {
    const root = document.getElementById('ton-connect-root');
    if (!root) return;
    getTonConnect();
  }, 100);
};

const createInvoice = (event: Event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget as HTMLFormElement);
  const title = String(form.get('title'));
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
  const now = new Date();
  const invoice: Invoice = {
    id: crypto.randomUUID(),
    slug,
    merchantWallet: String(form.get('merchantWallet')),
    merchantName: String(form.get('merchantName')),
    settlementAsset: String(form.get('settlementAsset')),
    settlementAmount: String(form.get('settlementAmount')),
    title,
    note: String(form.get('note')),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'pending',
  };
  saveInvoice(invoice);
  const link = `${appUrl()}/checkout/${invoice.slug}`;
  const result = document.querySelector<HTMLDivElement>('#created-link');
  if (result) {
    result.className = 'result-card';
    result.innerHTML = `
      <h3>Payment link ready</h3>
      <p class="muted">Your checkout link has been generated. Share it with your payer.</p>
      <div class="hero-actions">
        <button class="button" data-copy="${escapeAttribute(link)}">Copy link</button>
        <button id="share-created" class="button secondary">Share in Telegram</button>
      </div>`;
  }
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
  output.innerHTML = '<div class="loading">Requesting Omniston quote&hellip;</div>';
  const quote = await requestOmnistonQuote({ sourceAsset: source, targetAsset: target, invoice, slippageBps: 50 });
  output.innerHTML = quoteCard(quote) + '<button id="pay-button" class="button full">Confirm payment</button>';
  document.querySelector('#pay-button')?.addEventListener('click', () => payInvoice(invoice, quote));
};

const quoteCard = (quote: Quote) => `
  <article class="quote-card">
    <span class="status ${quote.status === 'live' ? 'live' : 'demo'}">${quote.status === 'live' ? 'Live Omniston quote' : 'Demo quote'}</span>
    <div class="quote-grid">
      <span>You pay</span><strong>${escapeHtml(quote.sourceAmount)} ${escapeHtml(quote.sourceAsset)}</strong>
      <span>Merchant receives</span><strong>${escapeHtml(quote.expectedTargetAmount)} ${escapeHtml(quote.targetAsset)}</strong>
      <span>Route</span><strong>${quote.route.map(escapeHtml).join(' &rarr; ')}</strong>
      <span>Fee</span><strong>${escapeHtml(quote.fee)}</strong>
      <span>Slippage</span><strong>${escapeHtml(quote.slippage)}</strong>
      <span>ETA</span><strong>${escapeHtml(quote.eta)}</strong>
    </div>
    ${quote.status === 'demo' ? '<p class="warning">Using demo fallback &mdash; live Omniston endpoint was unreachable in this environment.</p>' : ''}
  </article>`;

const payInvoice = async (invoice: Invoice, quote: Quote) => {
  const payload = buildOmnistonPaymentPayload(invoice, quote);
  const tx = buildSettlementTransfer(invoice.merchantWallet, String(Math.round(Number(invoice.settlementAmount) * 1_000_000_000)), payload);
  const result = await sendTonTransaction(tx);
  const receipt: Receipt = {
    id: crypto.randomUUID(),
    invoiceId: invoice.id,
    status: result.status === 'submitted' ? 'paid' : 'pending',
    merchantWallet: invoice.merchantWallet,
    payerWallet: 'connected-ton-wallet',
    paidAsset: quote.sourceAsset,
    receivedAsset: invoice.settlementAsset,
    amount: invoice.settlementAmount,
    txHash: result.txHash,
    timestamp: new Date().toISOString(),
  };
  saveReceipt(receipt);
  if (result.status === 'submitted') {
    updateInvoice({ ...invoice, status: 'paid', paymentTxHash: result.txHash, payerAsset: quote.sourceAsset, quoteId: quote.id });
  }
  hapticSuccess();
  navigate(`/receipt/${receipt.id}`);
};
