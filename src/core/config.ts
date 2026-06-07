declare global {
  interface Window {
    OMNIPAY_CONFIG?: {
      publicAppUrl?: string;
      omnistonApiUrl?: string;
      tonApiBaseUrl?: string;
      telegramBotUsername?: string;
    };
  }
}

export const publicAppUrl = () => window.OMNIPAY_CONFIG?.publicAppUrl || window.location.origin;
export const omnistonApiUrl = () => window.OMNIPAY_CONFIG?.omnistonApiUrl || 'https://omniston.ston.fi';
export const tonApiBaseUrl = () => window.OMNIPAY_CONFIG?.tonApiBaseUrl || 'https://tonapi.io/v2';
export const telegramBotUsername = () => window.OMNIPAY_CONFIG?.telegramBotUsername || '';
