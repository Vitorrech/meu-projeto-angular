import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MAIN_SYMPTOM_OPTIONS, PRE_EXISTING_OPTIONS, TRIAGE_STEPS } from '../constants/triage.constants';
import { ProgressTrackerComponent } from '../components/progress-tracker.component';
import { TriageAnswers } from '../models/triage.models';
import { TriageStateService } from '../services/triage-state.service';

@Component({
  selector: 'app-triage-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgressTrackerComponent],
  template: `
    <section class="container page-grid">
      <aside class="page-sidebar">
        <app-progress-tracker [current]="currentStep()" [steps]="steps" />

        <article class="surface-card sidebar-note">
          <span class="eyebrow">Boas práticas</span>
          <h3>Respostas precisas elevam a qualidade da triagem</h3>
          <p>
            A qualidade da classificação depende da clareza das respostas. Este fluxo não gera
            diagnóstico definitivo.
          </p>
        </article>
      </aside>

      <div class="surface-card form-card">
        <div class="triage-hero">
          <div class="triage-hero-copy">
            <span class="eyebrow triage-hero-eyebrow">Triagem inteligente assistida</span>
            <h1>
              Uma leitura clínica clara,
              <span class="triage-hero-emphasis">elegante</span>
              e orientada por contexto.
            </h1>
            <p class="triage-hero-text">
              Organize os sinais principais com precisão e conduza a avaliação inicial com uma
              experiência fluida, confiável e tecnicamente refinada.
            </p>

            <div class="triage-hero-meta">
              <div class="hero-badge">
                <small>Perfil da sessão</small>
                <strong>{{ steps[currentStep()].title }}</strong>
                <span>Etapa ativa do fluxo</span>
              </div>

              <div class="hero-badge">
                <small>Progresso atual</small>
                <strong>{{ currentStep() + 1 }}/{{ steps.length }}</strong>
                <span>Progresso estruturado</span>
              </div>
            </div>
          </div>

          <div class="triage-hero-panel">
            <div class="hero-panel-label">Visão da sessão</div>
            <div class="hero-panel-card hero-panel-card-secondary">
              <span class="hero-panel-kicker">Leitura assistida</span>
              <strong>Avaliação guiada por sinais e contexto clínico.</strong>
              <p>Estruture a coleta inicial com clareza, progressão segura e foco na tomada de decisão.</p>
            </div>
            <div class="hero-panel-card">
              <span class="hero-panel-kicker">Sinalização atual</span>
              <strong>{{ steps[currentStep()].title }}</strong>
              <p>{{ steps[currentStep()].description }}</p>
            </div>
            <div class="hero-panel-foot">
              <span>Fluxo seguro</span>
              <span>Leitura progressiva</span>
              <span>Pronto para análise</span>
            </div>
          </div>
        </div>

        <div class="form-heading">
          <div>
            <span class="eyebrow">Etapa {{ currentStep() + 1 }}</span>
            <h2>{{ steps[currentStep()].title }}</h2>
          </div>
          <p>{{ steps[currentStep()].description }}</p>
        </div>

        @if (currentError()) {
          <div class="alert-banner warning">{{ currentError() }}</div>
        }

        <form [formGroup]="form" novalidate>
          @switch (currentStep()) {
            @case (0) {
              <div class="field-grid two-columns">
                <label class="field">
                  <span>Idade</span>
                  <input type="number" min="0" max="120" formControlName="age" placeholder="Ex.: 42" />
                </label>

                <label class="field">
                  <span>Sexo</span>
                  <select formControlName="sex">
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="outro">Outro</option>
                    <option value="nao_informado">Prefiro não informar</option>
                  </select>
                </label>

                <label class="field field-span-2">
                  <span>Sintoma principal</span>
                  <select formControlName="mainSymptom">
                    @for (item of symptomOptions; track item) {
                      <option [value]="item">{{ item }}</option>
                    }
                  </select>
                </label>

                <div class="field">
                  <span>Início dos sintomas</span>
                  <div class="segmented">
                    <button type="button" [class.active]="form.value.symptomOnset === 'subito'" (click)="setControl('symptomOnset', 'subito')">Súbito</button>
                    <button type="button" [class.active]="form.value.symptomOnset === 'gradual'" (click)="setControl('symptomOnset', 'gradual')">Gradual</button>
                  </div>
                </div>

                <div class="field">
                  <span>Gestação em andamento</span>
                  <div class="segmented">
                    <button type="button" [class.active]="form.value.pregnant === true" (click)="setControl('pregnant', true)">Sim</button>
                    <button type="button" [class.active]="form.value.pregnant === false" (click)="setControl('pregnant', false)">Não</button>
                  </div>
                </div>
              </div>
            }

            @case (1) {
              <div class="field-grid two-columns">
                <div class="field">
                  <span>Há febre?</span>
                  <div class="segmented">
                    <button type="button" [class.active]="form.value.fever === true" (click)="setControl('fever', true)">Sim</button>
                    <button type="button" [class.active]="form.value.fever === false" (click)="setControl('fever', false)">Não</button>
                  </div>
                </div>

                <label class="field">
                  <span>Temperatura aproximada (°C)</span>
                  <input type="number" min="34" max="43" step="0.1" formControlName="temperature" placeholder="Ex.: 38.7" />
                </label>

                <label class="field">
                  <span>Falta de ar</span>
                  <select formControlName="shortnessOfBreath">
                    <option value="none">Nenhuma</option>
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderada</option>
                    <option value="severe">Intensa</option>
                  </select>
                </label>

                <label class="field">
                  <span>Respiração / saturação percebida</span>
                  <select formControlName="breathingQuality">
                    <option value="normal">Normal</option>
                    <option value="desconforto">Desconfortável</option>
                    <option value="muito_ruim">Muito ruim</option>
                    <option value="saturacao_baixa">Saturação baixa / muito preocupante</option>
                  </select>
                </label>

                <label class="field">
                  <span>Saturação medida, se souber (%)</span>
                  <input type="number" min="50" max="100" formControlName="oxygenSaturation" placeholder="Ex.: 94" />
                </label>

                <label class="field">
                  <span>Dor no peito</span>
                  <select formControlName="chestPain">
                    <option value="none">Nenhuma</option>
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderada</option>
                    <option value="severe">Intensa</option>
                  </select>
                </label>

                <label class="field field-span-2">
                  <span>Tosse</span>
                  <select formControlName="cough">
                    <option value="none">Não</option>
                    <option value="seca">Seca</option>
                    <option value="produtiva">Produtiva</option>
                    <option value="com_sangue">Com sangue</option>
                  </select>
                </label>
              </div>
            }

            @case (2) {
              <div class="field-grid two-columns">
                <label class="field">
                  <span>Tontura ou desmaio</span>
                  <select formControlName="dizzinessOrFainting">
                    <option value="none">Nenhum</option>
                    <option value="tontura">Tontura</option>
                    <option value="desmaio">Desmaio</option>
                  </select>
                </label>

                <div class="field">
                  <span>Confusão mental / dificuldade de orientação</span>
                  <div class="segmented">
                    <button type="button" [class.active]="form.value.confusion === true" (click)="setControl('confusion', true)">Sim</button>
                    <button type="button" [class.active]="form.value.confusion === false" (click)="setControl('confusion', false)">Não</button>
                  </div>
                </div>

                <label class="field">
                  <span>Dor intensa (0 a 10)</span>
                  <input type="range" min="0" max="10" formControlName="painScale" />
                  <strong class="range-value">{{ form.value.painScale }}</strong>
                </label>

                <label class="field">
                  <span>Dor de cabeça</span>
                  <select formControlName="headache">
                    <option value="none">Nenhuma</option>
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderada</option>
                    <option value="severe">Intensa</option>
                  </select>
                </label>

                <label class="field">
                  <span>Náusea ou vômito</span>
                  <select formControlName="nauseaOrVomiting">
                    <option value="none">Nenhum</option>
                    <option value="mild">Náusea leve</option>
                    <option value="vomiting">Vômitos</option>
                    <option value="persistent">Vômitos persistentes</option>
                  </select>
                </label>

                <label class="field">
                  <span>Diarreia</span>
                  <select formControlName="diarrhea">
                    <option value="none">Não</option>
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderada</option>
                    <option value="severe">Intensa</option>
                  </select>
                </label>
              </div>
            }

            @case (3) {
              <div class="field-grid">
                <div class="field">
                  <span>Doenças pré-existentes</span>
                  <div class="chip-grid">
                    @for (condition of conditionOptions; track condition) {
                      <button
                        type="button"
                        class="chip"
                        [class.active]="isConditionSelected(condition)"
                        (click)="toggleCondition(condition)"
                      >
                        {{ condition }}
                      </button>
                    }
                  </div>
                </div>

                <label class="field">
                  <span>Uso de medicação contínua</span>
                  <textarea rows="2" formControlName="continuousMedication" placeholder="Ex.: losartana, metformina"></textarea>
                </label>

                <label class="field">
                  <span>Medicamentos a consultar no openFDA</span>
                  <textarea rows="2" formControlName="medicationNames" placeholder="Digite um ou mais nomes, separados por vírgula"></textarea>
                </label>

                <label class="field">
                  <span>Alergias relevantes</span>
                  <input type="text" formControlName="allergies" placeholder="Ex.: dipirona, penicilina" />
                </label>

                <div class="field">
                  <span>Contato recente com pessoa doente</span>
                  <div class="segmented">
                    <button type="button" [class.active]="form.value.contactWithSickPerson === true" (click)="setControl('contactWithSickPerson', true)">Sim</button>
                    <button type="button" [class.active]="form.value.contactWithSickPerson === false" (click)="setControl('contactWithSickPerson', false)">Não</button>
                  </div>
                </div>
              </div>
            }

            @case (4) {
              <div class="field-grid two-columns">
                <label class="field">
                  <span>Duração dos sintomas</span>
                  <select formControlName="symptomDuration">
                    <option value="menos_24h">Menos de 24 horas</option>
                    <option value="1_3_dias">1 a 3 dias</option>
                    <option value="4_7_dias">4 a 7 dias</option>
                    <option value="mais_7_dias">Mais de 7 dias</option>
                  </select>
                </label>

                <label class="field">
                  <span>Gravidade percebida pelo paciente (1 a 5)</span>
                  <input type="range" min="1" max="5" formControlName="perceivedSeverity" />
                  <strong class="range-value">{{ form.value.perceivedSeverity }}</strong>
                </label>

                <label class="field field-span-2">
                  <span>Capacidade de realizar atividades normais</span>
                  <select formControlName="normalActivities">
                    <option value="normal">Normal</option>
                    <option value="reduzidas">Reduzidas</option>
                    <option value="muito_limitadas">Muito limitadas</option>
                    <option value="incapaz">Incapaz</option>
                  </select>
                </label>
              </div>
            }

            @case (5) {
              <div class="review-grid">
                @for (item of reviewItems(); track item.label) {
                  <article class="review-item">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </article>
                }
              </div>
            }
          }
        </form>

        <div class="form-actions">
          <button class="btn btn-ghost" type="button" (click)="resetForm()">Resetar</button>
          <div class="action-stack">
            @if (currentStep() > 0) {
              <button class="btn btn-secondary" type="button" (click)="previousStep()">Voltar</button>
            }

            @if (currentStep() < steps.length - 1) {
              <button class="btn btn-primary" type="button" (click)="nextStep()">Continuar</button>
            } @else {
              <button class="btn btn-primary" type="button" (click)="submit()">Iniciar análise</button>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriagePageComponent {
  private readonly router = inject(Router);
  private readonly state = inject(TriageStateService);

  readonly steps = TRIAGE_STEPS;
  readonly conditionOptions = PRE_EXISTING_OPTIONS;
  readonly symptomOptions = MAIN_SYMPTOM_OPTIONS;
  readonly currentStep = signal(0);
  readonly currentError = signal('');

  readonly form = new FormGroup({
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(120)]),
    sex: new FormControl('feminino', { nonNullable: true }),
    pregnant: new FormControl(false, { nonNullable: true }),
    mainSymptom: new FormControl(MAIN_SYMPTOM_OPTIONS[0], { nonNullable: true }),
    symptomOnset: new FormControl('gradual', { nonNullable: true }),
    fever: new FormControl(false, { nonNullable: true }),
    temperature: new FormControl<number | null>(null),
    shortnessOfBreath: new FormControl('none', { nonNullable: true }),
    breathingQuality: new FormControl('normal', { nonNullable: true }),
    oxygenSaturation: new FormControl<number | null>(null),
    chestPain: new FormControl('none', { nonNullable: true }),
    cough: new FormControl('none', { nonNullable: true }),
    dizzinessOrFainting: new FormControl('none', { nonNullable: true }),
    confusion: new FormControl(false, { nonNullable: true }),
    painScale: new FormControl(3, { nonNullable: true }),
    headache: new FormControl('none', { nonNullable: true }),
    nauseaOrVomiting: new FormControl('none', { nonNullable: true }),
    diarrhea: new FormControl('none', { nonNullable: true }),
    preExistingConditions: new FormControl<string[]>([], { nonNullable: true }),
    continuousMedication: new FormControl('', { nonNullable: true }),
    medicationNames: new FormControl('', { nonNullable: true }),
    allergies: new FormControl('', { nonNullable: true }),
    contactWithSickPerson: new FormControl(false, { nonNullable: true }),
    symptomDuration: new FormControl('1_3_dias', { nonNullable: true }),
    perceivedSeverity: new FormControl(3, { nonNullable: true }),
    normalActivities: new FormControl('reduzidas', { nonNullable: true })
  });

  readonly reviewItems = computed(() => {
    const value = this.form.getRawValue();
    return [
      { label: 'Idade', value: value.age ? `${value.age} anos` : '-' },
      { label: 'Sintoma principal', value: value.mainSymptom },
      { label: 'Falta de ar', value: this.labelize(value.shortnessOfBreath) },
      { label: 'Dor no peito', value: this.labelize(value.chestPain) },
      { label: 'Duração', value: this.labelize(value.symptomDuration) },
      { label: 'Condições pré-existentes', value: value.preExistingConditions.join(', ') || 'Nenhuma' },
      { label: 'Atividades normais', value: this.labelize(value.normalActivities) },
      { label: 'Medicamentos informados', value: value.medicationNames || 'Não informado' }
    ];
  });

  setControl(controlName: string, value: unknown): void {
    this.form.get(controlName)?.setValue(value);
  }

  isConditionSelected(condition: string): boolean {
    return this.form.controls.preExistingConditions.value.includes(condition);
  }

  toggleCondition(condition: string): void {
    const current = this.form.controls.preExistingConditions.value;
    const next = current.includes(condition)
      ? current.filter((item) => item !== condition)
      : [...current, condition];
    this.form.controls.preExistingConditions.setValue(next);
  }

  nextStep(): void {
    const error = this.validateStep(this.currentStep());
    this.currentError.set(error);

    if (error) {
      return;
    }

    this.currentStep.update((value) => Math.min(value + 1, this.steps.length - 1));
  }

  previousStep(): void {
    this.currentError.set('');
    this.currentStep.update((value) => Math.max(value - 1, 0));
  }

  resetForm(): void {
    this.form.reset({
      age: null,
      sex: 'feminino',
      pregnant: false,
      mainSymptom: MAIN_SYMPTOM_OPTIONS[0],
      symptomOnset: 'gradual',
      fever: false,
      temperature: null,
      shortnessOfBreath: 'none',
      breathingQuality: 'normal',
      oxygenSaturation: null,
      chestPain: 'none',
      cough: 'none',
      dizzinessOrFainting: 'none',
      confusion: false,
      painScale: 3,
      headache: 'none',
      nauseaOrVomiting: 'none',
      diarrhea: 'none',
      preExistingConditions: [],
      continuousMedication: '',
      medicationNames: '',
      allergies: '',
      contactWithSickPerson: false,
      symptomDuration: '1_3_dias',
      perceivedSeverity: 3,
      normalActivities: 'reduzidas'
    });
    this.currentStep.set(0);
    this.currentError.set('');
    this.state.reset();
  }

  submit(): void {
    const finalError = this.validateAll();
    this.currentError.set(finalError);

    if (finalError) {
      this.currentStep.set(0);
      return;
    }

    const value = this.form.getRawValue();
    const answers: TriageAnswers = {
      age: Number(value.age ?? 0),
      sex: value.sex as TriageAnswers['sex'],
      pregnant: value.pregnant,
      mainSymptom: value.mainSymptom,
      symptomOnset: value.symptomOnset as TriageAnswers['symptomOnset'],
      fever: value.fever,
      temperature: value.temperature ? Number(value.temperature) : null,
      shortnessOfBreath: value.shortnessOfBreath as TriageAnswers['shortnessOfBreath'],
      breathingQuality: value.breathingQuality as TriageAnswers['breathingQuality'],
      chestPain: value.chestPain as TriageAnswers['chestPain'],
      dizzinessOrFainting: value.dizzinessOrFainting as TriageAnswers['dizzinessOrFainting'],
      confusion: value.confusion,
      painScale: value.painScale,
      symptomDuration: value.symptomDuration as TriageAnswers['symptomDuration'],
      cough: value.cough as TriageAnswers['cough'],
      nauseaOrVomiting: value.nauseaOrVomiting as TriageAnswers['nauseaOrVomiting'],
      diarrhea: value.diarrhea as TriageAnswers['diarrhea'],
      headache: value.headache as TriageAnswers['headache'],
      preExistingConditions: value.preExistingConditions,
      continuousMedication: value.continuousMedication.trim(),
      perceivedSeverity: value.perceivedSeverity,
      normalActivities: value.normalActivities as TriageAnswers['normalActivities'],
      contactWithSickPerson: value.contactWithSickPerson,
      oxygenSaturation: value.oxygenSaturation ? Number(value.oxygenSaturation) : null,
      medicationNames: value.medicationNames.trim(),
      allergies: value.allergies.trim()
    };

    this.state.setAnswers(answers);
    void this.router.navigate(['/processing']);
  }

  private validateAll(): string {
    for (let index = 0; index < this.steps.length - 1; index += 1) {
      const error = this.validateStep(index);
      if (error) {
        return error;
      }
    }
    return '';
  }

  private validateStep(stepIndex: number): string {
    const value = this.form.getRawValue();

    if (stepIndex === 0) {
      if (!value.age || value.age < 0 || value.age > 120) {
        return 'Informe uma idade válida para continuar.';
      }
      if (!value.mainSymptom) {
        return 'Selecione o sintoma principal.';
      }
    }

    if (stepIndex === 1) {
      if (value.fever && !value.temperature) {
        return 'Com febre informada, preencha a temperatura aproximada.';
      }
      if (value.oxygenSaturation && (value.oxygenSaturation < 50 || value.oxygenSaturation > 100)) {
        return 'A saturação deve estar entre 50% e 100%.';
      }
    }

    if (stepIndex === 4) {
      if (!value.symptomDuration) {
        return 'Informe a duração dos sintomas.';
      }
    }

    return '';
  }

  private labelize(value: string): string {
    return value
      .replaceAll('_', ' ')
      .replace('none', 'nenhum')
      .replace('mild', 'leve')
      .replace('moderate', 'moderado')
      .replace('severe', 'intenso');
  }
}
