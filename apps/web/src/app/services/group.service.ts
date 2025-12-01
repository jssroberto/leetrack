import { inject, Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
  members: GroupMember[];
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private apiUrl = `${environment.apiBaseUrl}/groups`;
  private http = inject(HttpClient);
  private readonly GROUP_ID_KEY = 'selected_group_id';

  // Signals
  private currentGroupIdSubject = signal<string | null>(this.getStoredGroupId());
  public readonly currentGroupId = this.currentGroupIdSubject.asReadonly();

  private currentGroupSubject = signal<Group | null>(null);
  public readonly currentGroup = this.currentGroupSubject.asReadonly();

  private isLoadingSubject = signal<boolean>(false);
  public readonly isLoading = this.isLoadingSubject.asReadonly();

  constructor() {
    // Auto-cargar el grupo cuando cambia el ID
    effect(() => {
      const groupId = this.currentGroupIdSubject();
      if (groupId) {
        this.loadGroupData(groupId);
      } else {
        this.currentGroupSubject.set(null);
      }
    });
  }

  // Cargar datos del grupo actual
  private loadGroupData(groupId: string): void {
    this.isLoadingSubject.set(true);

    this.http.get<any>(`${this.apiUrl}/${groupId}`).subscribe({
      next: (backendData) => {
        const group = this.mapBackendDataToGroup(backendData);
        this.currentGroupSubject.set(group);
        this.isLoadingSubject.set(false);
      },
      error: (err) => {
        console.error('Error loading group:', err);
        this.isLoadingSubject.set(false);
        // Opcionalmente limpiar si el grupo no existe
        if (err.status === 404) {
          this.clearSelectedGroup();
        }
      }
    });
  }

  private mapBackendDataToGroup(data: any): Group {
    return {
      id: data.id,
      name: data.name,
      inviteCode: data.inviteCode,
      createdAt: new Date(data.createdAt),
      members: data.members.map((m: any) => ({
        userId: m.user.id,
        name: m.user.leetcodeUsername || m.user.email.split('@')[0],
        email: m.user.email,
        role: m.role,
        joinedAt: new Date(m.joinedAt)
      }))
    };
  }

  // Métodos públicos
  createGroup(name: string): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, { name }).pipe(
      tap(group => this.selectGroup(group.id))
    );
  }

  joinGroup(inviteCode: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/join/${inviteCode}`, {}).pipe(
      tap(group => this.selectGroup(group.id))
    );
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl);
  }

  selectGroup(groupId: string): void {
    localStorage.setItem(this.GROUP_ID_KEY, groupId);
    this.currentGroupIdSubject.set(groupId);
    // El effect() automáticamente cargará los datos
  }

  clearSelectedGroup(): void {
    localStorage.removeItem(this.GROUP_ID_KEY);
    this.currentGroupIdSubject.set(null);
    this.currentGroupSubject.set(null);
  }

  getStoredGroupId(): string | null {
    return localStorage.getItem(this.GROUP_ID_KEY);
  }

  // Forzar recarga si es necesario
  reloadCurrentGroup(): void {
    const groupId = this.currentGroupIdSubject();
    if (groupId) {
      this.loadGroupData(groupId);
    }
  }
}