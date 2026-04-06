import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { NotesService } from '../services/notes.service';
import { SectionsService } from '../services/sections.service';

export const hasDataGuard: CanActivateFn = () => {
  const notes = inject(NotesService);
  const sections = inject(SectionsService);
  const router = inject(Router);

  const hasData = notes.notes().length > 0 || sections.sections().length > 0;
  console.log('hasDataGuard:', { hasData });
  return hasData ? true : router.createUrlTree(['/']);
};
