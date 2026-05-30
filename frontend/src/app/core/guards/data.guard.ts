import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { NotesService } from '../services/notes.service';
import { SectionsService } from '../services/sections.service';

function createDataGuard(requireData: boolean, redirectTo: string): CanActivateFn {
  return () => {
    const notes = inject(NotesService);
    const sections = inject(SectionsService);
    const router = inject(Router);

    const hasData = !!notes.notes().length || !!sections.sections().length;
    return requireData === hasData ? true : router.createUrlTree([redirectTo]);
  };
}

export const hasDataGuard: CanActivateFn = createDataGuard(true, '/');
export const noDataGuard: CanActivateFn = createDataGuard(false, '/list');
