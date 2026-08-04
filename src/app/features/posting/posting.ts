import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MultiPostService } from '../../core/services/multipost.service';
import { ProjectService } from '../../core/services/project.service';
import { PushService } from '../../core/services/push.service';
import { TokenStorageService } from '../../core/services/token-storage.service';
import { NotifyService } from '../../core/services/notify.service';
import { describeHttpError } from '../../core/http-error.util';
import { ResultPanel } from '../../shared/result-panel';
import { Project, PushNotificationItem, UserAssetDto, projectAssets } from '../../core/models/api.models';

interface TargetMeta {
  title: string;
  description: string;
  timeCode: number | null;
  previewImage: File | null;
}

function emptyMeta(): TargetMeta {
  return { title: '', description: '', timeCode: null, previewImage: null };
}

@Component({
  selector: 'app-posting',
  standalone: true,
  imports: [CommonModule, FormsModule, ResultPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Постинг</h1>
    <p class="mb-4 text-xs text-slate-500">POST /api/MultiPost — публикация видео сразу в несколько аккаунтов</p>

    @if (loadingAccounts()) {
      <p class="text-sm text-slate-500">Загрузка аккаунтов…</p>
    } @else if (accountsError()) {
      <div class="rounded-md border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/50 px-3 py-2 text-sm text-red-700 dark:text-red-300">
        {{ accountsError() }}
      </div>
    } @else {
      <section class="mb-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">
          Видео (обязательно)
          <input
            type="file"
            accept="video/*"
            (change)="onVideoSelected($event)"
            class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none file:mr-3 file:rounded file:border-0 file:bg-slate-200 dark:file:bg-slate-800 file:px-2 file:py-1 file:text-slate-700 dark:file:text-slate-200"
          />
        </label>
        <label class="mb-3 block text-sm text-slate-600 dark:text-slate-300">
          Длительность видео (сек) — обязательно, соцсети проверяют лимиты по этому значению
          <input
            type="number"
            [(ngModel)]="videoLength"
            class="mt-1 w-full max-w-40 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
          />
          @if (detectingDuration()) {
            <span class="ml-2 text-xs text-slate-500">определяю по файлу…</span>
          }
        </label>

        <p class="mb-2 text-sm font-medium text-slate-900 dark:text-white">Куда опубликовать</p>
        @if (accounts().length === 0) {
          <p class="text-xs text-slate-500">
            Нет подключённых аккаунтов — подключите их на вкладке «Аккаунты».
          </p>
        }
        <div class="flex flex-col gap-2">
          @for (asset of accounts(); track asset.id) {
            <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  [checked]="isSelected(asset.id)"
                  (change)="toggle(asset.id)"
                  class="h-4 w-4"
                />
                @if (asset.imageUrl) {
                  <img [src]="asset.imageUrl" class="h-8 w-8 rounded-full object-cover" alt="" />
                }
                <span class="text-sm text-slate-900 dark:text-white">{{ asset.name }}</span>
                <span class="text-xs text-slate-500">{{ asset.socialMedia }}</span>
              </label>

              @if (isSelected(asset.id)) {
                <div class="mt-3 grid grid-cols-2 gap-2 pl-7">
                  <label class="text-xs text-slate-400">
                    Заголовок
                    <input
                      type="text"
                      [ngModel]="metaFor(asset.id).title"
                      (ngModelChange)="updateMeta(asset.id, { title: $event })"
                      [ngModelOptions]="{ standalone: true }"
                      class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
                    />
                  </label>
                  <label class="text-xs text-slate-400">
                    Время старта (сек)
                    <input
                      type="number"
                      [ngModel]="metaFor(asset.id).timeCode"
                      (ngModelChange)="updateMeta(asset.id, { timeCode: $event })"
                      [ngModelOptions]="{ standalone: true }"
                      class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
                    />
                  </label>
                  <label class="col-span-2 text-xs text-slate-400">
                    Описание
                    <textarea
                      [ngModel]="metaFor(asset.id).description"
                      (ngModelChange)="updateMeta(asset.id, { description: $event })"
                      [ngModelOptions]="{ standalone: true }"
                      rows="2"
                      class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
                    ></textarea>
                  </label>
                </div>
              }
            </div>
          }
        </div>

        <details class="mt-4">
          <summary class="cursor-pointer text-xs text-slate-500">Доп. параметры</summary>
          <div class="mt-2 grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-400">
              Timezone
              <input
                type="text"
                [(ngModel)]="timezone"
                class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
              />
            </label>
            <label class="text-xs text-slate-400">
              User id
              <input
                type="text"
                [(ngModel)]="userId"
                class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
              />
            </label>
            <label class="text-xs text-slate-400">
              Device token
              <input
                type="text"
                [(ngModel)]="deviceToken"
                class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
              />
            </label>
          </div>
        </details>

        <button
          type="button"
          (click)="submit()"
          [disabled]="!videoFile() || !videoLength || selectedIds().size === 0 || loading()"
          class="mt-4 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Опубликовать
        </button>
      </section>

      <app-result-panel [loading]="loading()" [error]="error()" [data]="result()" />
    }

    <section class="mt-8">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-slate-900 dark:text-white">История публикаций</p>
        <button
          type="button"
          (click)="loadHistory()"
          class="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:border-sky-600"
        >
          Обновить
        </button>
      </div>
      @if (history().length) {
        <ul class="flex flex-col gap-2">
          @for (item of history(); track item.id) {
            <li class="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
              <div class="min-w-0">
                <p class="truncate text-sm text-slate-700 dark:text-slate-200">{{ item.description }}</p>
                <p class="text-xs text-slate-500">{{ item.socialMedia }}</p>
              </div>
              <span
                class="shrink-0 rounded px-2 py-0.5 text-xs"
                [class.bg-emerald-100]="item.notificationStatus === 'Success'"
                [class.dark:bg-emerald-950]="item.notificationStatus === 'Success'"
                [class.text-emerald-700]="item.notificationStatus === 'Success'"
                [class.dark:text-emerald-300]="item.notificationStatus === 'Success'"
                [class.bg-red-100]="item.notificationStatus !== 'Success'"
                [class.dark:bg-red-950]="item.notificationStatus !== 'Success'"
                [class.text-red-700]="item.notificationStatus !== 'Success'"
                [class.dark:text-red-300]="item.notificationStatus !== 'Success'"
              >
                {{ item.notificationStatus }}
              </span>
            </li>
          }
        </ul>
      } @else {
        <p class="text-xs text-slate-600">Нет данных — нажмите «Обновить».</p>
      }
    </section>
  `,
})
export class Posting {
  private readonly multiPost = inject(MultiPostService);
  private readonly projects = inject(ProjectService);
  private readonly push = inject(PushService);
  private readonly tokens = inject(TokenStorageService);
  private readonly notify = inject(NotifyService);

  protected readonly loadingAccounts = signal(false);
  protected readonly accountsError = signal<string | null>(null);
  protected readonly project = signal<Project | null>(null);
  protected readonly accounts = computed<UserAssetDto[]>(() => projectAssets(this.project()));

  protected readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly meta = signal<Record<string, TargetMeta>>({});

  protected readonly videoFile = signal<File | null>(null);
  protected readonly detectingDuration = signal(false);
  protected videoLength: number | null = null;
  protected timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  protected userId = this.tokens.userId() ?? '';
  protected deviceToken = '';

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<unknown>(undefined);

  protected readonly history = signal<PushNotificationItem[]>([]);

  constructor() {
    this.loadAccounts();
    this.loadHistory();
  }

  loadAccounts(): void {
    this.loadingAccounts.set(true);
    this.accountsError.set(null);
    this.projects.getMine().subscribe({
      next: (res) => {
        this.loadingAccounts.set(false);
        this.project.set(res);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingAccounts.set(false);
        this.accountsError.set(describeHttpError(err));
      },
    });
  }

  loadHistory(): void {
    this.push.list().subscribe({
      next: (res) => {
        this.history.set(res.slice(0, 15));
        const failed = res.filter((item) => item.notificationStatus !== 'Success');
        if (failed.length) {
          console.error('MultiPosting: неудачные публикации в истории', failed);
        }
      },
      error: (err: HttpErrorResponse) => this.notify.error(describeHttpError(err)),
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  metaFor(id: string): TargetMeta {
    return this.meta()[id] ?? emptyMeta();
  }

  updateMeta(id: string, patch: Partial<TargetMeta>): void {
    this.meta.update((m) => ({ ...m, [id]: { ...this.metaFor(id), ...patch } }));
  }

  toggle(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        this.meta.update((m) => (m[id] ? m : { ...m, [id]: emptyMeta() }));
      }
      return next;
    });
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.videoFile.set(file);
    this.videoLength = null;
    if (!file) {
      return;
    }

    this.detectingDuration.set(true);
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;

    const finish = (durationSeconds: number | null) => {
      clearTimeout(giveUpTimer);
      if (durationSeconds != null) {
        this.videoLength = Math.round(durationSeconds) || null;
      }
      this.detectingDuration.set(false);
      URL.revokeObjectURL(url);
    };

    // Fall back to manual entry if the browser never reports metadata (some
    // codecs/environments never fire loadedmetadata or error).
    const giveUpTimer = setTimeout(() => finish(null), 8000);

    probe.onloadedmetadata = () => finish(probe.duration);
    probe.onerror = () => finish(null);
    probe.src = url;
  }

  submit(): void {
    const video = this.videoFile();
    if (!video || !this.videoLength || this.selectedIds().size === 0) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const form = new FormData();
    form.append('Video', video, video.name);
    if (this.videoLength != null) {
      form.append('VideoLength', String(this.videoLength));
    }
    if (this.deviceToken) {
      form.append('DeviceToken', this.deviceToken);
    }
    if (this.userId) {
      form.append('UserId', this.userId);
    }

    const selectedAssets = this.accounts().filter((a) => this.isSelected(a.id));
    selectedAssets.forEach((asset, index) => {
      const targetMeta = this.metaFor(asset.id);
      form.append(`UserAssetInfo[${index}].Id`, asset.id);
      form.append(`UserAssetInfo[${index}].SocialMedia`, asset.socialMedia);
      if (targetMeta.title) {
        form.append(`UserAssetInfo[${index}].Title`, targetMeta.title);
      }
      if (targetMeta.description) {
        form.append(`UserAssetInfo[${index}].Description`, targetMeta.description);
      }
      if (targetMeta.timeCode != null) {
        form.append(`UserAssetInfo[${index}].TimeCode`, String(targetMeta.timeCode));
      }
      if (targetMeta.previewImage) {
        form.append(`UserAssetInfo[${index}].PreviewImage`, targetMeta.previewImage, targetMeta.previewImage.name);
      }
    });

    this.multiPost.publish(form, this.timezone).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.result.set(res);
        // The API only accepts the job here — actual publishing to each social
        // network happens asynchronously. A 2xx here is not proof of success.
        this.notify.info(
          'Запрос принят API. Реальный результат публикации появится в «Истории публикаций» ниже (может занять время).',
        );
        this.loadHistory();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(describeHttpError(err));
        console.error('MultiPosting: ошибка публикации (POST /api/MultiPost)', err);
      },
    });
  }
}
