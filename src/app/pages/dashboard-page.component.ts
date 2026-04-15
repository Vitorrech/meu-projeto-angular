import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HistoryService } from '../services/history.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="container page-stack">
      <div class="page-header history-header dashboard-header">
        <div class="history-hero-copy dashboard-hero-copy">
          <span class="eyebrow">Dashboard</span>
          <h1>
            Painel analítico
            <span class="history-heading-emphasis dashboard-heading-emphasis">da triagem</span>
          </h1>
          <p>Distribuição de risco, sintomas mais frequentes e perfil dos atendimentos salvos localmente.</p>
        </div>

        <div class="toolbar history-toolbar dashboard-toolbar">
          <a class="btn btn-primary" routerLink="/triage">Nova triagem</a>
        </div>
      </div>

      @if (entries().length > 0) {
        <div class="stats-grid">
          <article class="surface-card stat-card">
            <span>Total de triagens</span>
            <strong>{{ entries().length }}</strong>
          </article>
          <article class="surface-card stat-card">
            <span>Risco predominante</span>
            <strong>{{ riskDistribution()[0]?.label || 'Sem dados' }}</strong>
          </article>
          <article class="surface-card stat-card">
            <span>Idade média</span>
            <strong>{{ averageAge() }} anos</strong>
          </article>
          <article class="surface-card stat-card">
            <span>Sintoma principal líder</span>
            <strong>{{ frequentSymptoms()[0]?.label || 'Sem dados' }}</strong>
          </article>
        </div>

        <div class="dashboard-grid">
          <article class="surface-card chart-card">
            <span class="eyebrow">Distribuição de risco</span>
            <h2>Composição visual</h2>
            <div class="donut-layout">
              <div class="donut-chart">
                <div class="donut-center">
                  <strong>{{ entries().length }}</strong>
                  <span>triagens</span>
                </div>
              </div>
              <div class="legend-list">
                @for (item of riskDistribution(); track item.label) {
                  <div class="legend-item">
                    <span class="legend-dot" [class]="'legend-' + item.label.toLowerCase()"></span>
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.value }}</small>
                  </div>
                }
              </div>
            </div>
          </article>

          <article class="surface-card chart-card">
            <span class="eyebrow">Sintomas mais frequentes</span>
            <h2>Ranking atual</h2>
            <div class="bar-list">
              @for (item of frequentSymptoms(); track item.label) {
                <div class="bar-row">
                  <div class="bar-copy">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.value }} registro(s)</span>
                  </div>
                  <div class="bar-track">
                    <span [style.width.%]="item.percent"></span>
                  </div>
                </div>
              }
            </div>
          </article>
        </div>

        <div class="dashboard-grid">
          <article class="surface-card chart-card">
            <span class="eyebrow">Contexto clínico</span>
            <h2>Marcadores do histórico</h2>
            <div class="bar-list">
              @for (item of clinicalProfile(); track item.label) {
                <div class="bar-row compact">
                  <div class="bar-copy">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.value }}</span>
                  </div>
                  <div class="bar-track">
                    <span [style.width.%]="item.percent"></span>
                  </div>
                </div>
              }
            </div>
          </article>

          <article class="surface-card chart-card">
            <span class="eyebrow">Insights rápidos</span>
            <h2>Leituras do histórico</h2>
            <div class="insight-stack">
              <div class="insight-card">
                <strong>{{ criticalCount() }}</strong>
                <span>triagem(ns) com risco crítico</span>
              </div>
              <div class="insight-card">
                <strong>{{ respiratoryShare() }}%</strong>
                <span>relataram queixa respiratória ou torácica</span>
              </div>
              <div class="insight-card">
                <strong>{{ comorbidityShare() }}%</strong>
                <span>informaram pelo menos uma comorbidade</span>
              </div>
            </div>
          </article>
        </div>
      } @else {
        <div class="empty-state">
          <div class="surface-card">
            <h2>Sem dados para o dashboard</h2>
            <p>Após finalizar triagens, este painel mostrará distribuição de risco, sintomas frequentes e insights rápidos.</p>
            <a class="btn btn-primary" routerLink="/triage">Gerar primeira triagem</a>
          </div>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly history = inject(HistoryService);

  readonly entries = this.history.entries;
  readonly averageAge = computed(() => {
    const entries = this.entries();
    if (entries.length === 0) {
      return 0;
    }

    const total = entries.reduce((sum, entry) => sum + entry.answers.age, 0);
    return Math.round(total / entries.length);
  });

  readonly riskDistribution = computed(() => {
    const entries = this.entries();
    const counts = [
      { label: 'BAIXO', value: entries.filter((entry) => entry.result.level === 'BAIXO').length },
      { label: 'MEDIO', value: entries.filter((entry) => entry.result.level === 'MEDIO').length },
      { label: 'ALTO', value: entries.filter((entry) => entry.result.level === 'ALTO').length },
      { label: 'CRITICO', value: entries.filter((entry) => entry.result.level === 'CRITICO').length }
    ];

    return counts
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value);
  });

  readonly frequentSymptoms = computed(() => {
    const entries = this.entries();
    const map = new Map<string, number>();
    entries.forEach((entry) => {
      map.set(entry.answers.mainSymptom, (map.get(entry.answers.mainSymptom) ?? 0) + 1);
    });

    const max = Math.max(...map.values(), 1);
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value, percent: Math.round((value / max) * 100) }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  });

  readonly clinicalProfile = computed(() => {
    const entries = this.entries();
    const buckets = [
      {
        label: 'Comorbidades informadas',
        value: entries.filter((entry) => entry.answers.preExistingConditions.length > 0).length
      },
      {
        label: 'Alergias registradas',
        value: entries.filter((entry) => entry.answers.allergies.trim().length > 0).length
      },
      {
        label: 'Medicação contínua',
        value: entries.filter((entry) => entry.answers.continuousMedication.trim().length > 0).length
      },
      {
        label: 'Contato com pessoa doente',
        value: entries.filter((entry) => entry.answers.contactWithSickPerson).length
      }
    ];

    const max = Math.max(...buckets.map((item) => item.value), 1);
    return buckets.map((item) => ({
      ...item,
      percent: Math.round((item.value / max) * 100)
    }));
  });

  readonly criticalCount = computed(
    () => this.entries().filter((entry) => entry.result.level === 'CRITICO').length
  );

  readonly respiratoryShare = computed(() => {
    const entries = this.entries();
    if (entries.length === 0) {
      return 0;
    }

    const affected = entries.filter(
      (entry) => entry.answers.shortnessOfBreath !== 'none' || entry.answers.chestPain !== 'none'
    ).length;

    return Math.round((affected / entries.length) * 100);
  });

  readonly comorbidityShare = computed(() => {
    const entries = this.entries();
    if (entries.length === 0) {
      return 0;
    }

    const affected = entries.filter((entry) => entry.answers.preExistingConditions.length > 0).length;
    return Math.round((affected / entries.length) * 100);
  });
}
