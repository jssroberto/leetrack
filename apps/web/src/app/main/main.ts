import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  currentRoute = signal('');
  showMenuOptions = computed(() => this.currentRoute() === '/main/dashboard' || this.currentRoute() === '/main/polling');

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.currentRoute.set(this.router.url);
    });
  }

  navigateTo(destination: string): void {
    const route = destination.toLowerCase();
    this.router.navigate([`/main/${route}`]);
  }

  get currentRouteValue(): string {
    return this.currentRoute();
  }
}
