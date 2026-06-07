type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string>;
  initDataUnsafe?: { user?: { first_name?: string; username?: string } };
  MainButton?: { setText: (text: string) => void; show: () => void; hide: () => void; onClick: (cb: () => void) => void };
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
  HapticFeedback?: { impactOccurred: (style: 'light' | 'medium' | 'heavy') => void; notificationOccurred: (type: 'success' | 'warning' | 'error') => void };
  openTelegramLink?: (url: string) => void;
};

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}

export const telegram = () => window.Telegram?.WebApp;
export const isTelegramWebApp = () => Boolean(telegram());

export const initTelegramMiniApp = () => {
  const app = telegram();
  if (!app) return;
  app.ready();
  app.expand();
  document.documentElement.dataset.telegram = 'true';
  Object.entries(app.themeParams || {}).forEach(([key, value]) => {
    if (value) document.documentElement.style.setProperty(`--tg-${key.replaceAll('_', '-')}`, value);
  });
};

export const shareTelegramLink = (url: string, text: string) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const app = telegram();
  if (app?.openTelegramLink) app.openTelegramLink(shareUrl);
  else window.open(shareUrl, '_blank', 'noopener,noreferrer');
};

export const configureBackButton = (enabled: boolean, onClick: () => void) => {
  const back = telegram()?.BackButton;
  if (!back) return;
  if (enabled) {
    back.show();
    back.onClick(onClick);
  } else back.hide();
};

export const hapticSuccess = () => telegram()?.HapticFeedback?.notificationOccurred('success');
export const hapticLight = () => telegram()?.HapticFeedback?.impactOccurred('light');
