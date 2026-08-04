import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TelegramBotConnectRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private readonly http = inject(HttpClient);

  connect(req: TelegramBotConnectRequest) {
    return this.http.post<unknown>('https://multiposting-fm82.onrender.com/api/Telegram/connect-telegram', req);
  }
}
