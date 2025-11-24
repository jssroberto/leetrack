import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BasicCard } from "../../basic-card/basic-card";

@Component({
  selector: 'app-voting-basic-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BasicCard],
  templateUrl: './voting-basic-card.html',
  styleUrls: ['./voting-basic-card.css']
})
export class VotingBasicCard {
  @Input() rank!: string;
  @Input() user!: string;
  @Input() problem!: string;
  @Input() number!: string;
  @Input() difficulty!: string;
  @Input() votes!: string;

  @Input() size: string = '22';
  @Input() iconWidth: string = '2';

  @Input() isProposing: boolean = false;

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
