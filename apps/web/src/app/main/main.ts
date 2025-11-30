import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  private router = inject(Router);
  private authService = inject(AuthService);

  currentRoute = signal('');

  // falta validar con redirect, muchas rutas
  showMenuOptions = computed(() => {
    const route = this.currentRoute();

    if (route.startsWith('/main/group') && route.includes('?')) {
      return false;
    }

    return route.startsWith('/main/dashboard') ||
      route.startsWith('/main/polling') ||
      route.startsWith('/main/log') ||
      route.startsWith('/main/group');
  });

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

  get user() {
    return this.authService.getCurrentUser();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}