import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sub-title',
  imports: [],
  templateUrl: './sub-title.html',
  styleUrl: './sub-title.css'
})
export class SubTitle {
  @Input() subTitle!: string;
}
