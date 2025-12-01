import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, Event } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private authService = inject(AuthService);

  currentRoute = signal(this.router.url);
  user = this.authService.currentUser;

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
    // Se suscribe al router para actualizar la ruta cuando cambia
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.currentRoute.set(event.urlAfterRedirects);
      });
  }

  navigateTo(destination: string, queryParams?: Record<string, any>): void {
    const route = destination.toLowerCase();
    this.router.navigate([`/main/${route}`], {
      queryParams: queryParams
    });
  }

  logout() {
    this.authService.logout();
  }
}