import { Component, inject, OnInit, signal } from '@angular/core';
import { IconService } from '@web/src/app/services/icon.service';
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";
import { LucideAngularModule } from "lucide-angular";
import { VotingBasicCard } from "@web/src/app/shared-components/complex-components/voting-basic-card/voting-basic-card";
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Problem, ProblemsService } from '@web/src/app/services/problem.service';
import { AuthService } from '@web/src/app/services/auth.service';

@Component({
  selector: 'app-polling',
  imports: [MainTitle, SubTitle, LucideAngularModule, VotingBasicCard, CommonModule],
  templateUrl: './polling.html',
  styleUrl: './polling.css'
})
export class Polling implements OnInit {
  private iconService = inject(IconService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private problemsService = inject(ProblemsService);
  private authService = inject(AuthService);

  currentRoute = signal('');
  currentFilter = signal<string>('all');

  user = this.authService.currentUser;
  problems = this.problemsService.problems$;

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.currentFilter.set(params['filter'] || 'all');
    });
  }

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

  get currentFilterValue(): string {
    return this.currentFilter();
  }

  get subtitleText(): string {
    return this.currentFilterValue === 'all' ? 'Proposed Problems' : 'My Proposals';
  }
}