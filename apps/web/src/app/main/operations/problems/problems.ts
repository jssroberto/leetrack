import { Component, inject, OnInit, signal } from '@angular/core';
import { IconService } from '@web/src/app/services/icon.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { LucideAngularModule } from "lucide-angular";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProblemsService } from '@web/src/app/services/problem.service';
import { AuthService } from '@web/src/app/services/auth.service';
import { InfoBasicCard } from '@web/src/app/shared-components/complex-components/info-basic-card/info-basic-card';

@Component({
  selector: 'app-polling',
  imports: [MainTitle, SubTitle, LucideAngularModule, CommonModule, InfoBasicCard],
  templateUrl: './problems.html',
})
export class Problems implements OnInit {
  private iconService = inject(IconService);
  private router = inject(Router);
  private problemsService = inject(ProblemsService);
  private authService = inject(AuthService);

  currentRoute = signal('');

  user = this.authService.currentUser;
  problems = this.problemsService.problems$;

  constructor() { }

  ngOnInit(): void {
    this.problemsService.getProblems().subscribe({
      error: (err) => {
        console.error('Error loading problems in Polling component:', err);
      }
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
}