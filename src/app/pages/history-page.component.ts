import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { RiskBadgeComponent } from '../components/risk-badge.component';
import { HistoryService } from '../services/history.service';
import { TriageStateService } from '../services/triage-state.service';
import { RiskLevel } from '../models/triage.models';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RiskBadgeComponent, DatePipe],
  template: `
    <section class="container page-stack">
      <div class="page-header history-header">
        <div class="history-hero-copy">
          <span class="eyebrow">Histórico local</span>
          <h1>
            Histórico de
            <span class="history-heading-emphasis">triagens</span>
          </h1>
          <p>
            Acompanhe avaliações anteriores com leitura clara, filtros refinados e contexto clínico
            preservado localmente.
          </p>
        </div>

        <div class="toolbar history-toolbar">
          <label class="history-filter">
            <span>Filtrar risco</span>
            <select [value]="filter()" (change)="filter.set(($any($event.target).value))">
              <option value="TODOS">Todos os riscos</option>
              <option value="BAIXO">Baixo</option>
              <option value="MEDIO">Médio</option>
              <option value="ALTO">Alto</option>
              <option value="CRITICO">Crítico</option>
            </select>
          </label>
          <button class="btn btn-ghost history-clear" type="button" (click)="history.clear()">
            Limpar histórico
          </button>
        </div>
      </div>

      @if (filteredEntries().length > 0) {
        <div class="history-list">
          @for (entry of filteredEntries(); track entry.id) {
            <article class="surface-card history-card">
              <div class="history-card-top">
                <div class="history-card-copy">
                  <app-risk-badge [level]="entry.result.level" />
                  <h2>{{ entry.answers.mainSymptom }}</h2>
                  <p>{{ entry.result.justification }}</p>
                </div>

                <div class="history-meta">
                  <div class="history-score">
                    <small>Score clínico</small>
                    <strong>{{ entry.result.score }}</strong>
                    <span>pts</span>
                  </div>
                  <time class="history-timestamp">{{ entry.createdAt | date: 'dd/MM/yyyy HH:mm' }}</time>
                </div>
              </div>

              <div class="history-tags">
                <span>{{ entry.answers.age }} anos</span>
                <span>{{ entry.answers.normalActivities }}</span>
                <span>{{ entry.answers.symptomDuration }}</span>
                <span>{{ entry.answers.preExistingConditions.length || 0 }} comorbidades</span>
              </div>

              <div class="history-actions">
                <button class="btn btn-secondary" type="button" (click)="openEntry(entry.id)">
                  {{ selectedId() === entry.id ? 'Ocultar detalhes' : 'Ver detalhes' }}
                </button>
              </div>

              @if (selectedId() === entry.id) {
                <div class="history-detail">
                  <div class="history-detail-card">
                    <strong>Fatores decisivos</strong>
                    <p>{{ entry.result.decisiveFactors.join(', ') }}</p>
                  </div>
                  <div class="history-detail-card">
                    <strong>Recomendação principal</strong>
                    <p>{{ entry.result.recommendations[0]?.detail }}</p>
                  </div>
                  <div class="history-detail-card">
                    <strong>Medicamento consultado</strong>
                    <p>{{ entry.medicationLookup?.queriedMedication || 'Nenhum' }}</p>
                  </div>
                </div>
              }
            </article>
          }
        </div>
      } @else {
        <div class="empty-state history-empty">
          <div class="surface-card">
            <span class="eyebrow">Sem registros</span>
            <h2>Seu histórico ainda está vazio</h2>
            <p>Finalize uma triagem para visualizar avaliações anteriores, filtros e detalhes.</p>
            <a class="btn btn-primary" routerLink="/triage">Criar primeira triagem</a>
          </div>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryPageComponent {
  readonly history = inject(HistoryService);
  private readonly state = inject(TriageStateService);

  readonly filter = signal<RiskLevel | 'TODOS'>('TODOS');
  readonly selectedId = signal<string | null>(null);
  readonly filteredEntries = computed(() => this.history.filterByRisk(this.filter()));

  openEntry(entryId: string): void {
    this.selectedId.update((current) => (current === entryId ? null : entryId));
    const entry = this.history.entries().find((item) => item.id === entryId);
    if (entry) {
      this.state.hydrateFromHistory(entry);
    }
  }
}
