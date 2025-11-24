import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BasicCard } from "../../basic-card/basic-card";

@Component({
  selector: 'app-log-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BasicCard],
  templateUrl: './log-card.html',
  styleUrls: ['./log-card.css']
})
export class LogCard {
  @Input() time!: string;
  @Input() date!: string;
  @Input() user!: string;
  @Input() action!: string;

  @Input() number!: string;
  @Input() problem!: string;
}
