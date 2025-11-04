import { StorageManager } from '@extension/utils/storage';
import { ApiClient } from '@extension/background/api-client';
import { Logger } from '@extension/utils/logger';
import type { ExtensionMessage } from '@extension/types/leetcode';
import './popup.css';

class PopupController {
  private storage = new StorageManager();
  private apiClient = new ApiClient();
  private toastTimer: number | null = null;

  async init(): Promise<void> {
    const token = await this.storage.getAuthToken();
    const isExpired = await this.storage.isTokenExpired();

    if (token && !isExpired) {
      this.showMainScreen();
    } else {
      this.showAuthScreen();
    }

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    document.getElementById('sync-btn')?.addEventListener('click', () => {
      this.handleSync();
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    // Settings removed: API URL is configured at build time.

    document.getElementById('toast-close')?.addEventListener('click', () => {
      this.hideToast();
    });

    document.getElementById('register-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'http://localhost:4200/auth/register' });
    });
  }

  private async handleLogin(): Promise<void> {
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement | null;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      this.showToast('Please enter email and password', 'error');
      return;
    }

    try {
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.ariaBusy = 'true';
        loginBtn.textContent = 'Signing in…';
      }

      const authData = await this.apiClient.login(email, password);
      await this.storage.setAuthToken(authData.accessToken, authData.expiresIn);
      const payload = this.decodeJwt<{ sub: string; email: string }>(authData.accessToken);
      await this.storage.setUserId(payload?.sub || email);

      this.showToast('Signed in successfully', 'success');
      this.showMainScreen();
      this.updateRecentSubmissions();
      Logger.log('Login successful');
    } catch (error: any) {
      Logger.error('Login failed', error);
      const message = (error && error.message) || 'Login failed. Please check your credentials.';
      this.showToast(message, 'error');
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.ariaBusy = 'false';
        loginBtn.textContent = 'Sign In';
      }
    }
  }

  private decodeJwt<T = any>(token: string): T | null {
    try {
      const base64 = token.split('.')[1];
      const json = atob(base64);
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  private async handleSync(): Promise<void> {
    const message: ExtensionMessage = { type: 'SYNC_SUBMISSIONS' };

    chrome.runtime.sendMessage(message, (response: any) => {
      if (response?.success) {
        this.updateRecentSubmissions();
        this.showToast('Sync completed', 'success');
      } else {
        this.showToast('Sync failed', 'error');
      }
    });
  }

  private async handleLogout(): Promise<void> {
    await this.storage.clearAuthData();
    this.showAuthScreen();
    Logger.log('Logged out');
  }

  // Settings removed

  private showAuthScreen(): void {
    this.switchScreen('auth-screen');
  }

  private showMainScreen(): void {
    this.switchScreen('main-screen');
    this.updateRecentSubmissions();
    this.updateSyncStatus();
  }

  // Settings removed

  private switchScreen(screenId: string): void {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.add('hidden');
    });
    document.getElementById(screenId)?.classList.remove('hidden');
  }

  private async updateRecentSubmissions(): Promise<void> {
    const submissions = await this.storage.getSubmissions();
    const container = document.getElementById('submissions-list');

    if (!container) return;

    container.innerHTML = '';

    const recentFive = submissions.slice(-5).reverse();

    if (recentFive.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No submissions yet</p>';
      return;
    }

    recentFive.forEach((sub) => {
      const difficultyClass =
        sub.difficulty === 'Easy'
          ? 'bg-green-100 text-green-800'
          : sub.difficulty === 'Medium'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800';

      const syncIcon = sub.synced ? '✓' : '⏳';

      const el = document.createElement('div');
      el.className = `p-3 bg-gray-50 border-l-4 ${
        sub.synced ? 'border-blue-500' : 'border-gray-300'
      } rounded transition-colors hover:bg-gray-100`;
      el.innerHTML = `
        <div class="flex justify-between items-start mb-1">
          <div class="font-semibold text-sm text-gray-900">${sub.questionTitle}</div>
          <span class="text-sm">${syncIcon}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="${difficultyClass} px-2 py-0.5 rounded font-semibold">${sub.difficulty}</span>
          <span class="text-gray-500">${new Date(sub.timestamp).toLocaleDateString()}</span>
        </div>
      `;
      container.appendChild(el);
    });
  }

  private async updateSyncStatus(): Promise<void> {
    const message: ExtensionMessage = { type: 'GET_SYNC_STATUS' };

    chrome.runtime.sendMessage(message, (response: any) => {
      const pendingCountEl = document.getElementById('pending-count');
      const syncStatusEl = document.getElementById('sync-status');

      if (pendingCountEl) {
        pendingCountEl.textContent = response.pendingCount.toString();
      }

      if (syncStatusEl && response.pendingCount === 0) {
        syncStatusEl.textContent = '✓ Synced';
        syncStatusEl.className = 'text-sm font-semibold text-green-600';
      } else if (syncStatusEl) {
        syncStatusEl.textContent = '⏳ Pending';
        syncStatusEl.className = 'text-sm font-semibold text-amber-500';
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toast-text');
    if (!toast || !text) return;

    toast.classList.remove('hidden', 'toast-success', 'toast-error', 'toast-info');
    toast.classList.add(`toast-${type}`);
    text.textContent = message;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => this.hideToast(), 4000);
  }

  private hideToast(): void {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('hidden');
    toast.classList.remove('toast-success', 'toast-error', 'toast-info');
  }
}

const controller = new PopupController();
controller.init();
