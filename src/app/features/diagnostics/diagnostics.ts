import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MultiPostService } from '../../core/services/multipost.service';
import { AccessTokenService } from '../../core/services/access-token.service';
import { NotifyService } from '../../core/services/notify.service';
import { describeHttpError } from '../../core/http-error.util';
import { ResultPanel } from '../../shared/result-panel';
import { SOCIAL_MEDIA_OPTIONS, SocialMedia } from '../../core/models/api.models';

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [FormsModule, ResultPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Diagnostics</h1>
    <p class="mb-4 text-xs text-slate-500">Read-only lookups, useful for probing the API directly.</p>

    <section class="mb-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-slate-900 dark:text-white">GET /api/MultiPost/test</p>
        <button
          type="button"
          (click)="runTest()"
          class="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:border-sky-600"
        >
          Call
        </button>
      </div>
      <app-result-panel [loading]="testLoading()" [error]="testError()" [data]="testResult()" />
    </section>

    <section class="mb-6 max-w-lg rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p class="mb-2 text-sm font-medium text-slate-900 dark:text-white">GET /api/MultiPost</p>
      <div class="flex items-end gap-2">
        <label class="flex-1 text-sm text-slate-600 dark:text-slate-300">
          Post id (uuid, optional)
          <input
            type="text"
            [(ngModel)]="multiPostId"
            class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
          />
        </label>
        <label class="text-sm text-slate-600 dark:text-slate-300">
          Social media
          <select
            [(ngModel)]="multiPostSocial"
            class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
          >
            <option [ngValue]="null">(any)</option>
            @for (option of socialMediaOptions; track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </label>
        <button
          type="button"
          (click)="lookupMultiPost()"
          class="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:border-sky-600"
        >
          Fetch
        </button>
      </div>
      <div class="mt-3">
        <app-result-panel [loading]="multiPostLoading()" [error]="multiPostError()" [data]="multiPostResult()" />
      </div>
    </section>

    <section class="max-w-lg rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p class="mb-2 text-sm font-medium text-slate-900 dark:text-white">GET /api/AccessToken</p>
      <div class="flex items-end gap-2">
        <label class="flex-1 text-sm text-slate-600 dark:text-slate-300">
          Access token id (uuid)
          <input
            type="text"
            [(ngModel)]="accessTokenId"
            class="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-600"
          />
        </label>
        <button
          type="button"
          (click)="lookupAccessToken()"
          [disabled]="!accessTokenId"
          class="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:border-sky-600 disabled:opacity-50"
        >
          Fetch
        </button>
      </div>
      <div class="mt-3">
        <app-result-panel [loading]="accessTokenLoading()" [error]="accessTokenError()" [data]="accessTokenResult()" />
      </div>
    </section>
  `,
})
export class Diagnostics {
  private readonly multiPost = inject(MultiPostService);
  private readonly accessTokens = inject(AccessTokenService);
  private readonly notify = inject(NotifyService);

  protected readonly socialMediaOptions = SOCIAL_MEDIA_OPTIONS;

  protected readonly testLoading = signal(false);
  protected readonly testError = signal<string | null>(null);
  protected readonly testResult = signal<unknown>(undefined);

  protected multiPostId = '';
  protected multiPostSocial: SocialMedia | null = null;
  protected readonly multiPostLoading = signal(false);
  protected readonly multiPostError = signal<string | null>(null);
  protected readonly multiPostResult = signal<unknown>(undefined);

  protected accessTokenId = '';
  protected readonly accessTokenLoading = signal(false);
  protected readonly accessTokenError = signal<string | null>(null);
  protected readonly accessTokenResult = signal<unknown>(undefined);

  runTest(): void {
    this.testLoading.set(true);
    this.testError.set(null);
    this.multiPost.test().subscribe({
      next: (res) => {
        this.testLoading.set(false);
        this.testResult.set(res);
      },
      error: (err: HttpErrorResponse) => {
        this.testLoading.set(false);
        this.testError.set(describeHttpError(err));
      },
    });
  }

  lookupMultiPost(): void {
    this.multiPostLoading.set(true);
    this.multiPostError.set(null);
    this.multiPost.getByIdAndSocial(this.multiPostId || null, this.multiPostSocial).subscribe({
      next: (res) => {
        this.multiPostLoading.set(false);
        this.multiPostResult.set(res);
      },
      error: (err: HttpErrorResponse) => {
        this.multiPostLoading.set(false);
        this.multiPostError.set(describeHttpError(err));
      },
    });
  }

  lookupAccessToken(): void {
    if (!this.accessTokenId) {
      return;
    }
    this.accessTokenLoading.set(true);
    this.accessTokenError.set(null);
    this.accessTokens.getById(this.accessTokenId).subscribe({
      next: (res) => {
        this.accessTokenLoading.set(false);
        this.accessTokenResult.set(res);
      },
      error: (err: HttpErrorResponse) => {
        this.accessTokenLoading.set(false);
        this.accessTokenError.set(describeHttpError(err));
        this.notify.error(describeHttpError(err));
      },
    });
  }
}
