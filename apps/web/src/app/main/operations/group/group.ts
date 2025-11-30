import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, FormsModule, SubTitle, RouterLink],
  templateUrl: './group.html',
  styleUrl: './group.css'
})
export class Group {
  private route = inject(ActivatedRoute);

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.currentFilter.set(params['operation'] || 'create');
    });
  }

  // while
  currentGroup: any | null = null;
  currentFilter = signal<string>('join');

  get subtitle(): string {
    return this.currentFilter() === 'create' ? 'Create a new group to get started' : 'Join a group to get started';
  }

  get currentFilterValue(): string {
    return this.currentFilter();
  }

  get decition(): string {
    return this.currentFilterValue === 'create' ? 'Join a Group' : 'Create a Group';
  }

  get operation(): string {
    return this.currentFilterValue === 'create' ? 'join' : 'create';
  }

  get title(): string {
    return this.currentFilter() === 'create' ? 'Create Group' : 'Join Group';
  }
}