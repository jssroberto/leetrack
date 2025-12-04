import { Component, inject, Input, signal, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { IconService } from '../../services/icon.service';
import { LucideAngularModule } from "lucide-angular";
import { Group, GroupsService } from '../../services/group.service';

@Component({
  selector: 'app-user-info',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './user-info.html',
  styleUrl: './user-info.css'
})
export class UserInfo {
  private authService = inject(AuthService);
  private iconService = inject(IconService);
  private groupsService = inject(GroupsService);

  @Input() user!: Group['members'][0];

  currentUser = this.authService.currentUser;

  showMenu = signal(false);
  isKicking = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-card-wrapper')) {
      this.closeMenu();
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.showMenu.update(val => !val);
  }

  closeMenu() {
    this.showMenu.set(false);
  }

  async onKickMember() {
    if (!this.user || this.isKicking()) return;

    if (this.user.userId === this.currentUser()?.id) {
      console.warn("You cannot kick yourself!");
      this.closeMenu();
      return;
    }

    if (this.user.role.toString() === 'ADMIN') {
      console.warn("You cannot kick an admin!");
      this.closeMenu();
      return;
    }

    this.isKicking.set(true);

    this.groupsService.kickMember(this.user.userId).subscribe({
      next: () => {
        console.log(`${this.user.name} has been kicked from the group`);
        this.closeMenu();
        this.isKicking.set(false);
      },
      error: (error) => {
        console.error('Error kicking member:', error);
        this.isKicking.set(false);
      }
    });
  }

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }

  get dots() {
    return this.iconService.iconsMap['ellipsis-vertical'];
  }
}