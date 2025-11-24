import { Component, Input } from '@angular/core';
import { BasicCard } from "../basic-card/basic-card";

@Component({
  selector: 'app-main-title',
  imports: [BasicCard],
  templateUrl: './main-title.html',
  styleUrl: './main-title.css'
})
export class MainTitle {
  @Input() title!: string;
  @Input() subTitle!: string;
}
