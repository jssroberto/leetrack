import { Component, inject, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { GroupData } from '../../main/operations/group/group-content/group-content';
import { IconService } from '../../services/icon.service';
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: 'app-user-info',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './user-info.html',
  styleUrl: './user-info.css'
})
export class UserInfo {
  private authService = inject(AuthService);
  private iconService = inject(IconService);

  @Input() user!: GroupData['members'][0];

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get dots() {
    return this.iconService.iconsMap['ellipsis-vertical'];
  }
}
