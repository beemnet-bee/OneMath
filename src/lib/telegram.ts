declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
        };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.Telegram?.WebApp);
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function initTelegramTheme() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    if (tg.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }
}

export function getTelegramUser() {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user ?? null;
}