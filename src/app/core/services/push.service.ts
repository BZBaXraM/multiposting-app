import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PushNotificationItem } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);

  /** Publish history/notification log for the current user. */
  list() {
    return this.http.get<PushNotificationItem[]>('https://multiposting-fm82.onrender.com/api/PushNotifications');
  }
}
