import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  private router = inject(Router);

  currentRoute = signal('');
  showMenuOptions = computed(() => this.currentRoute().startsWith('/main/dashboard') || this.currentRoute().startsWith('/main/polling') || this.currentRoute().startsWith('/main/log'));

  constructor() {
    this.router.events.subscribe(() => {
      this.currentRoute.set(this.router.url);
    });
  }

  navigateTo(destination: string, queryParams?: Record<string, any>): void {
    const route = destination.toLowerCase();
    this.router.navigate([`/main/${route}`], {
      queryParams: queryParams
    });
  }

  get currentRouteValue(): string {
    return this.currentRoute();
  }
}
