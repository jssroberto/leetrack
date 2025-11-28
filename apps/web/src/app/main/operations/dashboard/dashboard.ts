import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, JsonPipe } from '@angular/common'; // Importaciones necesarias
import { IconRegistryService } from '@web/src/services/icon-registry.service';
import { SubmissionsService } from '@web/src/app/services/submission.service'; // Asegúrate de la ruta correcta

// Componentes visuales
import { MainTitle } from "@web/src/app/shared-components/main-title/main-title";
import { InfoBasicCard } from "@web/src/app/shared-components/complex-components/info-basic-card/info-basic-card";
import { SubTitle } from "@web/src/app/shared-components/sub-title/sub-title";

@Component({
  selector: 'app-dashboard',
  standalone: true, // Asumo que es standalone por los imports
  imports: [
    MainTitle, 
    InfoBasicCard, 
    SubTitle,
    AsyncPipe, // Vital para suscribirse al observable en el HTML
    DatePipe,  // Para formatear 'submittedAt'
    // JsonPipe // Descomenta si quieres hacer debugging rápido en el HTML: {{ submissions$ | async | json }}
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private iconRegistry = inject(IconRegistryService);
  private submissionsService = inject(SubmissionsService);

  public submissions$ = this.submissionsService.mySubmissions$;
  public isLoading$ = this.submissionsService.isLoading$;

  ngOnInit(): void {
    // Disparamos la carga de datos al iniciar el componente
    this.submissionsService.loadMySubmissions();
  }

  // Getters para iconos
  get linkIcon() {
    return this.iconRegistry.getIcon('link');
  }

  get arrowDownIcon() {
    return this.iconRegistry.getIcon('arrow_down');
  }
}