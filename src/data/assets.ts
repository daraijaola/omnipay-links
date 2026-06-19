import type { Asset } from '../core/types';

export const ASSETS: Asset[] = [
  { symbol: 'TON', name: 'Toncoin', chain: 'TON', address: 'native:TON', decimals: 9, icon: '◆', isSettlementSupported: true, isPaymentSupported: true },
  { symbol: 'USDT', name: 'Tether USD (TON)', chain: 'TON', address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6, icon: '$', isSettlementSupported: true, isPaymentSupported: true },
  { symbol: 'STON', name: 'STON.fi Token', chain: 'TON', address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO', decimals: 9, icon: 'S', isSettlementSupported: false, isPaymentSupported: true },
  { symbol: 'NOT', name: 'Notcoin', chain: 'TON', address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT', decimals: 9, icon: 'N', isSettlementSupported: false, isPaymentSupported: true },
];

export const settlementAssets = ASSETS.filter((asset) => asset.isSettlementSupported);
export const paymentAssets = ASSETS.filter((asset) => asset.isPaymentSupported);
