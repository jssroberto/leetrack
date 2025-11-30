import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GroupsService } from '../services/group.service'; // Asegura la ruta correcta

// 1. GUARDIA: "Requiere tener grupo seleccionado"
// Úsalo en 'group-content'. Si no hay grupo, te patea al index.
export const requireGroupGuard: CanActivateFn = () => {
  const groupsService = inject(GroupsService);
  const router = inject(Router);

  if (groupsService.getCurrentGroupId()) {
    return true;
  }

  // Si no hay grupo, mandar a la página de selección/inicio
  return router.createUrlTree(['/main/index']);
};

// 2. GUARDIA: "Ya tiene grupo seleccionado"
// Úsalo en 'index'. Si ya tiene grupo, lo manda directo al contenido (ahorra clicks).
export const alreadyHasGroupGuard: CanActivateFn = () => {
  const groupsService = inject(GroupsService);
  const router = inject(Router);

  if (groupsService.getCurrentGroupId()) {
    // Si ya tiene grupo, ¿para qué ver el index? Mándalo al contenido
    return router.createUrlTree(['/main/group-content']);
  }

  return true;
};