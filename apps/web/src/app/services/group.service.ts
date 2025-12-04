import { inject, Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, Observable, catchError, throwError } from 'rxjs';
import { environment } from '@web/src/environments/environment.prod';

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

  private currentGroupId = signal<string | null>(this.getStoredGroupId());
  public readonly currentGroupId$ = this.currentGroupId.asReadonly();

  private currentGroup = signal<Group | null>(null);
  public readonly currentGroup$ = this.currentGroup.asReadonly();

  private isLoading = signal<boolean>(false);
  public readonly isLoading$ = this.isLoading.asReadonly();

  constructor() {
    // Auto-cargar el grupo cuando cambia el ID
    effect(() => {
      const groupId = this.currentGroupId();
      if (groupId) {
        this.loadGroupData(groupId);
      } else {
        this.currentGroup.set(null);
      }
    });
  }

  // Cargar datos del grupo actual
  private loadGroupData(groupId: string): void {
    this.isLoading.set(true);

    this.http.get<any>(`${this.apiUrl}/${groupId}`).subscribe({
      next: (backendData) => {
        const group = this.mapBackendDataToGroup(backendData);
        this.currentGroup.set(group);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading group:', err);
        this.isLoading.set(false);

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
    this.currentGroupId.set(groupId);
  }

  clearSelectedGroup(): void {
    localStorage.removeItem(this.GROUP_ID_KEY);
    this.currentGroupId.set(null);
    this.currentGroup.set(null);
  }

  getStoredGroupId(): string | null {
    return localStorage.getItem(this.GROUP_ID_KEY);
  }

  kickMember(userId: string): Observable<any> {
    const currentGroup = this.currentGroup$();

    if (!currentGroup) {
      throw new Error('No group selected');
    }

    const groupId = currentGroup.id;

    return this.http.delete(`${this.apiUrl}/${groupId}/members/${userId}`).pipe(
      tap(() => {
        const updatedGroup = {
          ...currentGroup,
          members: currentGroup.members.filter(member => member.userId !== userId)
        };
        this.currentGroup.set(updatedGroup);

        console.log(`Member ${userId} removed from group ${groupId}`);
      }),
      catchError(error => {
        console.error('Error kicking member:', error);
        this.reloadCurrentGroup();
        return throwError(() => error);
      })
    );
  }

  // Forzar recarga si es necesario
  reloadCurrentGroup(): void {
    const groupId = this.currentGroupId();
    if (groupId) {
      this.loadGroupData(groupId);
    }
  }
}