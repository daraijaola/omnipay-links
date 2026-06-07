type TonConnectUIConstructor = new (config: { manifestUrl: string; buttonRootId: string }) => TonConnectUI;
type TonConnectUI = {
  connectWallet: () => Promise<unknown>;
  sendTransaction: (tx: TonConnectTransaction) => Promise<{ boc?: string }>;
  account?: { address?: string };
};

declare global {
  interface Window { TON_CONNECT_UI?: { TonConnectUI: TonConnectUIConstructor } }
}

export interface TonConnectTransaction {
  validUntil: number;
  messages: Array<{ address: string; amount: string; payload?: string }>;
}

let ui: TonConnectUI | undefined;

export const getTonConnect = () => {
  if (ui) return ui;
  const Constructor = window.TON_CONNECT_UI?.TonConnectUI;
  if (!Constructor) return undefined;
  const manifestUrl = window.location.origin + '/tonconnect-manifest.json';
  ui = new Constructor({ manifestUrl, buttonRootId: 'ton-connect-root' });
  return ui;
};

export const connectWallet = async () => {
  const tonConnect = getTonConnect();
  if (!tonConnect) return { address: 'Connect TON wallet', available: false };
  await tonConnect.connectWallet();
  return { address: tonConnect.account?.address || 'Connected wallet', available: true };
};

export const buildSettlementTransfer = (merchantWallet: string, amountNanoTon: string, payload?: string): TonConnectTransaction => ({
  validUntil: Math.floor(Date.now() / 1000) + 600,
  messages: [{ address: merchantWallet, amount: amountNanoTon, payload }]
});

export const sendTonTransaction = async (tx: TonConnectTransaction) => {
  const tonConnect = getTonConnect();
  if (!tonConnect) return { status: 'demo' as const, txHash: `demo-${crypto.randomUUID()}` };
  const result = await tonConnect.sendTransaction(tx);
  return { status: 'submitted' as const, txHash: result.boc || `boc-${Date.now()}` };
};
