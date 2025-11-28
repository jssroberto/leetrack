import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Problem {
  id: string; 
  
  leetcodeId: number;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'; 
  category: string;
  
  isNeetCode150: boolean;
  isBlind75: boolean;
  isPremium: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProblemsService {
  private apiUrl = `${environment.apiBaseUrl}/problems`;

  // 1. Estado Global de Problemas
  private problemsSubject = new BehaviorSubject<Problem[]>([]);
  public problems$ = this.problemsSubject.asObservable();

  // 2. Estado de Carga
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private httpClient = inject(HttpClient);

  constructor() {}

  /**
   * Carga todos los problemas del backend
   */
  loadProblems(): void {

    this.isLoadingSubject.next(true);

    this.httpClient.get<Problem[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.problemsSubject.next(data);
        this.isLoadingSubject.next(false);
      },
      error: (err) => {
        console.error('Error al cargar problemas:', err);
        this.isLoadingSubject.next(false);
      }
    });
  }

  getProblem(id: string): Observable<Problem | undefined> {
    return this.problems$.pipe(
      map(problems => problems.find(p => p.id === id || p.slug === id))
    );
  }

  getBlind75(): Observable<Problem[]> {
    return this.problems$.pipe(
      map(problems => problems.filter(p => p.isBlind75))
    );
  }

  getNeetCode150(): Observable<Problem[]> {
    return this.problems$.pipe(
      map(problems => problems.filter(p => p.isNeetCode150))
    );
  }
}