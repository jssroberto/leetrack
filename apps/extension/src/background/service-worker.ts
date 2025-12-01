import { ApiClient } from '@extension/background/api-client';
import type { ExtensionMessage, SubmissionData } from '@extension/types/leetcode';
import { Logger } from '@extension/utils/logger';
import { StorageManager } from '@extension/utils/storage';

class BackgroundService {
  private storage = new StorageManager();
  private apiClient = new ApiClient();
  private syncInterval: number | null = null;

  async init(): Promise<void> {
    this.setupMessageListeners();
    this.startPeriodicSync();
    this.syncActiveProblems().catch((error) => {
      Logger.error('Initial active problems sync failed', error);
    });
    Logger.log('Service worker initialized');
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, sender: any, sendResponse: (response: any) => void) => {
        this.handleMessage(message)
          .then(sendResponse)
          .catch((error) => {
            Logger.error('Message handler error', error);
            sendResponse({ error: (error as Error).message });
          });
        return true;
      },
    );
  }

  private async handleMessage(message: ExtensionMessage): Promise<any> {
    switch (message.type) {
      case 'SUBMISSION_ACCEPTED':
        await this.handleNewSubmission(message.payload as SubmissionData);
        return { success: true };

      case 'GET_AUTH_TOKEN': {
        const token = await this.storage.getAuthToken();
        return { token };
      }

      case 'SYNC_SUBMISSIONS':
        await this.syncPendingSubmissions();
        return { success: true };

      case 'GET_SYNC_STATUS': {
        const pending = await this.storage.getPendingSubmissions();
        const lastSync = await this.storage.getLastSync();
        return { pendingCount: pending.length, lastSync };
      }

      case 'CLEAR_AUTH':
        await this.storage.clearAuthData();
        return { success: true };

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleNewSubmission(submission: SubmissionData): Promise<void> {
    let notificationStatus: 'queued' | 'synced' = 'queued';
    try {
      await this.storage.saveSubmission(submission);
      const token = await this.storage.getAuthToken();

      if (!token) {
        Logger.warn('No auth token, queuing submission');
        await this.storage.savePendingSubmission(submission);
        return;
      }

      const isExpired = await this.storage.isTokenExpired();
      if (isExpired) {
        Logger.warn('Token expired, queuing submission');
        await this.storage.savePendingSubmission(submission);
        return;
      }

      await this.apiClient.submitProblem(submission, token);

      await this.storage.markSubmissionSynced(submission.questionId);
      Logger.log('Submission synced', submission.titleSlug);
      notificationStatus = 'synced';
    } catch (error) {
      Logger.error('Failed to handle submission, queuing', error);
      await this.storage.savePendingSubmission(submission);
    } finally {
      await this.notifyUser(submission, notificationStatus);
    }
  }

  private async syncPendingSubmissions(): Promise<void> {
    const pending = await this.storage.getPendingSubmissions();
    if (pending.length === 0) {
      Logger.log('No pending submissions');
      return;
    }

    const token = await this.storage.getAuthToken();
    if (!token) {
      Logger.warn('Cannot sync: no auth token');
      return;
    }

    const isExpired = await this.storage.isTokenExpired();
    if (isExpired) {
      Logger.warn('Cannot sync: token expired');
      return;
    }

    Logger.log(`Syncing ${pending.length} pending submissions`);

    for (const submission of pending) {
      try {
        await this.apiClient.submitProblem(submission, token);

        await this.storage.markSubmissionSynced(submission.questionId);
        Logger.log('Synced', submission.titleSlug);
      } catch (error) {
        Logger.error('Failed to sync submission', { submission, error });
      }
    }

    await this.storage.setLastSync(Date.now());
  }

  private startPeriodicSync(): void {
    const FIVE_MINUTES = 5 * 60 * 1000;

    this.syncInterval = setInterval(() => {
      this.syncPendingSubmissions().catch((error) => {
        Logger.error('Periodic sync failed', error);
      });
      this.syncActiveProblems().catch((error) => {
        Logger.error('Active problems sync failed', error);
      });
    }, FIVE_MINUTES) as unknown as number;

    Logger.log('Periodic sync started (5 min interval)');
  }

  private async syncActiveProblems(): Promise<void> {
    const token = await this.storage.getAuthToken();
    if (!token) return;

    const isExpired = await this.storage.isTokenExpired();
    if (isExpired) return;

    const problems = await this.apiClient.getActiveChallengeProblems(token);
    await this.storage.saveActiveProblems(problems);
    Logger.log(`Synced ${problems.length} active challenge problems`);
  }

  private async notifyUser(submission: SubmissionData, status: 'synced' | 'queued'): Promise<void> {
    await this.showSubmissionNotification(submission, status);
    await this.openPopupWithToast(submission, status);
  }

  private async showSubmissionNotification(
    submission: SubmissionData,
    status: 'synced' | 'queued',
  ): Promise<void> {
    if (!chrome?.notifications?.create) {
      return;
    }

    const iconUrl = chrome.runtime.getURL('assets/icons/icon-128.png');
    const message =
      status === 'synced'
        ? 'Submission synced with LeeTrack.'
        : 'Submission saved locally. Will sync soon.';

    const options = {
      type: 'basic',
      iconUrl,
      title: `Accepted: ${submission.questionTitle || submission.titleSlug}`,
      message,
      priority: 0,
    };

    try {
      const result = chrome.notifications.create(undefined, options);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      Logger.warn('Failed to show notification', error);
    }
  }

  private async openPopupWithToast(
    submission: SubmissionData,
    status: 'synced' | 'queued',
  ): Promise<void> {
    if (!chrome?.action?.openPopup) {
      return;
    }

    try {
      const openResult = chrome.action.openPopup();
      if (openResult instanceof Promise) {
        await openResult;
      }
      setTimeout(() => {
        chrome.runtime
          .sendMessage({
            type: 'SHOW_SUBMISSION_TOAST',
            payload: {
              title: submission.questionTitle || submission.titleSlug,
              status,
            },
          })
          .catch((error: unknown) => {
            Logger.warn('Failed to send toast message', error);
          });
      }, 300);
    } catch (error) {
      Logger.warn('Failed to open popup UI', error);
    }
  }
}

const service = new BackgroundService();
service.init();
