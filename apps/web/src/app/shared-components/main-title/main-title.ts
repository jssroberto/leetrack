import { Component, inject, Input } from '@angular/core';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../services/group.service';

@Component({
  selector: 'app-main-title',
  imports: [RouterLink],
  templateUrl: './main-title.html',
})
export class MainTitle {
  private authService = inject(AuthService);
  private groupsService = inject(GroupsService);

  @Input() title!: string;

  user = this.authService.currentUser;
  currentGroup = this.groupsService.currentGroup$;
  isLoadingGroup = this.groupsService.isLoading$;
}