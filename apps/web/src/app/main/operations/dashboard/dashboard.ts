import { Component, inject } from '@angular/core';
import { IconRegistryService } from '@web/src/services/icon-registry.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { InfoBasicCard } from "@web/src/app/shared-components/complex-components/info-basic-card/info-basic-card";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";

@Component({
  selector: 'app-dashboard',
  imports: [MainTitle, InfoBasicCard, SubTitle],
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
