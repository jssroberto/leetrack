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
}
