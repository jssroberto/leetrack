export interface SubmissionData {
  submissionId: number;
  questionId: number;
  titleSlug: string;
  questionTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Accepted' | 'Wrong' | 'Compile Error';
  timestamp: number;
  language: string;
}

export interface StoredSubmission extends SubmissionData {
  synced: boolean;
  syncedAt?: number;
}

export interface ExtensionMessage {
  type:
    | 'SUBMISSION_ACCEPTED'
    | 'GET_SYNC_STATUS'
    | 'SYNC_SUBMISSIONS'
    | 'GET_AUTH_TOKEN'
    | 'CLEAR_AUTH'
    | 'SHOW_SUBMISSION_TOAST';
  payload?: any;
}

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface ApiSubmissionRequest {
  questionId: number;
  titleSlug: string;
  difficulty: string;
  language: string;
  timestamp: number;
}

export interface ApiSubmissionResponse {
  id: string;
  userId: string;
  questionId: number;
  createdAt: string;
  xpEarned: number;
}

export interface LeetCodeSubmissionDetail {
  submissionId: number;
  statusDisplay: string;
  lang: {
    name: string;
  };
  question: {
    questionId: number;
    titleSlug: string;
    title: string;
    difficulty: string;
  };
  timestamp: number;
}
