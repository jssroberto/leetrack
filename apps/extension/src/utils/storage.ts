import type { StoredSubmission, SubmissionData } from '@extension/types/leetcode';

export class StorageManager {
  private readonly KEYS = {
    AUTH_TOKEN: 'leetrack_auth_token',
    AUTH_EXPIRY: 'leetrack_auth_expiry',
    USER_ID: 'leetrack_user_id',
    SUBMISSIONS: 'leetrack_submissions',
    PENDING_SYNC: 'leetrack_pending_sync',
    LAST_SYNC: 'leetrack_last_sync',
  } as const;

  async getAuthToken(): Promise<string | null> {
    const data = await chrome.storage.local.get(this.KEYS.AUTH_TOKEN);
    return (data[this.KEYS.AUTH_TOKEN] as string | undefined) || null;
  }

  async setAuthToken(token: string, expiresIn: number): Promise<void> {
    const expiryTime = Date.now() + expiresIn * 1000;
    await chrome.storage.local.set({
      [this.KEYS.AUTH_TOKEN]: token,
      [this.KEYS.AUTH_EXPIRY]: expiryTime,
    });
  }

  async isTokenExpired(): Promise<boolean> {
    const data = await chrome.storage.local.get(this.KEYS.AUTH_EXPIRY);
    const expiry = data[this.KEYS.AUTH_EXPIRY] as number | undefined;
    return !expiry || Date.now() > expiry;
  }

  async getSubmissions(): Promise<StoredSubmission[]> {
    const data = await chrome.storage.local.get(this.KEYS.SUBMISSIONS);
    return (data[this.KEYS.SUBMISSIONS] as StoredSubmission[] | undefined) || [];
  }

  async saveSubmission(submission: SubmissionData): Promise<void> {
    const submissions = await this.getSubmissions();
    submissions.push({
      ...submission,
      synced: false,
    });
    await chrome.storage.local.set({
      [this.KEYS.SUBMISSIONS]: submissions,
    });
  }

  async getPendingSubmissions(): Promise<SubmissionData[]> {
    const data = await chrome.storage.local.get(this.KEYS.PENDING_SYNC);
    return (data[this.KEYS.PENDING_SYNC] as SubmissionData[] | undefined) || [];
  }

  async savePendingSubmission(submission: SubmissionData): Promise<void> {
    const pending = await this.getPendingSubmissions();
    if (!pending.find((s) => s.questionId === submission.questionId)) {
      pending.push(submission);
      await chrome.storage.local.set({
        [this.KEYS.PENDING_SYNC]: pending,
      });
    }
  }

  async markSubmissionSynced(questionId: number): Promise<void> {
    const submissions = await this.getSubmissions();
    const submission = submissions.find((s) => s.questionId === questionId);
    if (submission) {
      submission.synced = true;
      submission.syncedAt = Date.now();
      await chrome.storage.local.set({
        [this.KEYS.SUBMISSIONS]: submissions,
      });
    }

    const pending = await this.getPendingSubmissions();
    await chrome.storage.local.set({
      [this.KEYS.PENDING_SYNC]: pending.filter((s) => s.questionId !== questionId),
    });
  }

  async clearAuthData(): Promise<void> {
    await chrome.storage.local.remove([
      this.KEYS.AUTH_TOKEN,
      this.KEYS.AUTH_EXPIRY,
      this.KEYS.USER_ID,
    ]);
    await this.clearSubmissionData();
  }

  async clearSubmissionData(): Promise<void> {
    await chrome.storage.local.remove([
      this.KEYS.SUBMISSIONS,
      this.KEYS.PENDING_SYNC,
      this.KEYS.LAST_SYNC,
    ]);
  }

  async setUserId(userId: string): Promise<void> {
    await chrome.storage.local.set({
      [this.KEYS.USER_ID]: userId,
    });
  }

  async getUserId(): Promise<string | null> {
    const data = await chrome.storage.local.get(this.KEYS.USER_ID);
    return (data[this.KEYS.USER_ID] as string | undefined) || null;
  }

  async getLastSync(): Promise<number | null> {
    const data = await chrome.storage.local.get(this.KEYS.LAST_SYNC);
    return (data[this.KEYS.LAST_SYNC] as number | undefined) || null;
  }

  async setLastSync(timestamp: number): Promise<void> {
    await chrome.storage.local.set({
      [this.KEYS.LAST_SYNC]: timestamp,
    });
  }
}
