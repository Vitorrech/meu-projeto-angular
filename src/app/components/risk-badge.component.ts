import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { RiskLevel } from '../models/triage.models';

@Component({
  selector: 'app-risk-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="risk-badge" [ngClass]="'risk-' + level.toLowerCase()">
      {{ level === 'MEDIO' ? 'MÉDIO' : level === 'CRITICO' ? 'CRÍTICO' : level }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskBadgeComponent {
  @Input({ required: true }) level!: RiskLevel;
}
