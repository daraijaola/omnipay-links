import type { Asset } from '../core/types.js';

export const ASSETS: Asset[] = [
  { symbol: 'TON', name: 'Toncoin', chain: 'TON', address: 'native:TON', decimals: 9, icon: '◆', isSettlementSupported: true, isPaymentSupported: true },
  { symbol: 'USDT', name: 'Tether USD on TON', chain: 'TON', address: 'EQCxE6m...', decimals: 6, icon: '$', isSettlementSupported: true, isPaymentSupported: true },
  { symbol: 'STON', name: 'STON.fi', chain: 'TON', address: 'EQBl3...', decimals: 9, icon: 'S', isSettlementSupported: false, isPaymentSupported: true },
  { symbol: 'NOT', name: 'Notcoin', chain: 'TON', address: 'EQAvl...', decimals: 9, icon: 'N', isSettlementSupported: false, isPaymentSupported: true }
];

export const settlementAssets = ASSETS.filter((asset) => asset.isSettlementSupported);
export const paymentAssets = ASSETS.filter((asset) => asset.isPaymentSupported);
