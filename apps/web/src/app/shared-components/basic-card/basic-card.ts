import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule, FileIcon, AArrowDown, LucideIconData, LinkIcon, ChevronDown, SquareArrowOutUpRight } from 'lucide-angular';

@Component({
  selector: 'app-basic-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './basic-card.html',
  styleUrls: ['./basic-card.css']
})
export class BasicCard {
  private iconsMap: Record<string, LucideIconData> = {
    'link': LinkIcon,
    'chevronDown': ChevronDown,
    'squareArrowOutUpRight': SquareArrowOutUpRight
  };

  @Input() number!: string;
  @Input() title!: string;
  @Input() color!: string;

  @Input() iconName!: string;
  @Input() size: string = '22';
  @Input() iconWidth: string = '2';

  get icon() {
    return this.iconsMap[this.iconName];
  }
}
