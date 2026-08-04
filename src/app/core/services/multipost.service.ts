import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SocialMedia } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MultiPostService {
  private readonly http = inject(HttpClient);

  test() {
    return this.http.get<unknown>('https://multiposting-fm82.onrender.com/api/MultiPost/test');
  }

  getByIdAndSocial(id?: string | null, socialMedia?: SocialMedia | null) {
    let params = new HttpParams();
    if (id) {
      params = params.set('Id', id);
    }
    if (socialMedia) {
      params = params.set('SocialMedia', socialMedia);
    }
    return this.http.get<unknown>('https://multiposting-fm82.onrender.com/api/MultiPost', { params });
  }

  publish(form: FormData, timezone?: string) {
    let headers = new HttpHeaders();
    if (timezone) {
      headers = headers.set('Timezone', timezone);
    }
    return this.http.post<unknown>('https://multiposting-fm82.onrender.com/api/MultiPost', form, { headers });
  }
}
