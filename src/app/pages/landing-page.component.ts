import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_NAME, BENEFITS, HERO_METRICS, HOW_IT_WORKS } from '../constants/triage.constants';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-section container">
      <div class="hero-copy">
        <span class="pill">Healthtech experience • Frontend premium</span>
        <h1>{{ appName }}</h1>
        <p class="hero-subtitle">
          Plataforma de triagem médica inteligente com análise inicial assistida por IA, avaliação
          por score clínico e experiência de produto pronta para apresentação.
        </p>

        <div class="hero-actions">
          <a class="btn btn-primary" routerLink="/triage">Iniciar triagem</a>
          <a class="btn btn-secondary" routerLink="/dashboard">Explorar dashboard</a>
        </div>

        <div class="hero-metrics">
          @for (metric of metrics; track metric.label) {
            <article class="metric-card">
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.label }}</span>
            </article>
          }
        </div>
      </div>

      <div class="hero-panel surface-card">
        <div class="panel-head">
          <span class="eyebrow">Análise inteligente assistida por IA</span>
          <h2>Classificação clínica inicial com justificativa transparente</h2>
        </div>

        <div class="signal-grid">
          <div class="signal-card signal-low">
            <span>BAIXO</span>
            <strong>Monitorar e observar</strong>
          </div>
          <div class="signal-card signal-medium">
            <span>MÉDIO</span>
            <strong>Avaliação médica breve</strong>
          </div>
          <div class="signal-card signal-high">
            <span>ALTO</span>
            <strong>Atendimento rapidamente</strong>
          </div>
          <div class="signal-card signal-critical">
            <span>CRÍTICO</span>
            <strong>Emergência imediata</strong>
          </div>
        </div>

        <div class="analysis-preview">
          <p>Motor clínico considera:</p>
          <ul>
            <li>Sinais de alarme e combinações de sintomas graves</li>
            <li>Idade, comorbidades, duração e intensidade</li>
            <li>Capacidade funcional e contexto medicamentoso</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="container content-section">
      <div class="section-heading">
        <span class="eyebrow">Benefícios</span>
        <h2>Visual de startup de saúde real, sem abrir mão da coerência clínica</h2>
      </div>

      <div class="feature-grid">
        @for (benefit of benefits; track benefit.title) {
          <article class="surface-card feature-card">
            <div class="feature-icon">✚</div>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.description }}</p>
          </article>
        }
      </div>
    </section>

    <section class="container content-section">
      <div class="section-heading">
        <span class="eyebrow">Como funciona</span>
        <h2>Fluxo guiado para avaliação inicial rápida e compreensível</h2>
      </div>

      <div class="timeline-grid">
        @for (item of steps; track item; let index = $index) {
          <article class="surface-card timeline-card">
            <span class="timeline-index">0{{ index + 1 }}</span>
            <p>{{ item }}</p>
          </article>
        }
      </div>
    </section>

    <section class="container legal-banner">
      <div class="surface-card legal-card">
        <div>
          <span class="eyebrow">Aviso legal</span>
          <h2>Não substitui atendimento médico</h2>
        </div>
        <p>
          A plataforma realiza uma avaliação inicial assistida por inteligência computacional. Em
          caso de piora clínica, sinais críticos ou emergência, procure atendimento médico
          imediatamente.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent {
  readonly appName = APP_NAME;
  readonly metrics = HERO_METRICS;
  readonly benefits = BENEFITS;
  readonly steps = HOW_IT_WORKS;
}
