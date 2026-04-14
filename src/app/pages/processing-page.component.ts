import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ANALYSIS_STAGES } from '../constants/triage.constants';
import { TriageStateService } from '../services/triage-state.service';

@Component({
  selector: 'app-processing-page',
  standalone: true,
  template: `
    <section class="container processing-wrap">
      <div class="surface-card processing-card">
        <div class="processing-orb" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <span class="eyebrow">Análise em andamento</span>
        <h1>{{ currentStage() }}</h1>
        <p>
          Nosso motor está cruzando sinais clínicos, fatores de risco e informações contextuais
          para gerar uma classificação inicial responsável.
        </p>

        <div class="processing-list">
          @for (item of stages; track item; let index = $index) {
            <div class="processing-line" [class.active]="index <= stageIndex()">
              <span></span>
              <strong>{{ item }}</strong>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessingPageComponent {
  private readonly router = inject(Router);
  private readonly state = inject(TriageStateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stages = ANALYSIS_STAGES;
  readonly stageIndex = signal(0);
  readonly currentStage = signal(ANALYSIS_STAGES[0]);

  constructor() {
    if (!this.state.answers() && !this.state.latestEntry()) {
      void this.router.navigate(['/triage']);
      return;
    }

    timer(0, 850)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tick) => {
        const index = Math.min(tick, this.stages.length - 1);
        this.stageIndex.set(index);
        this.currentStage.set(this.stages[index]);
      });

    forkJoin([this.state.executeAnalysis(), timer(3600)])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          void this.router.navigate(['/result']);
          return of(null);
        })
      )
      .subscribe((entry) => {
        if (!entry) {
          return;
        }
        void this.router.navigate(['/result']);
      });
  }
}
