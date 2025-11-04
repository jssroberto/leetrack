import { Logger } from '@extension/utils/logger';
import type { SubmissionData, ExtensionMessage } from '@extension/types/leetcode';

class SubmissionTracker {
  private observer: MutationObserver | null = null;

  async init(): Promise<void> {
    this.watchForSubmissions();
    Logger.log('Content script initialized');
  }

  private watchForSubmissions(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          this.checkForAcceptedStatus(mutation.target as HTMLElement);
        }
      }
    });

    const observeTarget = document.body;
    this.observer.observe(observeTarget, {
      childList: true,
      subtree: true,
    });

    Logger.debug('Observing DOM for submissions');
  }

  private checkForAcceptedStatus(element: HTMLElement): void {
    const acceptedTexts = ['Accepted', 'accepted', 'Runtime'];
    const hasAccepted = acceptedTexts.some((text) =>
      element.textContent?.toLowerCase().includes(text.toLowerCase())
    );

    if (hasAccepted) {
      this.handlePotentialAcceptedSubmission();
    }
  }

  private async handlePotentialAcceptedSubmission(): Promise<void> {
    try {
      await this.delay(1000);
      const submission = await this.extractSubmissionData();

      if (!submission) {
        Logger.warn('Could not extract submission data');
        return;
      }

      Logger.log('Detected accepted submission', submission.titleSlug);

      const message: ExtensionMessage = {
        type: 'SUBMISSION_ACCEPTED',
        payload: submission,
      };

      chrome.runtime.sendMessage(message, (response: any) => {
        if (chrome.runtime.lastError) {
          Logger.error('Failed to send message', chrome.runtime.lastError);
          return;
        }
        Logger.log('Submission sent to background', response);
      });
    } catch (error) {
      Logger.error('Error handling submission', error);
    }
  }

  private async extractSubmissionData(): Promise<SubmissionData | null> {
    try {
      const titleElement =
        document.querySelector('[data-cy="question-title"]') ||
        document.querySelector('div[class*="title"]');

      if (!titleElement) return null;

      const title = titleElement.textContent?.trim() || '';
      const titleSlug = this.extractTitleSlug();

      const difficultyElement = document.querySelector('[diff]') ||
        document.querySelector('div[class*="difficulty"]');
      const difficulty = this.extractDifficulty(difficultyElement);

      const languageElement = document.querySelector('[data-mode-id]') ||
        document.querySelector('button[class*="lang"]');
      const language = languageElement?.textContent?.trim() || 'unknown';

      return {
        questionId: this.extractQuestionId(),
        titleSlug,
        questionTitle: title,
        difficulty,
        status: 'Accepted',
        timestamp: Date.now(),
        language,
      };
    } catch (error) {
      Logger.error('Failed to extract submission data', error);
      return null;
    }
  }

  private extractTitleSlug(): string {
    const url = window.location.pathname;
    const match = url.match(/\/problems\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  private extractQuestionId(): number {
    const url = window.location.pathname;
    const match = url.match(/\/problems\/[^\/]+/);
    if (match) {
      const problemSlug = this.extractTitleSlug();
      return problemSlug.length * 100 + problemSlug.charCodeAt(0);
    }
    return Date.now() % 10000;
  }

  private extractDifficulty(element: Element | null): 'Easy' | 'Medium' | 'Hard' {
    const text = element?.textContent?.toLowerCase() || '';
    if (text.includes('easy')) return 'Easy';
    if (text.includes('medium')) return 'Medium';
    if (text.includes('hard')) return 'Hard';
    return 'Medium';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const tracker = new SubmissionTracker();
tracker.init();
