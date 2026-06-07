export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'expired' | 'failed';
export type QuoteStatus = 'live' | 'demo' | 'unavailable';

export interface Asset {
  symbol: string;
  name: string;
  chain: 'TON';
  address: string;
  decimals: number;
  icon: string;
  isSettlementSupported: boolean;
  isPaymentSupported: boolean;
}

export interface Invoice {
  id: string;
  slug: string;
  merchantWallet: string;
  merchantName: string;
  settlementAsset: string;
  settlementAmount: string;
  title: string;
  note: string;
  createdAt: string;
  expiresAt: string;
  status: InvoiceStatus;
  paymentTxHash?: string;
  payerWallet?: string;
  payerAsset?: string;
  quoteId?: string;
}

export interface Quote {
  id: string;
  sourceAsset: string;
  targetAsset: string;
  sourceAmount: string;
  expectedTargetAmount: string;
  route: string[];
  provider: 'Omniston';
  slippage: string;
  fee: string;
  eta: string;
  status: QuoteStatus;
  confidence: 'high' | 'medium' | 'demo';
  raw?: unknown;
}

export interface Receipt {
  id: string;
  invoiceId: string;
  status: InvoiceStatus;
  merchantWallet: string;
  payerWallet: string;
  paidAsset: string;
  receivedAsset: string;
  amount: string;
  txHash: string;
  timestamp: string;
}
