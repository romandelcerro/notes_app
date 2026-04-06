import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p style="overflow-wrap: break-word; word-break: break-word; margin: 0;">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelLabel }}</button>
      <button
        mat-flat-button
        [style.--mat-button-filled-container-color]="data.confirmVariant === 'warn' ? 'var(--mat-sys-error)' : 'var(--mat-sys-primary)'"
        [style.--mat-button-filled-label-text-color]="data.confirmVariant === 'warn' ? 'var(--mat-sys-on-error)' : 'var(--mat-sys-on-primary)'"
        (click)="confirm()">
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(90vw, 22rem);
      }
      .confirm-btn-warn {
        --mdc-filled-button-container-color: var(--mat-sys-error);
        --mdc-filled-button-label-text-color: var(--mat-sys-on-error);
      }
      .confirm-btn-primary {
        --mdc-filled-button-container-color: var(--mat-sys-primary);
        --mdc-filled-button-label-text-color: var(--mat-sys-on-primary);
      }
    `
  ]
})
export class ConfirmDialogComponent {
  protected readonly data = inject<{ title: string; message: string; cancelLabel: string; confirmLabel: string; confirmVariant: 'warn' | 'primary' }>(MAT_DIALOG_DATA);
  private readonly _dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  protected confirm() {
    this._dialogRef.close(true);
  }
}
