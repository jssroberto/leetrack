import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@web/src/environments/environment.prod';
import { catchError, Observable, tap, throwError } from 'rxjs';

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
  private httpClient = inject(HttpClient);

  private problems = signal<Problem[]>([]);
  private problemsLoaded = signal<boolean>(false);

  public readonly problems$ = this.problems.asReadonly();

  public readonly blind75 = computed(() =>
    this.problems().filter(p => p.isBlind75)
  );

  public readonly neetCode150 = computed(() =>
    this.problems().filter(p => p.isNeetCode150)
  );

  getProblem(id: string): Problem | undefined {
    return this.problems().find(p => p.id === id || p.slug === id);
  }

  getProblems(forceRefresh = false): Observable<Problem[]> {
    // Si ya tenemos datos cargados y no es refresh forzado, retornar los datos actuales
    if (this.problemsLoaded() && !forceRefresh) {
      return new Observable(observer => {
        observer.next(this.problems());
        observer.complete();
      });
    }

    return this.httpClient.get<Problem[]>(this.apiUrl).pipe(
      tap(data => {
        this.problems.set(data);
        this.problemsLoaded.set(true);
      }),
      catchError(err => {
        console.error('Error loading problems:', err);
        return throwError(() => err);
      })
    );
  }

  // Método para forzar recarga desde el servidor
  refreshProblems(): Observable<Problem[]> {
    return this.getProblems(true);
  }

  clearCache(): void {
    this.problems.set([]);
    this.problemsLoaded.set(false);
  }
}