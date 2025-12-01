import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GroupsService } from '@web/src/app/services/group.service';
import { SubmissionsService } from '@web/src/app/services/submission.service';
import { BasicCard } from "@web/src/app/shared-components/basic-card/basic-card";
import { InfoBasicCard } from '@web/src/app/shared-components/complex-components/info-basic-card/info-basic-card';
import { UserInfo } from "@web/src/app/shared-components/user-info/user-info";
import { IconRegistryService } from '@web/src/services/icon-registry.service';

// Estas interfaces ahora están en group.service.ts
// Puedes eliminarlas de aquí si quieres o mantenerlas para referencia local

@Component({
  selector: 'app-group-content',
  standalone: true,
  imports: [CommonModule, FormsModule, BasicCard, UserInfo, InfoBasicCard],
  templateUrl: './group-content.html',
  styleUrl: './group-content.css'
})
export class GroupContent implements OnInit {
  private iconRegistry = inject(IconRegistryService);
  private submissionsService = inject(SubmissionsService);
  private groupsService = inject(GroupsService);

  currentGroup = this.groupsService.currentGroup;
  isLoadingGroup = this.groupsService.isLoading;

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

  get linkIcon() {
    return this.iconRegistry.getIcon('link');
  }

  get arrowDownIcon() {
    return this.iconRegistry.getIcon('arrow_down');
  }
}