import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupsService } from '@web/src/app/services/group.service'; // Asegúrate de importar esto

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, FormsModule, SubTitle, RouterLink],
  templateUrl: './group.html',
  styleUrl: './group.css'
})
export class Group {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupsService = inject(GroupsService);

  groupNameInput: string = '';
  inviteCodeInput: string = '';

  isLoading = false;
  errorMessage = '';

  currentFilter = signal<string>('create');

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.currentFilter.set(params['operation'] || 'create');
      this.errorMessage = '';
    });
  }

  // Lógica para Crear
  handleCreate() {
    if (!this.groupNameInput.trim()) return;

    this.isLoading = true;
    this.groupsService.createGroup(this.groupNameInput).subscribe({
      next: (group) => {
        this.isLoading = false;
        this.router.navigate(['/main/operations/group-content/group-content', group.id]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error creating group. Try again.';
        console.error(err);
      }
    });
  }

  // Lógica para Unirse
  handleJoin() {
    if (!this.inviteCodeInput.trim()) return;

    this.isLoading = true;
    this.groupsService.joinGroup(this.inviteCodeInput).subscribe({
      next: (group) => {
        this.isLoading = false;
        this.router.navigate(['/main/operations/group-content/group-content', group.id]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Invalid invite code or already joined.';
        console.error(err);
      }
    });
  }

  get subtitle(): string {
    return this.currentFilter() === 'create' ? 'Create a new group to get started' : 'Join a group to get started';
  }

  get decition(): string {
    return this.currentFilter() === 'create' ? 'Join a Group' : 'Create a Group';
  }

  get operation(): string {
    return this.currentFilter() === 'create' ? 'join' : 'create';
  }

  get title(): string {
    return this.currentFilter() === 'create' ? 'Create Group' : 'Join Group';
  }
}