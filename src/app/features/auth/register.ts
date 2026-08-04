import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TokenStorageService } from '../../core/services/token-storage.service';
import { NotifyService } from '../../core/services/notify.service';
import { describeHttpError, extractToken } from '../../core/http-error.util';
import { ResultPanel } from '../../shared/result-panel';
import { SOCIAL_MEDIA_OPTIONS, SocialMedia } from '../../core/models/api.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ResultPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 px-4">
      <div class="w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <p class="text-lg font-semibold text-slate-900 dark:text-white">Регистрация</p>
        <p class="mb-4 text-xs text-slate-500">
          POST /api/Auth/sign-up — режим email/пароль. Поля "code"/"state" нужны для OAuth-потока
          соцсетей и здесь оставлены пустыми/None.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-3">
          <label class="text-sm text-slate-600 dark:text-slate-300">
            Email
            <input
              type="email"
              formControlName="email"
              class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
            />
          </label>
          <label class="text-sm text-slate-600 dark:text-slate-300">
            Пароль
            <input
              type="password"
              formControlName="password"
              class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
            />
          </label>
          <label class="text-sm text-slate-600 dark:text-slate-300">
            Device id (опционально)
            <div class="mt-1 flex gap-2">
              <input
                type="text"
                formControlName="deviceId"
                class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
              />
              <button
                type="button"
                (click)="randomizeDeviceId()"
                class="shrink-0 rounded-md border border-slate-300 dark:border-slate-700 px-2 text-xs text-slate-600 dark:text-slate-300 hover:border-sky-600"
              >
                случайный
              </button>
            </div>
          </label>
          <label class="text-sm text-slate-600 dark:text-slate-300">
            State (соцсеть)
            <select
              formControlName="state"
              class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
            >
              @for (option of socialMediaOptions; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </label>
          <label class="text-sm text-slate-600 dark:text-slate-300">
            Device token
            <div class="mt-1 flex gap-2">
              <input
                type="text"
                formControlName="deviceToken"
                class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
              />
              <button
                type="button"
                (click)="randomizeDeviceToken()"
                class="shrink-0 rounded-md border border-slate-300 dark:border-slate-700 px-2 text-xs text-slate-600 dark:text-slate-300 hover:border-sky-600"
              >
                случайный
              </button>
            </div>
          </label>

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="mt-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-sky-500 disabled:opacity-50"
          >
            Зарегистрироваться
          </button>
        </form>

        <div class="mt-4">
          <app-result-panel [loading]="loading()" [error]="error()" [data]="response()" />
        </div>

        <p class="mt-4 text-xs text-slate-500">
          Уже есть аккаунт?
          <a routerLink="/login" class="text-sky-400 hover:underline">Войти</a>
        </p>
      </div>
    </div>
  `,
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenStorageService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly response = signal<unknown>(undefined);
  protected readonly socialMediaOptions = SOCIAL_MEDIA_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    deviceId: [''],
    state: [SocialMedia.None, Validators.required],
    deviceToken: [crypto.randomUUID(), Validators.required],
  });

  randomizeDeviceId(): void {
    this.form.controls.deviceId.setValue(crypto.randomUUID());
  }

  randomizeDeviceToken(): void {
    this.form.controls.deviceToken.setValue(crypto.randomUUID());
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();

    this.auth
      .signUp({
        email: raw.email,
        password: raw.password,
        deviceId: raw.deviceId || null,
        state: raw.state,
        code: null,
        deviceToken: raw.deviceToken,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.response.set(res.body);
          const token = extractToken(res.body);
          if (token) {
            this.tokens.setToken(token);
            this.notify.success('Аккаунт создан, вход выполнен');
            this.router.navigate(['/accounts']);
          } else {
            this.notify.error('Не удалось распознать токен в ответе сервера.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(describeHttpError(err));
        },
      });
  }
}
