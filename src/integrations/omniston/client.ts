import { omnistonApiUrl } from '../../core/config.js';
import type { Asset, Invoice, Quote } from '../../core/types.js';

interface OmnistonQuoteRequest {
  sourceAsset: Asset;
  targetAsset: Asset;
  invoice: Invoice;
  slippageBps: number;
}


export const requestOmnistonQuote = async ({ sourceAsset, targetAsset, invoice, slippageBps }: OmnistonQuoteRequest): Promise<Quote> => {
  const body = {
    jsonrpc: '2.0',
    id: crypto.randomUUID(),
    method: 'quote',
    params: {
      chain: 'TON',
      offerAssetAddress: sourceAsset.address,
      askAssetAddress: targetAsset.address,
      askUnits: invoice.settlementAmount,
      slippageBps
    }
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${omnistonApiUrl()}/api/v1beta8/quote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    if (!response.ok) return demoQuote(sourceAsset, targetAsset, invoice, 'Omniston API endpoint not reachable from this environment');
    const raw = await response.json() as Record<string, unknown>;
    return normalizeQuote(sourceAsset, targetAsset, invoice, raw);
  } catch (error) {
    window.clearTimeout(timeout);
    return demoQuote(sourceAsset, targetAsset, invoice, error instanceof Error ? error.message : 'Unknown quote error');
  }
};

const normalizeQuote = (sourceAsset: Asset, targetAsset: Asset, invoice: Invoice, raw: Record<string, unknown>): Quote => {
  const result = raw.result as Record<string, unknown> | undefined;
  return {
    id: String(result?.quoteId || raw.id || crypto.randomUUID()),
    sourceAsset: sourceAsset.symbol,
    targetAsset: targetAsset.symbol,
    sourceAmount: String(result?.offerUnits || estimateSourceAmount(sourceAsset.symbol, invoice.settlementAmount)),
    expectedTargetAmount: String(result?.askUnits || invoice.settlementAmount),
    route: Array.isArray(result?.route) ? result.route.map(String) : ['Omniston RFQ', 'Best TON route', targetAsset.symbol],
    provider: 'Omniston',
    slippage: '0.50%',
    fee: String(result?.fee || 'network + resolver fee'),
    eta: String(result?.eta || '1-2 blocks'),
    status: 'live',
    confidence: 'high',
    raw
  };
};

const demoQuote = (sourceAsset: Asset, targetAsset: Asset, invoice: Invoice, reason: string): Quote => ({
  id: `demo-${crypto.randomUUID()}`,
  sourceAsset: sourceAsset.symbol,
  targetAsset: targetAsset.symbol,
  sourceAmount: estimateSourceAmount(sourceAsset.symbol, invoice.settlementAmount),
  expectedTargetAmount: invoice.settlementAmount,
  route: [sourceAsset.symbol, 'Omniston v1beta8 adapter', targetAsset.symbol],
  provider: 'Omniston',
  slippage: '0.50%',
  fee: '0.06% route fee + TON gas estimate',
  eta: '≈ 8 seconds',
  status: 'demo',
  confidence: 'demo',
  raw: { mode: 'demo-fallback', reason }
});

const estimateSourceAmount = (symbol: string, targetAmount: string) => {
  const amount = Number(targetAmount) || 0;
  const multipliers: Record<string, number> = { TON: 3.2, USDT: 1, STON: 7.8, NOT: 165 };
  return (amount * (multipliers[symbol] || 1)).toFixed(symbol === 'USDT' ? 2 : 4);
};

export const buildOmnistonPaymentPayload = (invoice: Invoice, quote: Quote) =>
  btoa(JSON.stringify({ app: 'OmniPay Links', invoice: invoice.id, quote: quote.id, provider: 'Omniston v1beta8', settlement: invoice.settlementAsset }));
