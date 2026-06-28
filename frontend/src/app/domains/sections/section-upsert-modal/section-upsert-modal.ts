import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import type { Section } from '../../../core/models/section.model';
import { SectionsService } from '../../../core/services/sections.service';

@Component({
  selector: 'app-section-upsert-modal',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './section-upsert-modal.html',
  styleUrl: './section-upsert-modal.scss',
})
export class SectionUpsertModal {
  private readonly _sectionsService = inject(SectionsService);

  private readonly _dialogRef = inject(MatDialogRef<SectionUpsertModal>);
  private readonly _data = inject<{ section?: Section } | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  protected readonly editMode = Boolean(this._data?.section);
  protected readonly sectionName = signal(this._data?.section?.name ?? '');
  protected readonly isSaving = signal(false);

  protected async save() {
    const name = this.sectionName().trim();
    if (!name) return;
    this.isSaving.set(true);
    try {
      if (this.editMode && this._data?.section?.id) {
        await this._sectionsService.renameSection(this._data.section.id, name);
        const updatedSection = this._sectionsService
          .sections()
          .find((s) => s.id === this._data?.section?.id);
        this._dialogRef.close(updatedSection ?? null);
      } else {
        const sectionCreated = await this._sectionsService.createSection(name);
        this._dialogRef.close(sectionCreated);
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
