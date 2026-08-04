import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { decodeJwtPayload } from '../jwt.util';

const STORAGE_KEY = 'mp_access_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly tokenSignal = signal<string | null>(this.readFromStorage());

  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  /** Decoded from the JWT's "sub" claim — the MultiPost endpoint wants this as UserId. */
  readonly userId = computed(() => {
    const token = this.tokenSignal();
    if (!token) {
      return null;
    }
    const claim = decodeJwtPayload(token)?.['sub'];
    return typeof claim === 'string' ? claim : null;
  });

  readonly email = computed(() => {
    const token = this.tokenSignal();
    if (!token) {
      return null;
    }
    const claim = decodeJwtPayload(token)?.[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
    ];
    return typeof claim === 'string' ? claim : null;
  });

  setToken(token: string): void {
    this.tokenSignal.set(token);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, token);
    }
  }

  clear(): void {
    this.tokenSignal.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private readFromStorage(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(STORAGE_KEY);
  }
}
