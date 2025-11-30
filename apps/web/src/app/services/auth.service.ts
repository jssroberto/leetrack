import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, switchMap, map } from 'rxjs'; // <--- Importante: switchMap y map
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { GroupsService, Group } from '@web/src/app/services/group.service'; // Asegúrate de importar Group interface

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  leetcodeUsername?: string;
  createdAt: string;
  updatedAt: string;
  role: Role;
}

export enum Role {
  ADMIN,
  MEMBER
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

  private httpClient = inject(HttpClient);
  private router = inject(Router);

  constructor(
    private groupsService: GroupsService
  ) { }

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

  login(email: string, password: string): Observable<boolean> {
    return this.httpClient.post<LoginResponse>(`${this.authBaseUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        this.isAuthenticatedSubject.next(true);
      }),
      switchMap(() => this.httpClient.get<User>(`${this.authBaseUrl}/me`)),
      tap(user => this.currentUserSubject.next(user)),
      switchMap(() => this.groupsService.getMyGroups()),
      map(groups => {
        this.handleGroupSelection(groups);
        return true; 
      })
    );
  }

  logout(): void {
    this.removeToken();
    this.groupsService.clearSelectedGroup();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  loadCurrentUser(): void {
    this.httpClient.get<User>(`${this.authBaseUrl}/me`).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        this.autoSelectGroup();
      },
      error: (error) => {
        if (error.status === 401) {
          this.logout();
        }
        console.error('Error loading user:', error);
      }
    });
  }

  private autoSelectGroup(): void {
    this.groupsService.getMyGroups().subscribe({
      next: (groups) => this.handleGroupSelection(groups),
      error: (err) => console.error('Error fetching groups for auto-select', err)
    });
  }

  private handleGroupSelection(groups: any[]): void {
    if (!groups || groups.length === 0) {
      this.groupsService.clearSelectedGroup();
      return;
    }

    const storedId = this.groupsService.getStoredGroupId();
    
    const isStoredValid = storedId && groups.some(g => g.id === storedId);

    if (isStoredValid && storedId) {
      this.groupsService.selectGroup(storedId);
    } else {
      this.groupsService.selectGroup(groups[0].id);
    }
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