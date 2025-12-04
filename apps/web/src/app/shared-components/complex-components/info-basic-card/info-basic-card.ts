import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BasicCard } from "../../basic-card/basic-card";

@Component({
  selector: 'app-info-basic-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BasicCard],
  templateUrl: './info-basic-card.html',
})
export class InfoBasicCard {
  @Input() problem!: string;
  @Input() number!: string;
  @Input() difficulty!: string;

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
}
