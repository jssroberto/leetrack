import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CreateProposalDto {
  categoryId: string;
  title?: string;
  description?: string;
  targetDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProposalService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/problems/categories`);
  }

  createProposal(groupId: string, data: CreateProposalDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/${groupId}/proposals`, data);
  }
}
