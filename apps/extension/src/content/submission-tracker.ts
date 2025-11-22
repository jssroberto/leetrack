import { injectNetworkInterceptor } from '@extension/content/injector';
import type { ExtensionMessage, SubmissionData } from '@extension/types/leetcode';
import { Logger } from '@extension/utils/logger';

const MESSAGE_SOURCE = 'leetrack';
const SUBMISSION_EVENT = 'SUBMISSION_DETAILS';
const QUESTION_EVENT = 'QUESTION_DETAIL';

interface InterceptedSubmissionMessage {
  submission: {
    timestamp: number;
    statusCode: number;
    lang?: {
      name?: string;
      verboseName?: string;
    };
    question?: {
      questionId?: string | number;
      titleSlug?: string;
    };
  };
  variables?: {
    submissionId?: number;
  };
  submissionId?: number | null;
}

interface QuestionMetadata {
  questionId: number;
  titleSlug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

class SubmissionTracker {
  private questionMetaCache = new Map<string, QuestionMetadata>();
  private processedSubmissions = new Map<number, number>();
  private readonly SUBMISSION_TTL = 5 * 60 * 1000;

  async init(): Promise<void> {
    injectNetworkInterceptor();
    this.setupNetworkListeners();
    Logger.log('Content script initialized');
  }

  private setupNetworkListeners(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.source !== MESSAGE_SOURCE) return;

      Logger.debug(
        `Message from injector: ${data.type} (${data.payload?.submissionId ?? 'unknown'})`,
      );

      if (data.type === QUESTION_EVENT) {
        this.cacheQuestionMetadata(data.payload as QuestionMetadata);
      } else if (data.type === SUBMISSION_EVENT) {
        this.handleNetworkSubmission(data.payload as InterceptedSubmissionMessage);
      }
    });
  }

  private cacheQuestionMetadata(metadata: QuestionMetadata): void {
    if (!metadata?.titleSlug) return;
    this.questionMetaCache.set(metadata.titleSlug, metadata);
  }

  private handleNetworkSubmission(payload: InterceptedSubmissionMessage): void {
    if (!payload?.submission) return;
    const submissionId = Number(
      payload.submissionId ??
        payload.variables?.submissionId ??
        payload.submission?.timestamp ??
        Date.now(),
    );

    if (this.hasProcessed(submissionId)) {
      return;
    }

    if (payload.submission.statusCode !== 10) {
      return;
    }

    const slug = payload.submission.question?.titleSlug || '';
    const metadata = slug ? this.questionMetaCache.get(slug) : undefined;

    const submission: SubmissionData = {
      submissionId,
      questionId: Number(
        payload.submission.question?.questionId ?? metadata?.questionId ?? this.extractQuestionId(),
      ),
      titleSlug: slug || this.extractTitleSlug(),
      questionTitle: metadata?.title || this.extractFallbackTitle(),
      difficulty: metadata?.difficulty || this.extractFallbackDifficulty(),
      status: 'Accepted',
      timestamp: Number(payload.submission.timestamp || Date.now() / 1000) * 1000,
      language: payload.submission.lang?.name || payload.submission.lang?.verboseName || 'unknown',
    };

    // Ignore submissions older than 5 minutes (to avoid re-triggering when viewing history)
    const MAX_SUBMISSION_AGE = 5 * 60 * 1000;
    const age = Date.now() - submission.timestamp;
    if (age > MAX_SUBMISSION_AGE) {
      Logger.debug('Ignoring old submission', { slug, age });
      return;
    }

    this.markSubmissionProcessed(submissionId);
    this.forwardSubmission(submission);
    Logger.log('Submission captured via network', submission.titleSlug);
  }

  private extractFallbackTitle(): string {
    const titleElement =
      document.querySelector('[data-cy="question-title"]') ||
      document.querySelector('div[class*="title"]');
    return titleElement?.textContent?.trim() || 'Unknown Problem';
  }

  private extractFallbackDifficulty(): 'Easy' | 'Medium' | 'Hard' {
    // Try to find difficulty in the DOM
    // Also look for text content directly
    const elements = Array.from(document.querySelectorAll('div, span, p'));

    for (const el of elements) {
      const text = el.textContent?.trim();
      if (text === 'Easy' || text === 'Medium' || text === 'Hard') {
        // Check if it's likely the difficulty label (usually near the title)
        // This is a heuristic; might need refinement
        if (el.className.includes('text-') || el.className.includes('difficulty')) {
          return text as 'Easy' | 'Medium' | 'Hard';
        }
        // Fallback: if we find exact match in a small element
        if (text.length === (el.textContent || '').length) {
          return text as 'Easy' | 'Medium' | 'Hard';
        }
      }
    }

    return 'Medium'; // Ultimate fallback
  }

  private hasProcessed(id: number): boolean {
    return this.processedSubmissions.has(id);
  }

  private markSubmissionProcessed(id: number): void {
    this.processedSubmissions.set(id, Date.now());
    window.setTimeout(() => this.processedSubmissions.delete(id), this.SUBMISSION_TTL);
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

  private forwardSubmission(submission: SubmissionData): void {
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
  }
}

const tracker = new SubmissionTracker();
tracker.init();
