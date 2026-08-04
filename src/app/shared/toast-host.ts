import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotifyService } from '../core/services/notify.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2">
      @for (toast of notify.toasts(); track toast.id) {
        <div
          class="pointer-events-auto rounded-md border px-4 py-2 text-sm shadow-lg"
          [class.border-emerald-300]="toast.kind === 'success'"
          [class.dark:border-emerald-700]="toast.kind === 'success'"
          [class.bg-emerald-100]="toast.kind === 'success'"
          [class.dark:bg-emerald-950]="toast.kind === 'success'"
          [class.text-emerald-700]="toast.kind === 'success'"
          [class.dark:text-emerald-300]="toast.kind === 'success'"
          [class.border-red-300]="toast.kind === 'error'"
          [class.dark:border-red-800]="toast.kind === 'error'"
          [class.bg-red-100]="toast.kind === 'error'"
          [class.dark:bg-red-950]="toast.kind === 'error'"
          [class.text-red-700]="toast.kind === 'error'"
          [class.dark:text-red-300]="toast.kind === 'error'"
          [class.border-slate-300]="toast.kind === 'info'"
          [class.dark:border-slate-700]="toast.kind === 'info'"
          [class.bg-slate-200]="toast.kind === 'info'"
          [class.dark:bg-slate-800]="toast.kind === 'info'"
          [class.text-slate-700]="toast.kind === 'info'"
          [class.dark:text-slate-200]="toast.kind === 'info'"
        >
          {{ toast.text }}
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly notify = inject(NotifyService);
}
