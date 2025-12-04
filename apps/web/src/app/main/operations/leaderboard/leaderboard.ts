import { Component, inject } from '@angular/core';
import { IconService } from '@web/src/app/services/icon.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { LucideAngularModule } from "lucide-angular";
import { LogCard } from "@web/src/app/shared-components/complex-components/log-card/log-card";
import { RankingCard } from "@web/src/app/shared-components/ranking-card/ranking-card";
import { GroupsService } from '@web/src/app/services/group.service';
import { SubmissionsService } from '@web/src/app/services/submission.service';

@Component({
  selector: 'app-leaderboard',
  imports: [MainTitle, SubTitle, LucideAngularModule, RankingCard],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css'
})
export class Leaderboard {
  private iconService = inject(IconService);
  private submissionsService = inject(SubmissionsService);
  private groupsService = inject(GroupsService);

  currentGroup = this.groupsService.currentGroup$;
  isLoadingGroup = this.groupsService.isLoading$;

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
      console.log('Invite code copied!');
    }
  }

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }
}
