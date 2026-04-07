import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import type { Section } from '../../../core/models/section.model';
import { SectionsService } from '../../../core/services/sections.service';

@Component({
  selector: 'app-section-create-edit-modal',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './section-create-edit-modal.html',
  styleUrl: './section-create-edit-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionCreateEditModal {
  private readonly _sectionsService = inject(SectionsService);

  private readonly _dialogRef = inject(MatDialogRef<SectionCreateEditModal>);
  private readonly _data = inject<{ section?: Section } | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly editMode = !!this._data?.section;
  protected readonly name = signal(this._data?.section?.name ?? '');
  protected readonly saving = signal(false);

  protected async save() {
    const name = this.name().trim();
    if (!name) return;
    this.saving.set(true);
    try {
      if (this.editMode && this._data?.section?.id != null) {
        await this._sectionsService.renameSection(this._data.section.id, name);
      } else {
        await this._sectionsService.createSection(name);
      }
      this._dialogRef.close(true);
    } finally {
      this.saving.set(false);
    }
  }
}
