import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TokenStorageService } from '../core/services/token-storage.service';
import { NotifyService } from '../core/services/notify.service';
import { ThemeService } from '../core/services/theme.service';
import { ToastHost } from '../shared/toast-host';

interface NavItem {
  path: string;
  label: string;
  hint: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/accounts', label: 'Аккаунты', hint: 'Подключённые соцсети' },
  { path: '/posting', label: 'Постинг', hint: 'Публикация видео' },
  { path: '/pricing', label: 'Тарифы', hint: 'Планы подписки' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <app-toast-host />
      <div class="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside class="w-56 shrink-0">
          <div class="mb-6">
            <p class="text-lg font-semibold text-slate-900 dark:text-white">MultiPosting</p>
            @if (email(); as mail) {
              <p class="truncate text-xs text-slate-500" [title]="mail">{{ mail }}</p>
            }
          </div>
          <button
            type="button"
            (click)="theme.toggle()"
            class="mb-4 flex w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <span>{{ theme.theme() === 'dark' ? 'Тёмная тема' : 'Светлая тема' }}</span>
            <span>{{ theme.theme() === 'dark' ? '🌙' : '☀️' }}</span>
          </button>
          <nav class="flex flex-col gap-1">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800"
                class="rounded-md border border-transparent px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <span class="block">{{ item.label }}</span>
                <span class="block text-[11px] text-slate-500">{{ item.hint }}</span>
              </a>
            }
          </nav>
          <button
            type="button"
            (click)="logout()"
            class="mt-6 w-full rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-400 hover:border-red-400 dark:hover:border-red-800 hover:text-red-700 dark:hover:text-red-300"
          >
            Выйти
          </button>
        </aside>
        <main class="min-w-0 flex-1 pb-16">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell {
  private readonly tokens = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotifyService);
  protected readonly theme = inject(ThemeService);

  protected readonly navItems = NAV_ITEMS;
  protected readonly email = this.tokens.email;

  logout(): void {
    this.tokens.clear();
    this.notify.info('Вы вышли из аккаунта');
    this.router.navigate(['/login']);
  }
}
