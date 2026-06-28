import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Session } from '../models/session.model';

@Service()
export class SessionsService {
  private readonly _http = inject(HttpClient);

  public async getSessions() {
    return firstValueFrom(this._http.get<Session[]>(`${environment.apiUrl}/sessions`));
  }

  public async revokeSession(id: string) {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/sessions/${id}`));
  }
}
