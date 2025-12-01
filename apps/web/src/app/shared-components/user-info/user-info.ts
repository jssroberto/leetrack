import { Component, inject, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { IconService } from '../../services/icon.service';
import { LucideAngularModule } from "lucide-angular";
import { Group } from '../../services/group.service';

@Component({
  selector: 'app-user-info',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './user-info.html',
  styleUrl: './user-info.css'
})
export class UserInfo {
  private authService = inject(AuthService);
  private iconService = inject(IconService);

  @Input() user!: Group['members'][0];

  currentUser = this.authService.currentUser;

  get dots() {
    return this.iconService.iconsMap['ellipsis-vertical'];
  }
}
