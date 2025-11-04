import { StorageManager } from '@extension/utils/storage';
import { ApiClient } from '@extension/background/api-client';
import { Logger } from '@extension/utils/logger';
import type { ExtensionMessage, SubmissionData } from '@extension/types/leetcode';

class BackgroundService {
  private storage = new StorageManager();
  private apiClient = new ApiClient();
  private syncInterval: number | null = null;

  async init(): Promise<void> {
    this.setupMessageListeners();
    this.startPeriodicSync();
    Logger.log('Service worker initialized');
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender: any, sendResponse: (response: any) => void) => {
      this.handleMessage(message)
        .then(sendResponse)
        .catch((error) => {
          Logger.error('Message handler error', error);
          sendResponse({ error: (error as Error).message });
        });
      return true;
    });
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

      await this.apiClient.submitProblem(
        {
          questionId: submission.questionId,
          titleSlug: submission.titleSlug,
          difficulty: submission.difficulty,
          language: submission.language,
          timestamp: submission.timestamp,
        },
        token
      );

      await this.storage.markSubmissionSynced(submission.questionId);
      Logger.log('Submission synced', submission.titleSlug);
    } catch (error) {
      Logger.error('Failed to handle submission, queuing', error);
      await this.storage.savePendingSubmission(submission);
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
        await this.apiClient.submitProblem(
          {
            questionId: submission.questionId,
            titleSlug: submission.titleSlug,
            difficulty: submission.difficulty,
            language: submission.language,
            timestamp: submission.timestamp,
          },
          token
        );

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
    }, FIVE_MINUTES) as unknown as number;

    Logger.log('Periodic sync started (5 min interval)');
  }
}

const service = new BackgroundService();
service.init();
