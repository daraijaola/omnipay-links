import type { Invoice, Receipt } from './types';

const invoicesKey = 'omnipay.invoices';
const receiptsKey = 'omnipay.receipts';

const read = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
};

const write = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

export const getInvoices = (): Invoice[] => read<Invoice[]>(invoicesKey, []);
export const saveInvoice = (invoice: Invoice) => {
  const invoices = getInvoices().filter((item) => item.id !== invoice.id);
  write(invoicesKey, [invoice, ...invoices]);
};
export const getInvoiceBySlug = (slug: string): Invoice | undefined => getInvoices().find((invoice) => invoice.slug === slug);
export const updateInvoice = (invoice: Invoice) => saveInvoice(invoice);

export const getReceipts = (): Receipt[] => read<Receipt[]>(receiptsKey, []);
export const saveReceipt = (receipt: Receipt) => {
  const receipts = getReceipts().filter((item) => item.id !== receipt.id);
  write(receiptsKey, [receipt, ...receipts]);
};
export const getReceipt = (id: string): Receipt | undefined => getReceipts().find((receipt) => receipt.id === id);

export const seedDemoData = () => {
  if (getInvoices().length) return;
  const now = new Date();
  const demo: Invoice = {
    id: 'inv_demo_50usdt',
    slug: 'alice-design-50-usdt',
    merchantWallet: 'EQDmerchantDemoWalletForJudges7r9Qh9',
    merchantName: 'Alice Studio',
    settlementAsset: 'USDT',
    settlementAmount: '50',
    title: 'Design sprint deposit',
    note: 'Telegram creator checkout for a landing page audit.',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'pending',
  };
  saveInvoice(demo);
};
