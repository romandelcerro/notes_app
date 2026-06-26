import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CryptoService } from './crypto.service';
import { NotesService } from './notes.service';
import { SectionsService } from './sections.service';

@Service()
export class BackupService {
  private readonly _http = inject(HttpClient);
  private readonly _cryptoService = inject(CryptoService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);

  async exportBackup() {
    const blob = await firstValueFrom(
      this._http.get(`${environment.apiUrl}/backup/export`, { responseType: 'blob' }),
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importBackup(file: File) {
    const text = await file.text();
    const data = JSON.parse(text);
    await firstValueFrom(this._http.post(`${environment.apiUrl}/backup/import`, data));
    await Promise.all([this._notesService.loadNotes(), this._sectionsService.loadSections()]);
  }
}
