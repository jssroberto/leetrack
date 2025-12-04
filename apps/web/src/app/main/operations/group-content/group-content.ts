import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@web/src/app/services/auth.service';
import { GroupsService } from '@web/src/app/services/group.service';
import { IconService } from '@web/src/app/services/icon.service';
import { SubmissionsService } from '@web/src/app/services/submission.service';
import { BasicCard } from "@web/src/app/shared-components/basic-card/basic-card";
import { UserInfo } from "@web/src/app/shared-components/user-info/user-info";
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: 'app-group-content',
  standalone: true,
  imports: [CommonModule, FormsModule, BasicCard, UserInfo, LucideAngularModule, RouterLink],
  templateUrl: './group-content.html',
})
export class GroupContent implements OnInit {
  private submissionsService = inject(SubmissionsService);
  private groupsService = inject(GroupsService);
  private iconService = inject(IconService);
  private authService = inject(AuthService);

  currentGroup = this.groupsService.currentGroup$;
  isLoadingGroup = this.groupsService.isLoading$;
  currentUser = this.authService.currentUser;

  public submissions$ = this.submissionsService.mySubmissions$;
  public isLoadingSubmissions$ = this.submissionsService.isLoading$;

  ngOnInit() {
    // Solo carga submissions, el grupo ya está cargado por el servicio
    this.submissionsService.loadMySubmissions();
  }

  copyInviteCode() {
    const inviteCode = this.currentGroup()?.inviteCode;
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      // Aquí podrías mostrar un toast/alerta pequeña
      console.log('Invite code copied!');
    }
  }

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }

  // this sum bs
  get isAdmin() {
    for (let member of this.groupsService.currentGroup$()?.members || []) {
      if (member.userId === this.currentUser()?.id && member.role === 'ADMIN') {
        return true;
      }
    }
    return false;
  }
}