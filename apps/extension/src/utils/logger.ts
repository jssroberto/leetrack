export class Logger {
  static log(message: string, data?: any): void {
    console.log(`[LeeTrack] ${message}`, data);
  }

  static error(message: string, error?: any): void {
    console.error(`[LeeTrack ERROR] ${message}`, error);
  }

  static warn(message: string, data?: any): void {
    console.warn(`[LeeTrack WARN] ${message}`, data);
  }

  static debug(message: string, data?: any): void {
    const isDev = (globalThis as any)?.process?.env?.NODE_ENV === 'development';
    if (isDev) {
      console.debug(`[LeeTrack DEBUG] ${message}`, data);
    }
  }
}
