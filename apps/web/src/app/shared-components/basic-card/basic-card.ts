import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-basic-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './basic-card.html',
})
export class BasicCard {
  private iconService = inject(IconService);

  @Input() number!: string;
  @Input() title!: string;
  @Input() color!: string;

  @Input() iconName!: string;
  @Input() size: string = '22';
  @Input() iconWidth: string = '2';

  // change later
  @Input() image: boolean = false;

  get icon() {
    return this.iconService.iconsMap[this.iconName];
  }

  get user() {
    return this.iconService.iconsMap['user']
  }
}
