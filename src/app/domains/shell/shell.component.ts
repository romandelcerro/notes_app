import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import type { NoteFilter } from '../../core/models/note-filter.model';
import type { Section } from '../../core/models/section.model';
import { AuthService } from '../../core/services/auth.service';
import { NoteFilterService } from '../../core/services/note-filter.service';
import { NotesService } from '../../core/services/notes.service';
import { SectionsService } from '../../core/services/sections.service';
import { TranslationService } from '../../core/services/translation.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';
import { ToolbarComponent } from '../../shared/toolbar/toolbar.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { SectionDialogComponent } from '../notes/section-dialog/section-dialog.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidenavComponent, ToolbarComponent, MatSidenavModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly _router = inject(Router);
  private readonly _authService = inject(AuthService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _translateService = inject(TranslationService);
  private readonly _noteFilterService = inject(NoteFilterService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dialog = inject(MatDialog);

  protected readonly sidenavOpen = signal(false);
  protected readonly sections = this._sectionsService.sections;

  private readonly _currentUrl = toSignal(
    this._router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this._router.url),
      startWith(this._router.url),
    ),
  );

  protected readonly selectedSectionId = computed(() => {
    const url = this._currentUrl() ?? '';
    const match = url.match(/^\/list\/(.+)$/);
    if (!match) return null;
    const sectionName = decodeURIComponent(match[1]);
    return this.sections().find((s) => s.name === sectionName)?.id ?? null;
  });

  protected toggleSidenav() {
    this.sidenavOpen.update((open) => !open);
  }

  protected selectSection(id: number | null) {
    if (id === null) {
      this._router.navigate(['/list']);
    } else {
      const section = this.sections().find((s) => s.id === id);
      if (section) {
        this._router.navigate(['/list', section.name]);
      }
    }
  }

  protected onFilterChange(filter: NoteFilter) {
    this._noteFilterService.set(filter);
  }

  protected openNewSection() {
    this._dialog
      .open(SectionDialogComponent, { width: '400px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((created) => {
        if (!created) return;
        const sections = this._sectionsService.sections();
        const newSection = sections[sections.length - 1];
        if (newSection?.id != null) {
          this._router.navigate(['/list', newSection.name]);
        }
      });
  }

  protected async deleteSection(section: Section) {
    const confirmed = await firstValueFrom(
      this._dialog
        .open(ConfirmDialogComponent, {
          data: { message: this._translateService.t('confirm.deleteSection', { name: section.name }) },
          width: '360px',
          maxWidth: '95vw',
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this._destroyRef)),
    );
    if (!confirmed) return;
    await this._sectionsService.deleteSection(section.id!);
    this._notesService.removeNotesForSection(section.id!);
    const hasData =
      this._notesService.notes().length > 0 || this._sectionsService.sections().length > 0;
    this._router.navigate([hasData ? '/list' : '/']);
  }

  protected editSection(section: Section) {
    this._dialog.open(SectionDialogComponent, {
      data: { section },
      width: '400px',
      maxWidth: '95vw',
    });
  }

  protected openProfile() {
    this._dialog.open(UserMenuComponent, { width: '420px', maxWidth: '95vw' });
  }

  protected async signOut() {
    await this._authService.signOut();
  }
}

