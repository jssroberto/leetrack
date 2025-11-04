import { StorageManager } from '@extension/utils/storage';
import { ApiClient } from '@extension/background/api-client';
import { Logger } from '@extension/utils/logger';
import type { ExtensionMessage } from '@extension/types/leetcode';
import './popup.css';

class PopupController {
  private storage = new StorageManager();
  private apiClient = new ApiClient();

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

    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.showSettingsScreen();
    });

    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
      this.handleSaveSettings();
    });

    document.getElementById('back-settings-btn')?.addEventListener('click', () => {
      this.showMainScreen();
    });

    document.getElementById('register-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'http://localhost:4200/auth/register' });
    });
  }

  private async handleLogin(): Promise<void> {
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    try {
      const authData = await this.apiClient.login(username, password);
      await this.storage.setAuthToken(authData.accessToken, authData.expiresIn);
      await this.storage.setUserId(username);

      this.showMainScreen();
      this.updateRecentSubmissions();
      Logger.log('Login successful');
    } catch (error) {
      Logger.error('Login failed', error);
      alert('Login failed. Please check your credentials.');
    }
  }

  private async handleSync(): Promise<void> {
    const message: ExtensionMessage = { type: 'SYNC_SUBMISSIONS' };

    chrome.runtime.sendMessage(message, (response: any) => {
      if (response?.success) {
        this.updateRecentSubmissions();
        alert('Sync completed!');
      } else {
        alert('Sync failed');
      }
    });
  }

  private async handleLogout(): Promise<void> {
    await this.storage.clearAuthData();
    this.showAuthScreen();
    Logger.log('Logged out');
  }

  private async handleSaveSettings(): Promise<void> {
    const apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
    const apiUrl = apiUrlInput.value.trim();

    if (apiUrl) {
      this.apiClient.setBaseURL(apiUrl);
      alert('Settings saved');
      this.showMainScreen();
    }
  }

  private showAuthScreen(): void {
    this.switchScreen('auth-screen');
  }

  private showMainScreen(): void {
    this.switchScreen('main-screen');
    this.updateRecentSubmissions();
    this.updateSyncStatus();
  }

  private showSettingsScreen(): void {
    this.switchScreen('settings-screen');
  }

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
}

const controller = new PopupController();
controller.init();
