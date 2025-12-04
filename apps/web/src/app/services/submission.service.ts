import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@web/src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  lang: string;
  submittedAt: string; // Las fechas vienen como string ISO desde JSON
  confidenceLevel?: 'LOW' | 'MEDIUM' | 'HIGH'; // Asumiendo tu Enum

  problem?: {
    id: string;
    title: string;
    slug: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  };
}

@Injectable({
  providedIn: 'root',
})
export class SubmissionsService {
  private apiUrl = `${environment.apiBaseUrl}/submissions`;
  private httpClient = inject(HttpClient);

  private mySubmissionsSubject = new BehaviorSubject<Submission[]>([]);
  public mySubmissions$ = this.mySubmissionsSubject.asObservable();

  // 2. Estado de Carga
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor() {}

  /**
   * Carga las submissions del usuario autenticado (Token JWT)
   * GET /submissions
   */
  loadMySubmissions(): void {
    this.isLoadingSubject.next(true);

    this.httpClient.get<Submission[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.mySubmissionsSubject.next(data);
        this.isLoadingSubject.next(false);
      },
      error: (err) => {
        console.error('Error al cargar submissions:', err);
        this.isLoadingSubject.next(false);
      },
    });
  }

  getUserSubmissions(userId: string): Observable<Submission[]> {
    return this.httpClient.get<Submission[]>(`${this.apiUrl}/user/${userId}`);
  }

  isProblemSolved(problemId: string): boolean {
    return this.mySubmissionsSubject.value.some((s) => s.problemId === problemId);
  }

  /**
   * Cuenta cuántos problemas únicos ha resuelto
   */
  getSolvedCount(): number {
    const uniqueProblems = new Set(this.mySubmissionsSubject.value.map((s) => s.problemId));
    return uniqueProblems.size;
  }
}
