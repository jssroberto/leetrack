import { Component, inject } from '@angular/core';
import { IconService } from '@web/src/app/services/icon.service';
import { BasicCard } from "@web/src/app/shared-components/basic-card/basic-card";
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { LucideAngularModule } from "lucide-angular";
import { VotingBasicCard } from "@web/src/app/shared-components/complex-components/voting-basic-card/voting-basic-card";

@Component({
  selector: 'app-polling',
  imports: [MainTitle, SubTitle, LucideAngularModule, VotingBasicCard],
  templateUrl: './polling.html',
  styleUrl: './polling.css'
})
export class Polling {
  private iconService = inject(IconService);

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }
}
