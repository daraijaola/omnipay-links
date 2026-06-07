import { tonApiBaseUrl } from '../../core/config.js';

export interface TransactionStatus {
  status: 'confirmed' | 'pending' | 'unknown';
  explorerUrl?: string;
  raw?: unknown;
}

export const getTransactionStatus = async (txHash: string): Promise<TransactionStatus> => {
  if (!txHash || txHash.startsWith('demo-')) {
    return { status: 'pending', explorerUrl: undefined, raw: { mode: 'demo' } };
  }

  const response = await fetch(`${tonApiBaseUrl()}/events/${encodeURIComponent(txHash)}`, {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) return { status: 'unknown', explorerUrl: `https://tonviewer.com/transaction/${encodeURIComponent(txHash)}` };
  const raw = await response.json() as unknown;
  return { status: 'confirmed', explorerUrl: `https://tonviewer.com/transaction/${encodeURIComponent(txHash)}`, raw };
};
