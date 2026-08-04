import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mp_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly themeSignal = signal<Theme>(this.readInitial());

  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    effect(() => this.apply(this.themeSignal()));
  }

  toggle(): void {
    this.themeSignal.update((t) => (t === 'dark' ? 'light' : 'dark'));
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, this.themeSignal());
    }
  }

  private readInitial(): Theme {
    if (!this.isBrowser) {
      return 'dark';
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    if (typeof window.matchMedia !== 'function') {
      return 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private apply(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}
