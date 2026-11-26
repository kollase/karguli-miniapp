interface TelegramWebApp {
  initData?: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  ready(): void;
  expand(): void;
  onEvent(name: string, cb: () => void): void;
  offEvent(name: string, cb: () => void): void;
  isVersionAtLeast?(version: string): boolean;
  BackButton?: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  HapticFeedback?: { notificationOccurred(type: "success" | "error"): void };
}
declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}
export function telegram() {
  const app = window.Telegram?.WebApp;
  return app?.initData ? app : undefined;
}
export function haptic(correct: boolean) {
  try {
    const app = telegram();
    if (app?.isVersionAtLeast?.("6.1"))
      app.HapticFeedback?.notificationOccurred(correct ? "success" : "error");
  } catch {
    /* Optional on unsupported clients. */
  }
}
