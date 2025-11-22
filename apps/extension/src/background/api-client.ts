import type {
  ApiSubmissionRequest,
  ApiSubmissionResponse,
  AuthToken,
} from '@extension/types/leetcode';
import { Logger } from '@extension/utils/logger';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || (__LEETRACK_API_URL__ ?? 'http://localhost:3002');
  }

  async submitProblem(
    submission: ApiSubmissionRequest,
    token: string,
  ): Promise<ApiSubmissionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return (await response.json()) as ApiSubmissionResponse;
    } catch (error) {
      Logger.error('Failed to submit problem', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthToken> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = (await response.json()) as { accessToken: string; expiresIn?: number };
      return {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn || 86400,
      };
    } catch (error) {
      Logger.error('Login failed', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
