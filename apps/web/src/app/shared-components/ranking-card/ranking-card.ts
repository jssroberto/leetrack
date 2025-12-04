import { Component, inject, Input } from '@angular/core';
import { BasicCard } from "../basic-card/basic-card";
import { GroupMember } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ranking-card',
  imports: [BasicCard, CommonModule],
  templateUrl: './ranking-card.html',
})
export class RankingCard {
  private authService = inject(AuthService);

  @Input() user!: GroupMember;
  @Input() rank!: number;

  get name() {
    if (this.user.userId == this.authService.currentUser()?.id) {
      return this.user.name + " (You)";
    }

    return this.user.name;
  }
}
