import { StorageManager } from './storage';
import { Logger } from './logger';

export class AuthManager {
  private storage = new StorageManager();

  async isAuthenticated(): Promise<boolean> {
    const token = await this.storage.getAuthToken();
    if (!token) return false;

    const isExpired = await this.storage.isTokenExpired();
    return !isExpired;
  }

  async getToken(): Promise<string | null> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) return null;
    return this.storage.getAuthToken();
  }

  async setAuth(accessToken: string, expiresIn: number, userId: string): Promise<void> {
    await this.storage.setAuthToken(accessToken, expiresIn);
    await this.storage.setUserId(userId);
    Logger.log('Authentication set');
  }

  async logout(): Promise<void> {
    await this.storage.clearAuthData();
    Logger.log('User logged out');
  }
}

