import { Component, inject } from '@angular/core';
import { IconService } from '@web/src/app/services/icon.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { LucideAngularModule } from "lucide-angular";
import { LogCard } from "@web/src/app/shared-components/complex-components/log-card/log-card";

@Component({
  selector: 'app-log',
  imports: [MainTitle, SubTitle, LucideAngularModule, LogCard],
  templateUrl: './log.html',
})
export class Log {
  private iconService = inject(IconService);

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }
  
}
