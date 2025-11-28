import { Component, inject, signal } from '@angular/core';
import { IconService } from '@web/src/app/services/icon.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { LucideAngularModule } from "lucide-angular";
import { VotingBasicCard } from "@web/src/app/shared-components/complex-components/voting-basic-card/voting-basic-card";
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProblemsService } from '@web/src/app/services/problem.service'; // <--- Importar servicio
import { toSignal } from '@angular/core/rxjs-interop'; // <--- Importar toSignal

@Component({
  selector: 'app-polling',
  imports: [MainTitle, SubTitle, LucideAngularModule, VotingBasicCard, CommonModule],
  templateUrl: './polling.html',
  styleUrl: './polling.css'
})
export class Polling {
  private iconService = inject(IconService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private problemsService = inject(ProblemsService); // <--- Inyectar

  currentRoute = signal('');
  currentFilter = signal<string>('all');

  // Convertimos el observable del servicio en una Signal para usarla fácil en el HTML
  // initialValue: [] evita errores mientras cargan los datos
  problems = toSignal(this.problemsService.problems$, { initialValue: [] });

  constructor() {
    // Cargar los problemas al iniciar el componente
    this.problemsService.loadProblems();

    this.route.queryParams.subscribe(params => {
      this.currentFilter.set(params['filter'] || 'all');
    });
  }

  navigateTo(destination: string, queryParams?: Record<string, any>): void {
    const route = destination.toLowerCase();
    this.router.navigate([`/main/${route}`], {
      queryParams: queryParams
    });
  }

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }

  get currentFilterValue(): string {
    return this.currentFilter();
  }

  get subtitleText(): string {
    return this.currentFilterValue === 'all' ? 'Problems' : 'My Proposals';
  }
}