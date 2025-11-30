import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, Event } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main',
  standalone: true, // Asumo que es standalone por tu código anterior
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  private router = inject(Router);
  private authService = inject(AuthService);

  // CORRECCIÓN 1: Usamos toSignal para reactividad inmediata.
  // Escucha el Observable del servicio y actualiza la vista automáticamente.
  user = toSignal(this.authService.currentUser$);

  // Inicializamos con la URL actual para evitar estado vacío al recargar
  currentRoute = signal(this.router.url);

  showMenuOptions = computed(() => {
    const route = this.currentRoute();

    // Tu lógica original de ocultar menú en subrutas de 'group' con parámetros
    if (route.startsWith('/main/group') && route.includes('?')) {
      return false;
    }

    return route.startsWith('/main/dashboard') ||
      route.startsWith('/main/polling') ||
      route.startsWith('/main/log') ||
      route.startsWith('/main/group');
  });

  constructor() {
    // CORRECCIÓN 2: Filtrar eventos
    // Solo actualizamos la señal cuando la navegación ha terminado exitosamente.
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Usamos urlAfterRedirects para mayor precisión si hubo redirecciones
        this.currentRoute.set(event.urlAfterRedirects);
      });
  }

  navigateTo(destination: string, queryParams?: Record<string, any>): void {
    const route = destination.toLowerCase();
    this.router.navigate([`/main/${route}`], {
      queryParams: queryParams
    });
  }

  // Getter auxiliar para el template (opcional, pero ayuda si usas currentRouteValue en el HTML)
  get currentRouteValue(): string {
    return this.currentRoute();
  }

  logout() {
    this.authService.logout();
    // La redirección a /login ya la hace el servicio, pero no hace daño dejarla aquí
    // o confiar en el servicio.
  }
}