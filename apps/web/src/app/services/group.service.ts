import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  // ... otros campos
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private apiUrl = `${environment.apiBaseUrl}/groups`;
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Clave para localStorage
  private readonly GROUP_ID_KEY = 'selected_group_id';

  // Estado Reactivo del ID del grupo actual
  private currentGroupIdSubject = new BehaviorSubject<string | null>(this.getStoredGroupId());
  public currentGroupId$ = this.currentGroupIdSubject.asObservable();

  constructor() {}

  // --- MÉTODOS DE API ---

  // Crear grupo y seleccionarlo automáticamente
  createGroup(name: string): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, { name }).pipe(
      tap(group => this.selectGroup(group.id))
    );
  }

  // Unirse y seleccionarlo automáticamente
  joinGroup(inviteCode: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/join`, { inviteCode }).pipe(
      tap(group => this.selectGroup(group.id))
    );
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl);
  }

  // --- MÉTODOS DE GESTIÓN DE ESTADO ---

  selectGroup(groupId: string): void {
    localStorage.setItem(this.GROUP_ID_KEY, groupId);
    this.currentGroupIdSubject.next(groupId);
  }

  clearSelectedGroup(): void {
    localStorage.removeItem(this.GROUP_ID_KEY);
    this.currentGroupIdSubject.next(null);
  }

  // Hacer este método público para usarlo en AuthService
  public getStoredGroupId(): string | null {
    return localStorage.getItem(this.GROUP_ID_KEY);
  }

  getCurrentGroupId(): string | null {
    return this.currentGroupIdSubject.value;
  }

  getGroupById(groupId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${groupId}`);
  }
}