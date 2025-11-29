import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop'; // <--- IMPORTANTE
import { AuthService } from '../services/auth.service'; // <--- Importa tu servicio

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main {
  private router = inject(Router);
  private authService = inject(AuthService); // <--- Inyectar servicio

  // Convertimos el Observable currentUser$ en una Signal de lectura
  user = toSignal(this.authService.currentUser$); 

  currentRoute = signal('');
  
  // Tu lógica existente...
  showMenuOptions = computed(() => 
    this.currentRoute().startsWith('/main/dashboard') || 
    this.currentRoute().startsWith('/main/polling') || 
    this.currentRoute().startsWith('/main/group') || 
    this.currentRoute().startsWith('/main/log')
  );

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