import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private httpClient = inject(HttpClient);

  private problemsSubject = signal<Problem[]>([]);
  private isLoadingSubject = signal<boolean>(false);

  public readonly problems = this.problemsSubject.asReadonly();
  public readonly isLoading = this.isLoadingSubject.asReadonly();

  // Computed signals para listas filtradas
  public readonly blind75 = computed(() =>
    this.problemsSubject().filter(p => p.isBlind75)
  );

  public readonly neetCode150 = computed(() =>
    this.problemsSubject().filter(p => p.isNeetCode150)
  );

  loadProblems(): void {
    this.isLoadingSubject.set(true);

    this.httpClient.get<Problem[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.problemsSubject.set(data);
        this.isLoadingSubject.set(false);
      },
      error: (err) => {
        console.error('Error al cargar problemas:', err);
        this.isLoadingSubject.set(false);
      }
    });
  }

  // Método síncrono que retorna el valor directamente
  getProblem(id: string): Problem | undefined {
    return this.problemsSubject().find(p => p.id === id || p.slug === id);
  }

  // computed signal
  getProblemSignal(id: string) {
    return computed(() =>
      this.problemsSubject().find(p => p.id === id || p.slug === id)
    );
  }
}