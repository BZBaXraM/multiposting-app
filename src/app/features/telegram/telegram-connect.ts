import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TelegramService } from '../../core/services/telegram.service';
import { NotifyService } from '../../core/services/notify.service';
import { describeHttpError } from '../../core/http-error.util';
import { ResultPanel } from '../../shared/result-panel';

@Component({
  selector: 'app-telegram-connect',
  standalone: true,
  imports: [ReactiveFormsModule, ResultPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="mb-1 text-sm font-medium text-slate-900 dark:text-white">Подключить Telegram-канал</p>
    <p class="mb-3 text-xs text-slate-500">POST /api/Telegram/connect-telegram</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-3">
      <label class="text-sm text-slate-600 dark:text-slate-300">
        Bot token
        <input
          type="text"
          formControlName="botToken"
          class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
        />
      </label>
      <label class="text-sm text-slate-600 dark:text-slate-300">
        Channel link
        <input
          type="text"
          formControlName="channelLink"
          placeholder="@my_channel or https://t.me/my_channel"
          class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
        />
      </label>
      <button
        type="submit"
        [disabled]="form.invalid || loading()"
        class="mt-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-sky-500 disabled:opacity-50"
      >
        Подключить
      </button>
    </form>
    <div class="mt-4">
      <app-result-panel [loading]="loading()" [error]="error()" [data]="result()" />
    </div>
  `,
})
export class TelegramConnect {
  private readonly fb = inject(FormBuilder);
  private readonly telegram = inject(TelegramService);
  private readonly notify = inject(NotifyService);

  @Output() connected = new EventEmitter<void>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<unknown>(undefined);

  protected readonly form = this.fb.nonNullable.group({
    botToken: ['', Validators.required],
    channelLink: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.telegram.connect(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.result.set(res);
        this.notify.success('Telegram-канал подключён');
        this.form.reset();
        this.connected.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(describeHttpError(err));
      },
    });
  }
}
