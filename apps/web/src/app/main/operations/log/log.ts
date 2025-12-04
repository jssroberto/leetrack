import { Component, computed, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop'; // <--- Importante
import { DatePipe } from '@angular/common';
import { IconService } from '@web/src/app/services/icon.service';
import { GroupsService } from '@web/src/app/services/group.service'; // Tu servicio real
import { SubmissionsService, Submission } from '@web/src/app/services/submission.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { LucideAngularModule } from "lucide-angular";
import { LogCard } from "@web/src/app/shared-components/complex-components/log-card/log-card";
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [MainTitle, SubTitle, LucideAngularModule, LogCard, DatePipe],
  templateUrl: './log.html',
})
export class Log {
  private iconService = inject(IconService);
  public groupsService = inject(GroupsService); // Public para el template si fuera necesario
  private submissionsService = inject(SubmissionsService);

  // 1. Signal para el término de búsqueda (local)
  searchTerm = signal<string>(''); 

  // 2. Recurso reactivo CORREGIDO
  // Convertimos la Signal del servicio (currentGroupId$) a Observable para usar switchMap
  rawSubmissions = toSignal(
    toObservable(this.groupsService.currentGroupId$).pipe(
      switchMap((groupId) => {
        // Validamos que exista el ID (puede ser null)
        if (!groupId) return of([]); 
        
        // Hacemos la petición a la API
        return this.submissionsService.getGroupSubmissions(groupId);
      })
    ), 
    { initialValue: [] as Submission[] }
  );

  // 3. Lista filtrada (igual que antes)
  filteredSubmissions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const list = this.rawSubmissions();

    if (!term) return list;

    return list.filter(sub => 
      (sub.user?.leetcodeUsername?.toLowerCase().includes(term)) ||
      (sub.user?.email.toLowerCase().includes(term)) ||
      (sub.problem?.title.toLowerCase().includes(term))
    );
  });

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }

  getDisplayName(sub: Submission): string {
    return sub.user?.leetcodeUsername || sub.user?.email.split('@')[0] || 'Unknown';
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}