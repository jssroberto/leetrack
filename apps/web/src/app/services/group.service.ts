import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private apiUrl = `${environment.apiBaseUrl}/groups`;
  private http = inject(HttpClient);

  // Clave para localStorage
  private readonly GROUP_ID_KEY = 'selected_group_id';

  private currentGroupIdSubject = signal<string | null>(this.getStoredGroupId());
  public currentGroupId$ = this.currentGroupIdSubject.asReadonly();

  constructor() { }

  // Crear grupo y seleccionarlo
  createGroup(name: string): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, { name }).pipe(
      tap(group => this.selectGroup(group.id))
    );
  }

  // Unirse y seleccionarlo
  joinGroup(inviteCode: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/join`, { inviteCode }).pipe(
      tap(group => this.selectGroup(group.id))
    );
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl);
  }

  selectGroup(groupId: string): void {
    localStorage.setItem(this.GROUP_ID_KEY, groupId);
    this.currentGroupIdSubject.set(groupId);
  }

  clearSelectedGroup(): void {
    localStorage.removeItem(this.GROUP_ID_KEY);
    this.currentGroupIdSubject.set(null);
  }

  getStoredGroupId(): string | null {
    return localStorage.getItem(this.GROUP_ID_KEY);
  }

  getGroupById(groupId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${groupId}`);
  }
}