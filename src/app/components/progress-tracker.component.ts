import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-progress-tracker',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="progress-card">
      <div class="progress-header">
        <div class="progress-heading">
          <span class="eyebrow">Fluxo de triagem</span>
          <h3>Etapa {{ current + 1 }} de {{ steps.length }}</h3>
        </div>
        <strong class="progress-value">{{ progress }}%</strong>
      </div>

      <div class="progress-bar" aria-hidden="true">
        <span [style.width.%]="progress"></span>
      </div>

      <ol class="step-list">
        @for (step of steps; track step.title; let index = $index) {
          <li [ngClass]="{ active: index === current, complete: index < current }">
            <span>{{ index + 1 }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <small>{{ step.description }}</small>
            </div>
          </li>
        }
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressTrackerComponent {
  @Input({ required: true }) current = 0;
  @Input({ required: true }) steps: ReadonlyArray<{ title: string; description: string }> = [];

  get progress(): number {
    if (this.steps.length === 0) {
      return 0;
    }

    return Math.round(((this.current + 1) / this.steps.length) * 100);
  }
}
