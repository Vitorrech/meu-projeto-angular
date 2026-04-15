import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { RiskBadgeComponent } from '../components/risk-badge.component';
import { HistoryService } from '../services/history.service';
import { TriageStateService } from '../services/triage-state.service';
import { RiskLevel } from '../models/triage.models';

@Component({
  selector: 'app-result-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RiskBadgeComponent],
  template: `
    @if (entry()) {
      <section class="container result-stack premium-result">
        <header class="surface-card result-hero-card">
          <div class="result-hero-main">
            <div class="result-hero-copy">
              <span class="eyebrow">Resultado da triagem</span>
              <h1>{{ result()!.summary }}</h1>
              <p>{{ result()!.explanation }}</p>
            </div>

            <div class="result-patient-strip">
              <div class="result-patient-chip">
                <span>Paciente</span>
                <strong>{{ entry()!.answers.age }} anos • {{ formatSex(entry()!.answers.sex) }}</strong>
              </div>
              <div class="result-patient-chip">
                <span>Sintoma principal</span>
                <strong>{{ entry()!.answers.mainSymptom }}</strong>
              </div>
              <div class="result-patient-chip">
                <span>Linha do tempo</span>
                <strong>{{ labelize(entry()!.answers.symptomDuration) }} • {{ labelize(entry()!.answers.symptomOnset) }}</strong>
              </div>
            </div>
          </div>

          <aside class="result-score-panel" [class.critical]="result()!.level === 'CRITICO'" [class.high]="result()!.level === 'ALTO'">
            <span class="result-score-label">Classificação inicial</span>
            <app-risk-badge [level]="result()!.level" />
            <strong class="score-display">{{ result()!.score }}</strong>
            <p>score clínico inicial baseado em sinais, contexto e fatores agravantes.</p>
          </aside>
        </header>

        @if (result()!.emergencyAlerts.length > 0) {
          <section class="surface-card result-section-card">
            <div class="result-section-heading">
              <div>
                <span class="eyebrow">Sinais críticos</span>
                <h2>Alertas que exigem atenção imediata</h2>
              </div>
            </div>

            <div class="alert-stack">
              @for (alert of result()!.emergencyAlerts; track alert) {
                <article class="critical-alert-card">
                  <span class="critical-alert-icon">!</span>
                  <div>
                    <strong>Alerta prioritário</strong>
                    <p>{{ alert }}</p>
                  </div>
                </article>
              }
            </div>
          </section>
        }

        <section class="surface-card result-section-card result-ai-panel">
          <div class="result-section-heading">
            <div>
              <span class="eyebrow">Orientação inteligente</span>
              <h2>{{ aiAnalysisTitle() }}</h2>
            </div>

            @if (aiAnalysis()) {
              <div class="result-inline-status">
                <span>Leitura complementar</span>
                <app-risk-badge [level]="aiRiskLevel()" />
              </div>
            }
          </div>

          @if (aiAnalysis()) {
            <div class="result-ai-grid">
              <article class="result-ai-lead">
                <span>Resumo do quadro</span>
                <strong>{{ aiAnalysis()!.resumo }}</strong>
                <p>{{ aiAnalysis()!.mensagemFinal }}</p>
              </article>

              <article class="result-ai-column">
                <span>O que fazer agora</span>
                <ul class="result-bullet-list">
                  @for (item of aiAnalysis()!.oQueFazerAgora; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              </article>

              <article class="result-ai-column">
                <span>Cuidados iniciais</span>
                @if (aiAnalysis()!.cuidadosCaseiros.length > 0) {
                  <ul class="result-bullet-list">
                    @for (item of aiAnalysis()!.cuidadosCaseiros; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                } @else {
                  <p>Nenhuma medida caseira adicional foi sugerida com segurança para este quadro.</p>
                }
              </article>

              <article class="result-ai-column alert">
                <span>Sinais de alerta</span>
                @if (aiAnalysis()!.sinaisDeAlerta.length > 0) {
                  <ul class="result-bullet-list">
                    @for (item of aiAnalysis()!.sinaisDeAlerta; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                } @else {
                  <p>Nenhum sinal adicional foi destacado pela IA além da leitura local da triagem.</p>
                }
              </article>
            </div>
          } @else {
            <div class="empty-state compact">
              <p>{{ aiAnalysisError() }}</p>
            </div>
          }
        </section>

        <section class="surface-card result-section-card">
          <div class="result-section-heading">
            <div>
              <span class="eyebrow">Resumo clínico</span>
              <h2>Contexto do paciente e justificativa da classificação</h2>
            </div>
          </div>

          <div class="result-summary-grid">
            <article class="summary-tile">
              <span>Perfil do paciente</span>
              <strong>{{ entry()!.answers.age }} anos • {{ formatSex(entry()!.answers.sex) }}</strong>
              <p>
                {{ entry()!.answers.preExistingConditions.length || 0 }} comorbidade(s) informada(s)
                e {{ entry()!.answers.pregnant ? 'gestação em andamento' : 'sem gestação em andamento' }}.
              </p>
            </article>

            <article class="summary-tile">
              <span>Impacto funcional</span>
              <strong>{{ labelize(entry()!.answers.normalActivities) }}</strong>
              <p>
                Início {{ labelize(entry()!.answers.symptomOnset) }} e duração
                {{ labelize(entry()!.answers.symptomDuration) }}.
              </p>
            </article>

            <article class="summary-tile">
              <span>Contexto adicional</span>
              <strong>{{ entry()!.answers.mainSymptom }}</strong>
              <p>
                {{ entry()!.answers.contactWithSickPerson ? 'Contato recente com pessoa doente.' : 'Sem contato recente informado.' }}
                {{ entry()!.answers.allergies ? 'Alergias relevantes registradas.' : 'Sem alergias relevantes registradas.' }}
              </p>
            </article>

            <article class="summary-tile summary-tile-wide">
              <span>Justificativa resumida</span>
              <strong>{{ result()!.justification }}</strong>
              <p>{{ result()!.explanation }}</p>

              <div class="insight-stack">
                <div class="insight-card">
                  <span>Classificação local</span>
                  <p class="insight-text insight-text-compact">
                    <strong>{{ result()!.level }}</strong> • score {{ result()!.score }}
                  </p>
                </div>
                <div class="insight-card">
                  <span>Fatores decisivos</span>
                  <p class="insight-text">{{ result()!.decisiveFactors.join(', ') || 'Nenhum fator dominante.' }}</p>
                </div>
                <div class="insight-card">
                  <span>Sinais críticos locais</span>
                  <p class="insight-text">
                    {{ result()!.emergencyAlerts.join(' ') || 'Nenhum sinal crítico adicional identificado.' }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="surface-card result-section-card">
          <div class="result-section-heading">
            <div>
              <span class="eyebrow">Próximos passos</span>
              <h2>Recomendações organizadas por prioridade</h2>
            </div>
          </div>

          <div class="result-recommendation-grid">
            @if (urgentRecommendations().length > 0) {
              <article class="recommendation-group urgent">
                <div class="recommendation-group-head">
                  <span class="recommendation-dot"></span>
                  <div>
                    <strong>Emergencial</strong>
                    <p>Ações que devem ser priorizadas agora.</p>
                  </div>
                </div>

                <div class="recommendation-list">
                  @for (item of urgentRecommendations(); track item.title) {
                    <div class="recommendation-card danger">
                      <strong>{{ item.title }}</strong>
                      <p>{{ item.detail }}</p>
                    </div>
                  }
                </div>
              </article>
            }

            @if (warningRecommendations().length > 0) {
              <article class="recommendation-group warning">
                <div class="recommendation-group-head">
                  <span class="recommendation-dot"></span>
                  <div>
                    <strong>Atenção</strong>
                    <p>Pontos que exigem acompanhamento próximo.</p>
                  </div>
                </div>

                <div class="recommendation-list">
                  @for (item of warningRecommendations(); track item.title) {
                    <div class="recommendation-card warning">
                      <strong>{{ item.title }}</strong>
                      <p>{{ item.detail }}</p>
                    </div>
                  }
                </div>
              </article>
            }

            @if (infoRecommendations().length > 0) {
              <article class="recommendation-group info">
                <div class="recommendation-group-head">
                  <span class="recommendation-dot"></span>
                  <div>
                    <strong>Informação</strong>
                    <p>Orientações complementares para condução segura.</p>
                  </div>
                </div>

                <div class="recommendation-list">
                  @for (item of infoRecommendations(); track item.title) {
                    <div class="recommendation-card">
                      <strong>{{ item.title }}</strong>
                      <p>{{ item.detail }}</p>
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        </section>

        <section class="surface-card result-section-card">
          <div class="result-section-heading">
            <div>
              <span class="eyebrow">Análise detalhada</span>
              <h2>Fatores de risco e informações complementares</h2>
            </div>
            <button class="btn btn-ghost" type="button" (click)="detailsOpen.update((value) => !value)">
              {{ detailsOpen() ? 'Ocultar detalhes' : 'Ver detalhes' }}
            </button>
          </div>

          <div class="result-detail-grid">
            <article class="detail-surface">
              <span class="detail-section-label">Leitura fator a fator</span>
              <div class="factor-list">
                @for (factor of visibleFactors(); track factor.label) {
                  <div class="factor-item">
                    <div>
                      <strong>{{ factor.label }}</strong>
                      <p>{{ factor.description }}</p>
                    </div>
                    <span class="factor-weight">+{{ factor.weight }}</span>
                  </div>
                }
              </div>
            </article>

            <article class="detail-surface">
              <span class="detail-section-label">Consulta complementar de medicamentos</span>

              @if (medicationLookup()) {
                <div class="med-grid">
                  <div class="med-card">
                    <strong>Consulta</strong>
                    <p>{{ medicationLookup()!.queriedMedication }}</p>
                  </div>
                  <div class="med-card">
                    <strong>Status</strong>
                    <p>{{ medicationLookup()!.status === 'success' ? 'Dados públicos localizados' : 'Indisponível agora' }}</p>
                  </div>
                </div>

                @if (medicationLookup()!.status === 'success') {
                  <div class="info-list">
                    <p><strong>Marcas:</strong> {{ medicationLookup()!.brandNames.join(', ') || 'Não informado' }}</p>
                    <p><strong>Alertas:</strong> {{ medicationLookup()!.warnings.join(' ') || 'Sem alertas resumidos disponíveis.' }}</p>
                    <p><strong>Reações adversas:</strong> {{ medicationLookup()!.adverseReactions.join(' ') || 'Sem resumo disponível.' }}</p>
                  </div>
                } @else {
                  <div class="empty-state compact">
                    <p>{{ medicationLookup()!.message }}</p>
                  </div>
                }
              } @else {
                <div class="empty-state compact">
                  <p>Nenhum medicamento foi informado para consulta complementar.</p>
                </div>
              }
            </article>
          </div>
        </section>

        <div class="result-actions">
          <button class="btn btn-primary" type="button" (click)="printResult()">Exportar em PDF / Imprimir</button>
          <button class="btn btn-secondary" type="button" (click)="shareSummary()">Compartilhar resumo</button>
          <a class="btn btn-ghost" routerLink="/triage" (click)="resetFlow()">Refazer triagem</a>
        </div>
      </section>
    } @else {
      <section class="container empty-state">
        <div class="surface-card">
          <h1>Nenhum resultado disponível</h1>
          <p>Inicie uma nova triagem para gerar uma análise clínica inicial.</p>
          <a class="btn btn-primary" routerLink="/triage">Nova triagem</a>
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultPageComponent {
  private readonly state = inject(TriageStateService);
  private readonly history = inject(HistoryService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly detailsOpen = signal(false);
  readonly entry = computed(() => this.state.latestEntry() ?? this.history.latest());
  readonly result = computed(() => this.entry()?.result ?? null);
  readonly medicationLookup = computed(() => this.entry()?.medicationLookup ?? null);
  readonly aiAnalysis = computed(() => this.entry()?.aiAnalysis ?? null);
  readonly aiAnalysisError = computed(
    () =>
      this.entry()?.aiAnalysisError ??
      'Não foi possível gerar a análise com IA no momento. Revise a triagem local e tente novamente.'
  );
  readonly urgentRecommendations = computed(() =>
    (this.result()?.recommendations ?? []).filter((item) => item.emphasis === 'danger')
  );
  readonly warningRecommendations = computed(() =>
    (this.result()?.recommendations ?? []).filter((item) => item.emphasis === 'warning')
  );
  readonly infoRecommendations = computed(() =>
    (this.result()?.recommendations ?? []).filter((item) => item.emphasis !== 'danger' && item.emphasis !== 'warning')
  );
  readonly visibleFactors = computed(() => {
    const factors = this.result()?.riskFactors ?? [];
    return this.detailsOpen() ? factors : factors.slice(0, 4);
  });
  readonly aiRiskLevel = computed<RiskLevel>(() => {
    const level = this.aiAnalysis()?.nivelRisco;
    if (level === 'baixo') {
      return 'BAIXO';
    }
    if (level === 'alto') {
      return 'ALTO';
    }
    if (level === 'critico') {
      return 'CRITICO';
    }
    return 'MEDIO';
  });
  readonly aiAnalysisTitle = computed(() =>
    this.aiAnalysis() ? 'Leitura complementar gerada com IA' : 'Análise complementar indisponível'
  );

  constructor() {
    const latest = this.entry();
    if (latest && !this.state.latestEntry()) {
      this.state.hydrateFromHistory(latest);
    }
  }

  formatSex(value: string): string {
    if (value === 'feminino') {
      return 'Feminino';
    }
    if (value === 'masculino') {
      return 'Masculino';
    }
    if (value === 'nao_informado') {
      return 'Não informado';
    }
    return 'Outro';
  }

  labelize(value: string): string {
    return value
      .replaceAll('_', ' ')
      .replace('none', 'nenhum')
      .replace('mild', 'leve')
      .replace('moderate', 'moderado')
      .replace('severe', 'intenso');
  }

  printResult(): void {
    if (!this.isBrowser) {
      return;
    }

    const entry = this.entry();
    const result = this.result();

    if (!entry || !result) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=900');
    if (!printWindow) {
      return;
    }

    const medication = this.medicationLookup();
    const aiAnalysis = this.aiAnalysis();
    const recommendations = result.recommendations
      .map(
        (item) => `
          <div class="info-card ${item.emphasis ?? 'neutral'}">
            <h4>${this.escapeHtml(item.title)}</h4>
            <p>${this.escapeHtml(item.detail)}</p>
          </div>
        `
      )
      .join('');

    const factors = result.riskFactors
      .map(
        (factor) => `
          <div class="factor-row">
            <div>
              <strong>${this.escapeHtml(factor.label)}</strong>
              <p>${this.escapeHtml(factor.description)}</p>
            </div>
            <span>+${factor.weight}</span>
          </div>
        `
      )
      .join('');

    const alerts =
      result.emergencyAlerts.length > 0
        ? `
          <section class="alert-box">
            <h3>Sinais de emergência identificados</h3>
            <p>${this.escapeHtml(result.emergencyAlerts.join(' '))}</p>
          </section>
        `
        : '';

    const aiBlock = aiAnalysis
      ? `
          <section class="section">
            <h3>Orientação complementar gerada com IA</h3>
            <div class="text-block">
              <p><strong>Resumo:</strong> ${this.escapeHtml(aiAnalysis.resumo)}</p>
              <p><strong>Nível de risco:</strong> ${this.escapeHtml(aiAnalysis.nivelRisco)}</p>
              <p><strong>O que fazer agora:</strong> ${this.escapeHtml(aiAnalysis.oQueFazerAgora.join(', ') || 'Não informado')}</p>
              <p><strong>Cuidados iniciais:</strong> ${this.escapeHtml(aiAnalysis.cuidadosCaseiros.join(', ') || 'Nenhum cuidado caseiro seguro sugerido')}</p>
              <p><strong>Sinais de alerta:</strong> ${this.escapeHtml(aiAnalysis.sinaisDeAlerta.join(', ') || 'Não informado')}</p>
              <p><strong>Mensagem final:</strong> ${this.escapeHtml(aiAnalysis.mensagemFinal)}</p>
            </div>
          </section>
        `
      : `
          <section class="section">
            <h3>Orientação complementar gerada com IA</h3>
            <div class="text-block">
              <p>${this.escapeHtml(this.aiAnalysisError())}</p>
            </div>
          </section>
        `;

    const medicationBlock = medication
      ? medication.status === 'success'
        ? `
          <section class="section">
            <h3>Informações públicas relacionadas</h3>
            <div class="two-col">
              <div class="info-card neutral">
                <h4>Consulta</h4>
                <p>${this.escapeHtml(medication.queriedMedication)}</p>
              </div>
              <div class="info-card neutral">
                <h4>Status</h4>
                <p>Dados públicos localizados</p>
              </div>
            </div>
            <div class="text-block">
              <p><strong>Marcas:</strong> ${this.escapeHtml(medication.brandNames.join(', ') || 'Não informado')}</p>
              <p><strong>Alertas:</strong> ${this.escapeHtml(medication.warnings.join(' ') || 'Sem alertas resumidos disponíveis.')}</p>
              <p><strong>Reações adversas:</strong> ${this.escapeHtml(medication.adverseReactions.join(' ') || 'Sem resumo disponível.')}</p>
            </div>
          </section>
        `
        : `
          <section class="section">
            <h3>Informações públicas relacionadas</h3>
            <div class="text-block">
              <p><strong>Consulta:</strong> ${this.escapeHtml(medication.queriedMedication)}</p>
              <p>${this.escapeHtml(medication.message ?? 'Consulta complementar indisponível no momento.')}</p>
            </div>
          </section>
        `
      : `
        <section class="section">
          <h3>Informações públicas relacionadas</h3>
          <div class="text-block">
            <p>Nenhum medicamento foi informado para consulta complementar.</p>
          </div>
        </section>
      `;

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>MedFlow AI - Resultado da Triagem</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: "Segoe UI", Arial, sans-serif;
              color: #12304d;
              background: #f4f8fc;
            }
            .page {
              padding: 32px;
            }
            .hero {
              background: linear-gradient(135deg, #1565d8, #6cb7ff);
              color: white;
              border-radius: 24px;
              padding: 28px;
              margin-bottom: 20px;
            }
            .hero-top {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              align-items: flex-start;
            }
            .eyebrow {
              display: inline-block;
              font-size: 12px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              font-weight: 700;
              opacity: 0.85;
              margin-bottom: 10px;
            }
            h1, h2, h3, h4, p {
              margin: 0;
            }
            h1 {
              font-size: 34px;
              margin-bottom: 12px;
            }
            .hero p {
              line-height: 1.6;
              max-width: 720px;
            }
            .score-box {
              min-width: 180px;
              background: rgba(255,255,255,0.14);
              border: 1px solid rgba(255,255,255,0.24);
              border-radius: 20px;
              padding: 18px;
            }
            .score-box strong {
              display: block;
              font-size: 44px;
              margin: 8px 0;
            }
            .badge {
              display: inline-block;
              padding: 8px 12px;
              border-radius: 999px;
              background: rgba(255,255,255,0.18);
              font-weight: 700;
            }
            .section {
              background: white;
              border: 1px solid #dce7f2;
              border-radius: 22px;
              padding: 22px;
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .section h3 {
              font-size: 21px;
              margin-bottom: 14px;
            }
            .two-col {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
            }
            .info-card {
              border-radius: 18px;
              padding: 16px;
              border: 1px solid #e3edf7;
              background: #f9fbfe;
            }
            .info-card h4 {
              margin-bottom: 8px;
              font-size: 16px;
            }
            .info-card p,
            .text-block p,
            .factor-row p {
              line-height: 1.65;
              color: #48647d;
              word-break: break-word;
              overflow-wrap: anywhere;
            }
            .warning { background: #fff6df; }
            .danger { background: #ffe6ea; }
            .neutral { background: #f9fbfe; }
            .alert-box {
              background: #ffe1e6;
              color: #a12435;
              border-radius: 20px;
              padding: 18px 20px;
              margin-bottom: 18px;
              border: 1px solid #f2b8c1;
            }
            .alert-box h3 {
              margin-bottom: 8px;
              font-size: 18px;
            }
            .factor-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
              padding: 14px 0;
              border-bottom: 1px solid #e7eef5;
            }
            .factor-row:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .factor-row strong {
              display: block;
              margin-bottom: 6px;
            }
            .factor-row span {
              flex: 0 0 auto;
              min-width: 48px;
              text-align: center;
              padding: 10px 12px;
              border-radius: 14px;
              background: #e6f0fb;
              color: #0f4fb0;
              font-weight: 700;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
              margin-top: 16px;
            }
            .meta-item {
              background: rgba(255,255,255,0.12);
              border-radius: 18px;
              padding: 14px;
            }
            .meta-item small {
              display: block;
              opacity: 0.8;
              margin-bottom: 6px;
            }
            .footer-note {
              margin-top: 24px;
              font-size: 12px;
              color: #647c93;
              text-align: center;
            }
            @media print {
              body { background: white; }
              .page { padding: 0; }
            }
            @media (max-width: 720px) {
              .hero-top,
              .two-col,
              .meta {
                display: block;
              }
              .score-box {
                margin-top: 16px;
              }
              .factor-row {
                display: block;
              }
              .factor-row span {
                display: inline-block;
                margin-top: 10px;
              }
            }
          </style>
        </head>
        <body>
          <main class="page">
            <section class="hero">
              <span class="eyebrow">Resultado da triagem</span>
              <div class="hero-top">
                <div>
                  <h1>${this.escapeHtml(result.summary)}</h1>
                  <p>${this.escapeHtml(result.explanation)}</p>
                  <div class="meta">
                    <div class="meta-item">
                      <small>Justificativa resumida</small>
                      <strong>${this.escapeHtml(result.justification)}</strong>
                    </div>
                    <div class="meta-item">
                      <small>Fatores decisivos</small>
                      <strong>${this.escapeHtml(result.decisiveFactors.join(', ') || 'Nenhum fator dominante')}</strong>
                    </div>
                  </div>
                </div>
                <div class="score-box">
                  <span class="badge">Risco ${this.escapeHtml(result.level)}</span>
                  <strong>${result.score}</strong>
                  <p>score clínico inicial</p>
                </div>
              </div>
            </section>

            ${alerts}

            <section class="section">
              <h3>Recomendações práticas</h3>
              <div class="two-col">
                ${recommendations}
              </div>
            </section>

            <section class="section">
              <h3>Fatores que elevaram o risco</h3>
              ${factors}
            </section>

            ${aiBlock}

            ${medicationBlock}

            <p class="footer-note">
              Relatório gerado em ${this.escapeHtml(this.formatDate(entry.createdAt))}. Esta plataforma não substitui diagnóstico médico. Em caso de emergência, procure atendimento imediatamente.
            </p>
          </main>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  shareSummary(): void {
    const result = this.result();
    const aiAnalysis = this.aiAnalysis();
    if (!result || !this.isBrowser) {
      return;
    }

    const text = aiAnalysis
      ? `Resumo MedFlow AI: risco ${aiAnalysis.nivelRisco}, score local ${result.score}. ${aiAnalysis.resumo} ${aiAnalysis.mensagemFinal}`
      : `Resumo MedFlow AI: risco ${result.level}, score ${result.score}. ${result.justification}`;

    if (navigator.share) {
      void navigator.share({
        title: 'Resumo da triagem',
        text
      });
      return;
    }

    void navigator.clipboard.writeText(text);
  }

  resetFlow(): void {
    this.state.reset();
    void this.router.navigate(['/triage']);
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
