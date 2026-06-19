import { TonConnectUI } from '@tonconnect/ui';
import { tonConnectManifestUrl } from '../../core/config';

export interface TonConnectTransaction {
  validUntil: number;
  messages: Array<{ address: string; amount: string; payload?: string }>;
}

let ui: InstanceType<typeof TonConnectUI> | undefined;

export const getTonConnect = (): InstanceType<typeof TonConnectUI> | undefined => {
  const root = document.getElementById('ton-connect-root');
  if (ui) {
    // Re-mount button into current root if it exists
    if (root && !root.hasChildNodes()) {
      try {
        ui.uiOptions = { buttonRootId: 'ton-connect-root' };
      } catch { /* ignore re-mount errors */ }
    }
    return ui;
  }
  if (!root) return undefined;
  try {
    ui = new TonConnectUI({
      manifestUrl: tonConnectManifestUrl(),
      buttonRootId: 'ton-connect-root',
    });
    return ui;
  } catch {
    return undefined;
  }
};

export const connectWallet = async () => {
  const tonConnect = getTonConnect();
  if (!tonConnect) return { address: 'Wallet unavailable', available: false };
  try {
    await tonConnect.openModal();
    return { address: tonConnect.account?.address || 'Connected wallet', available: true };
  } catch {
    return { address: 'Connection failed', available: false };
  }
};

export const getWalletAddress = (): string | undefined => {
  return ui?.account?.address;
};

export const buildSettlementTransfer = (merchantWallet: string, amountNanoTon: string, payload?: string): TonConnectTransaction => ({
  validUntil: Math.floor(Date.now() / 1000) + 600,
  messages: [{ address: merchantWallet, amount: amountNanoTon, payload }],
});

export const sendTonTransaction = async (tx: TonConnectTransaction) => {
  const tonConnect = getTonConnect();
  if (!tonConnect) return { status: 'demo' as const, txHash: `demo-${crypto.randomUUID()}` };
  try {
    const result = await tonConnect.sendTransaction({
      validUntil: tx.validUntil,
      messages: tx.messages,
    });
    return { status: 'submitted' as const, txHash: result.boc || `boc-${Date.now()}` };
  } catch {
    return { status: 'demo' as const, txHash: `demo-${crypto.randomUUID()}` };
  }
};
