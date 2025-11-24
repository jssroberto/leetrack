import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BasicCard } from "../../basic-card/basic-card";

@Component({
  selector: 'app-info-basic-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BasicCard],
  templateUrl: './info-basic-card.html',
  styleUrls: ['./info-basic-card.css']
})
export class InfoBasicCard {
  @Input() problem!: string;
  @Input() number!: string;
  @Input() completedIn!: string;
  @Input() xp!: string;
  @Input() difficulty!: string;

  get difficultyColor(){
    switch (this.difficulty) {
      case 'Easy':
        return 'var(--green)';
        break;
      case 'Medium':
        return 'var(--yellow)';
        break;
      case 'Hard':
        return 'var(--red)';
        break;
      default:
        return 'var(--light)';
        break;
    }
  }
}
