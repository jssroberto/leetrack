import { Component } from '@angular/core';
import { BasicCard } from "@web/src/app/shared-components/basic-card/basic-card";
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";

@Component({
  selector: 'app-polling',
  imports: [BasicCard, MainTitle],
  templateUrl: './polling.html',
  styleUrl: './polling.css'
})
export class Polling {

}
