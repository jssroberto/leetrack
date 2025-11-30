import { Component, Input } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-main-title',
  imports: [RouterLink],
  templateUrl: './main-title.html',
  styleUrl: './main-title.css'
})
export class MainTitle {
  @Input() title!: string;
  @Input() subTitle!: string;
}
