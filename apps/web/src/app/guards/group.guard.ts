import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GroupsService } from '../services/group.service';

export const requireGroupGuard: CanActivateFn = () => {
  const groupsService = inject(GroupsService);
  const router = inject(Router);

  const groupId = groupsService.getStoredGroupId();

  if (groupId) {
    return true;
  }

  return router.createUrlTree(['/main/index']);
};

export const alreadyHasGroupGuard: CanActivateFn = () => {
  const groupsService = inject(GroupsService);
  const router = inject(Router);

  const groupId = groupsService.getStoredGroupId();

  if (groupId) {
    return router.createUrlTree(['/main/group-content']);
  }

  return true;
};