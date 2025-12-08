import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '@web/src/environments/environment'; // O la ruta relativa si prefieres
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  weeklyLeetcodes: number; // <--- 1. AGREGADO: Para que TypeScript lo reconozca
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
  providedIn: 'root',
})
export class GroupsService {
  private apiUrl = `${environment.apiBaseUrl}/groups`;
  private http = inject(HttpClient);
  private readonly GROUP_ID_KEY = 'selected_group_id';

  // Signals para el estado reactivo
  private currentGroupId = signal<string | null>(this.getStoredGroupId());
  public readonly currentGroupId$ = this.currentGroupId.asReadonly();

  private currentGroup = signal<Group | null>(null);
  public readonly currentGroup$ = this.currentGroup.asReadonly();

  private isLoading = signal<boolean>(false);
  public readonly isLoading$ = this.isLoading.asReadonly();

  constructor() {
    // Efecto: Cuando cambia el ID, cargamos los datos automáticamente
    effect(() => {
      const groupId = this.currentGroupId();
      if (groupId) {
        this.loadGroupData(groupId);
      } else {
        this.currentGroup.set(null);
      }
    });
  }

  // --- Carga de Datos ---
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
      },
    });
  }

  // --- Mapeo de Datos (Backend -> Frontend) ---
  private mapBackendDataToGroup(data: any): Group {
    return {
      id: data.id,
      name: data.name,
      inviteCode: data.inviteCode,
      weeklyLeetcodes: data.weeklyLeetcodes || 1, // <--- 2. AGREGADO: Mapeo del valor (con fallback a 1)
      createdAt: new Date(data.createdAt),
      members: data.members.map((m: any) => ({
        userId: m.user.id,
        // Lógica para obtener el nombre más amigable posible
        name: m.user.leetcodeUsername || m.user.email.split('@')[0],
        email: m.user.email,
        role: m.role,
        joinedAt: new Date(m.joinedAt),
      })),
    };
  }

  // --- Métodos Públicos (Actions) ---

  createGroup(name: string): Observable<Group> {
    return this.http
      .post<Group>(this.apiUrl, { name })
      .pipe(tap((group) => this.selectGroup(group.id)));
  }

  joinGroup(inviteCode: string): Observable<Group> {
    return this.http
      .post<Group>(`${this.apiUrl}/join/${inviteCode}`, {})
      .pipe(tap((group) => this.selectGroup(group.id)));
  }

  // Método updateGroup para Settings
  updateGroup(groupId: string, data: Partial<Group> | any): Observable<Group> {
    return this.http.patch<Group>(`${this.apiUrl}/${groupId}`, data).pipe(
      tap((updatedGroup) => {
        // Al recibir la respuesta actualizada, volvemos a mapear para actualizar la Signal
        const mappedGroup = this.mapBackendDataToGroup(updatedGroup);
        this.currentGroup.set(mappedGroup);
        console.log('Group updated locally with:', mappedGroup);
      })
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

  // --- Gestión de Miembros ---

  kickMember(userId: string): Observable<any> {
    const currentGroup = this.currentGroup$();

    if (!currentGroup) {
      throw new Error('No group selected');
    }

    const groupId = currentGroup.id;

    return this.http.delete(`${this.apiUrl}/${groupId}/members/${userId}`).pipe(
      tap(() => {
        // Optimistic update: Eliminamos al miembro localmente
        const updatedGroup = {
          ...currentGroup,
          members: currentGroup.members.filter((member) => member.userId !== userId),
        };
        this.currentGroup.set(updatedGroup);

        console.log(`Member ${userId} removed from group ${groupId}`);
      }),
      catchError((error) => {
        console.error('Error kicking member:', error);
        // Si falla, recargamos los datos reales para asegurar consistencia
        this.reloadCurrentGroup();
        return throwError(() => error);
      }),
    );
  }

  // Método público para leer el ID directamente (útil para guards o componentes no reactivos)
  getCurrentGroupId(): string | null {
    return this.currentGroupId();
  }
  
  // Método público para obtener el grupo directamente (útil si necesitas el valor snapshot)
  getCurrentGroupSnapshot(): Group | null {
    return this.currentGroup();
  }

  // Forzar recarga si es necesario
  reloadCurrentGroup(): void {
    const groupId = this.currentGroupId();
    if (groupId) {
      this.loadGroupData(groupId);
    }
  }

  // Método auxiliar para obtener detalles (usado por group-content si no usa la signal)
  getGroupById(groupId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${groupId}`);
  }
}