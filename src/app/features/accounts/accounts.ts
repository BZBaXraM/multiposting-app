import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { NotifyService } from '../../core/services/notify.service';
import { describeHttpError } from '../../core/http-error.util';
import { Project, UserAssetDto, projectAssets } from '../../core/models/api.models';
import { TelegramConnect } from '../telegram/telegram-connect';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TelegramConnect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Аккаунты</h1>
        <p class="text-xs text-slate-500">Социальные сети, подключённые к вашему проекту</p>
      </div>
      <button
        type="button"
        (click)="load()"
        class="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:border-sky-600"
      >
        Обновить
      </button>
    </div>

    @if (loading()) {
      <div class="flex items-center gap-2 text-sm text-slate-400 py-4">
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-sky-400"
        ></span>
        Загрузка…
      </div>
    } @else if (notFound()) {
      <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <p class="mb-3 text-sm text-slate-600 dark:text-slate-300">
          У вашего аккаунта пока нет проекта. Создать его?
        </p>
        <form [formGroup]="createForm" (ngSubmit)="createProject()" class="flex gap-2">
          <input
            type="text"
            formControlName="name"
            placeholder="Название проекта"
            class="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
          />
          <button
            type="submit"
            [disabled]="createForm.invalid"
            class="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-sky-500 disabled:opacity-50"
          >
            Создать
          </button>
        </form>
      </div>
    } @else if (error()) {
      <div class="rounded-md border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/50 px-3 py-2 text-sm text-red-700 dark:text-red-300">
        {{ error() }}
      </div>
    } @else {
      @if (assets().length) {
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          @for (asset of assets(); track asset.id) {
            <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
              <div class="flex items-center gap-3">
                @if (asset.imageUrl) {
                  <img [src]="asset.imageUrl" class="h-10 w-10 rounded-full object-cover" alt="" />
                } @else {
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs text-slate-400"
                  >
                    {{ asset.socialMedia.slice(0, 2) }}
                  </div>
                }
                <div class="min-w-0">
                  <p class="truncate text-sm text-slate-900 dark:text-white">{{ asset.name || '(без имени)' }}</p>
                  <p class="text-xs text-slate-500">{{ asset.socialMedia }}</p>
                </div>
              </div>
              <button
                type="button"
                (click)="disconnect(asset)"
                class="mt-3 w-full rounded-md border border-red-300 dark:border-red-900 px-2 py-1.5 text-xs text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950"
              >
                Отключить
              </button>
            </div>
          }
        </div>
      } @else {
        <p class="text-sm text-slate-500">Пока нет подключённых аккаунтов.</p>
      }

      <section class="mt-6 max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <app-telegram-connect (connected)="load()" />
      </section>

      <p class="mt-4 text-xs text-slate-600">
        YouTube, Instagram, TikTok, VK и Google подключаются через OAuth-редирект провайдера
        (эндпоинт /api/Auth/sign-up-redirect) — этот тестовый клиент не инициирует сторонние
        OAuth-потоки напрямую.
      </p>
    }
  `,
})
export class Accounts {
  private readonly fb = inject(FormBuilder);
  private readonly projects = inject(ProjectService);
  private readonly notify = inject(NotifyService);

  protected readonly loading = signal(false);
  protected readonly notFound = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly project = signal<Project | null>(null);
  protected readonly assets = computed<UserAssetDto[]>(() => projectAssets(this.project()));

  protected readonly createForm = this.fb.nonNullable.group({
    name: ['Проект 1', Validators.required],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.projects.getMine().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.project.set(res);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set(describeHttpError(err));
        }
      },
    });
  }

  createProject(): void {
    if (this.createForm.invalid) {
      return;
    }
    this.projects.create(this.createForm.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Проект создан');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.notify.error(describeHttpError(err));
      },
    });
  }

  disconnect(asset: UserAssetDto): void {
    const project = this.project();
    if (!project || !confirm(`Отключить «${asset.name}»?`)) {
      return;
    }
    this.projects.remove(project.id, asset.id).subscribe({
      next: () => {
        this.notify.success('Аккаунт отключён');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.notify.error(describeHttpError(err));
      },
    });
  }
}
