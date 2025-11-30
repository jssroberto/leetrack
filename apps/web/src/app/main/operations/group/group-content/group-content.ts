import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@web/src/app/services/auth.service';
import { BasicCard } from "@web/src/app/shared-components/basic-card/basic-card";
import { UserInfo } from "@web/src/app/shared-components/user-info/user-info";

export interface GroupMember {
  userId: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
}

export interface GroupData {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
  members: GroupMember[];
}

@Component({
  selector: 'app-group-content',
  imports: [CommonModule, FormsModule, BasicCard, UserInfo], // Importante para ngModel y @if
  templateUrl: './group-content.html',
  styleUrl: './group-content.css'
})
export class GroupContent {
  private authService = inject(AuthService);

  admin: GroupMember = {
    userId: this.authService.getCurrentUser()!.id,
    name: 'Admin User',
    role: 'ADMIN',
    joinedAt: new Date()
  };

  public isLoading = false;
  public currentGroup: GroupData | null = null;

  public noGroupMode: 'MENU' | 'CREATE' | 'JOIN' = 'MENU';
  public newGroupNameInput = '';
  public joinCodeInput = '';

  public isEditingName = false;
  public editedName = '';

  ngOnInit() {
    // SIMULACIÓN: Descomenta las siguientes líneas para ver cómo se ve CUANDO TIENES GRUPO
    this.currentGroup = {
      id: 'g-1',
      name: 'Algorithm Masters',
      inviteCode: 'A8F-9K2',
      createdAt: new Date(),
      members: [
        { userId: 'user-1', name: 'Maria Antonieta', role: 'MEMBER', joinedAt: new Date() },
        { userId: 'user-2', name: 'John Doe', role: 'MEMBER', joinedAt: new Date() },
        { userId: 'user-3', name: 'Sarah Smith', role: 'MEMBER', joinedAt: new Date() }
      ]
    };
  }
}
