import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pricing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Тарифы</h1>
    <p class="mb-4 text-xs text-slate-500">
      В API нет эндпоинтов для тарифов/подписок — вкладка статична, для оформления UI.
    </p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      @for (plan of plans; track plan.name) {
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p class="text-sm font-medium text-slate-900 dark:text-white">{{ plan.name }}</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{{ plan.price }}</p>
          <ul class="mt-3 flex flex-col gap-1 text-xs text-slate-400">
            @for (feature of plan.features; track feature) {
              <li>• {{ feature }}</li>
            }
          </ul>
          <button
            type="button"
            disabled
            class="mt-4 w-full cursor-not-allowed rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-500"
          >
            Скоро
          </button>
        </div>
      }
    </div>
  `,
})
export class Pricing {
  protected readonly plans = [
    { name: 'Free', price: '0 ₽', features: ['1 проект', 'До 3 аккаунтов', 'Ручной постинг'] },
    {
      name: 'Pro',
      price: '990 ₽/мес',
      features: ['Безлимит аккаунтов', 'История публикаций', 'Приоритетная поддержка'],
    },
    {
      name: 'Business',
      price: 'По запросу',
      features: ['Несколько проектов', 'Командный доступ', 'SLA'],
    },
  ];
}
