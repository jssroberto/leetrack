import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BasicCard } from "../../basic-card/basic-card";
import { IconService } from '@web/src/app/services/icon.service';

@Component({
  selector: 'app-voting-basic-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BasicCard],
  templateUrl: './voting-basic-card.html',
})
export class VotingBasicCard {
  private iconService = inject(IconService);

  @Input() rank!: string;
  @Input() user!: string;
  @Input() problem!: string;
  @Input() number!: string;
  @Input() difficulty!: string;
  @Input() votes!: string;

  @Input() size: string = '22';
  @Input() iconWidth: string = '2';

  @Input() isProposing: boolean = false;

  get difficultyColor() {
    switch (this.difficulty) {
      case 'Easy':
        return 'var(--green)';
      case 'Medium':
        return 'var(--yellow)';
      case 'Hard':
        return 'var(--red)';
      default:
        return 'var(--light)';
    }
  }

  // provisional o no
  get iconX() {
    return this.iconService.iconsMap['x'];
  }
}
