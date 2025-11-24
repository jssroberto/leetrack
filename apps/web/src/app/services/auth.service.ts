import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  leetcodeUsername?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authBaseUrl = `${environment.apiBaseUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private httpClient = inject(HttpClient)
  private router = inject(Router)

  constructor() { }

  // Se ejecuta al iniciar la aplicación
  async initialize(): Promise<void> {
    if (this.hasToken()) {
      this.loadCurrentUser();
    }
  }

  register(email: string, password: string): Observable<User> {
    return this.httpClient.post<User>(`${this.authBaseUrl}/register`, {
      email,
      password
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>(`${this.authBaseUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        this.isAuthenticatedSubject.next(true);
        this.loadCurrentUser();
      })
    );
  }

  logout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  loadCurrentUser(): void {
    this.httpClient.get<User>(`${this.authBaseUrl}/me`).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
      },
      error: (error) => {
        // Solo cerrar sesión si el token es realmente inválido o expiró
        if (error.status === 401) {
          this.logout();
        }

        // Si es error de conexión (0) o servidor (500), mantenemos la sesión local
        console.error('Error loading user:', error);
      }
    });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private removeToken(): void {
    localStorage.removeItem('access_token');
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
