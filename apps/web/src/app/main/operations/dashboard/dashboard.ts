import { Component, inject } from '@angular/core';
import { BasicCard } from "@web/src/app/shared-components/basic-card/basic-card";
import { IconRegistryService } from '@web/src/services/icon-registry.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";

@Component({
  selector: 'app-dashboard',
  imports: [BasicCard, MainTitle],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private iconRegistry = inject(IconRegistryService);

  get linkIcon() {
    return this.iconRegistry.getIcon('link')
  }

  get arrowDownIcon() {
    return this.iconRegistry.getIcon('arrow_down')
  }
}
