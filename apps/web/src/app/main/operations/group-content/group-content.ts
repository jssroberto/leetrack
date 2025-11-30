import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@web/src/app/services/auth.service';
import { GroupsService } from '@web/src/app/services/group.service'; // Importar
import { BasicCard } from "@web/src/app/shared-components/basic-card/basic-card";
import { UserInfo } from "@web/src/app/shared-components/user-info/user-info";
import { finalize } from 'rxjs';

// Interfaces adaptadas para tu vista
export interface GroupMember {
  userId: string;
  name: string; // Puede ser leetcodeUsername o email
  email: string;
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
  standalone: true,
  imports: [CommonModule, FormsModule, BasicCard, UserInfo],
  templateUrl: './group-content.html',
  styleUrl: './group-content.css'
})
export class GroupContent implements OnInit {
  private authService = inject(AuthService);
  private groupsService = inject(GroupsService);

  public isLoading = signal<boolean>(true);
  public currentGroup: GroupData | null = null;
  
  public adminMember: GroupMember | null = null;
  public otherMembers: GroupMember[] = [];

  ngOnInit() {
    this.loadGroupData();
  }

  loadGroupData() {
    const groupId = this.groupsService.getCurrentGroupId();

    if (!groupId) {
      console.error('No group ID selected');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    this.groupsService.getGroupById(groupId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (backendData) => {
          this.currentGroup = this.mapBackendDataToView(backendData);
          
          this.organizeMembers(this.currentGroup.members);
        },
        error: (err) => {
          console.error('Error loading group details:', err);
        }
      });
  }

  private mapBackendDataToView(data: any): GroupData {
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

  private organizeMembers(members: GroupMember[]) {
    this.adminMember = members.find(m => m.role === 'ADMIN') || null;
    
    this.otherMembers = members.filter(m => m.role !== 'ADMIN');
  }

  copyInviteCode() {
    if (this.currentGroup?.inviteCode) {
      navigator.clipboard.writeText(this.currentGroup.inviteCode);
      // Aquí podrías mostrar un toast/alerta pequeña
    }
  }
}