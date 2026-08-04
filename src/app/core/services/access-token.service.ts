import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessTokenService {
  private readonly http = inject(HttpClient);

  getById(id: string) {
    return this.http.get<unknown>('https://multiposting-fm82.onrender.com/api/AccessToken', { params: { id } });
  }
}
