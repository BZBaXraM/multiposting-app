import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-result-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="flex items-center gap-2 text-sm text-slate-400 py-4">
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-sky-400"
        ></span>
        Sending request…
      </div>
    } @else if (error()) {
      <div class="rounded-md border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/50 px-3 py-2 text-sm text-red-700 dark:text-red-300">
        {{ error() }}
      </div>
    } @else if (data() !== undefined) {
      <pre
        class="max-h-[28rem] overflow-auto rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
      >{{ data() | json }}</pre
      >
    }
  `,
})
export class ResultPanel {
  loading = input(false);
  error = input<string | null>(null);
  data = input<unknown>(undefined);
}
