import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';

import { HistoryEntry, MedicationLookupResult, TriageAiInput, TriageAiResponse, TriageAnswers, TriageResult } from '../models/triage.models';
import { HistoryService } from './history.service';
import { OpenFdaService } from './open-fda.service';
import { TriageAiService } from './triage-ai.service';
import { TriageEngineService } from './triage-engine.service';

@Injectable({ providedIn: 'root' })
export class TriageStateService {
  private readonly engine = inject(TriageEngineService);
  private readonly openFda = inject(OpenFdaService);
  private readonly triageAi = inject(TriageAiService);
  private readonly history = inject(HistoryService);

  private readonly answersSignal = signal<TriageAnswers | null>(null);
  private readonly resultSignal = signal<TriageResult | null>(null);
  private readonly medicationSignal = signal<MedicationLookupResult | null>(null);
  private readonly aiAnalysisSignal = signal<TriageAiResponse | null>(null);
  private readonly aiAnalysisErrorSignal = signal<string | null>(null);
  private readonly latestEntrySignal = signal<HistoryEntry | null>(null);

  readonly answers = computed(() => this.answersSignal());
  readonly result = computed(() => this.resultSignal());
  readonly medicationLookup = computed(() => this.medicationSignal());
  readonly aiAnalysis = computed(() => this.aiAnalysisSignal());
  readonly aiAnalysisError = computed(() => this.aiAnalysisErrorSignal());
  readonly latestEntry = computed(() => this.latestEntrySignal());

  setAnswers(answers: TriageAnswers): void {
    this.answersSignal.set(answers);
  }

  reset(): void {
    this.answersSignal.set(null);
    this.resultSignal.set(null);
    this.medicationSignal.set(null);
    this.aiAnalysisSignal.set(null);
    this.aiAnalysisErrorSignal.set(null);
    this.latestEntrySignal.set(null);
  }

  hydrateFromHistory(entry: HistoryEntry): void {
    this.answersSignal.set(entry.answers);
    this.resultSignal.set(entry.result);
    this.medicationSignal.set(entry.medicationLookup);
    this.aiAnalysisSignal.set(entry.aiAnalysis);
    this.aiAnalysisErrorSignal.set(entry.aiAnalysisError);
    this.latestEntrySignal.set(entry);
  }

  executeAnalysis(): Observable<HistoryEntry> {
    const answers = this.answersSignal();

    if (!answers) {
      return of(this.history.latest()).pipe(
        map((entry) => {
          if (!entry) {
            throw new Error('Nenhuma triagem disponível para analisar.');
          }
          this.hydrateFromHistory(entry);
          return entry;
        })
      );
    }

    const result = this.engine.evaluate(answers);
    this.resultSignal.set(result);

    return this.openFda.lookupMedicationInfo(
      answers.medicationNames || answers.continuousMedication
    ).pipe(
      switchMap((medicationLookup) =>
        this.triageAi.generateFinalAnalysis(this.buildAiInput(answers, result, medicationLookup)).pipe(
          map((aiAnalysis) => ({
            medicationLookup,
            aiAnalysis,
            aiAnalysisError: null
          })),
          catchError((error) =>
            of({
              medicationLookup,
              aiAnalysis: null,
              aiAnalysisError: this.triageAi.toUserMessage(error)
            })
          )
        )
      ),
      map(({ medicationLookup, aiAnalysis, aiAnalysisError }) => {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          answers,
          result,
          medicationLookup,
          aiAnalysis,
          aiAnalysisError
        };

        this.medicationSignal.set(medicationLookup);
        this.aiAnalysisSignal.set(aiAnalysis);
        this.aiAnalysisErrorSignal.set(aiAnalysisError);
        this.latestEntrySignal.set(entry);
        this.history.save(entry);

        return entry;
      })
    );
  }

  private buildAiInput(
    answers: TriageAnswers,
    result: TriageResult,
    medicationLookup: MedicationLookupResult | null
  ): TriageAiInput {
    const observacoesAdicionais = [
      answers.allergies ? `Alergias relevantes: ${answers.allergies}` : '',
      answers.continuousMedication ? `Uso de medicação contínua: ${answers.continuousMedication}` : '',
      answers.medicationNames ? `Medicamentos informados para consulta: ${answers.medicationNames}` : '',
      answers.contactWithSickPerson ? 'Relata contato recente com pessoa doente.' : ''
    ].filter(Boolean);

    return {
      idade: answers.age,
      sexo: answers.sex,
      gestacaoEmAndamento: answers.pregnant,
      sintomaPrincipal: answers.mainSymptom,
      inicioDosSintomas: answers.symptomOnset,
      febre: answers.fever,
      temperatura: answers.temperature,
      tosse: answers.cough,
      faltaDeAr: answers.shortnessOfBreath,
      respiracaoPercebida: answers.breathingQuality,
      saturacao: answers.oxygenSaturation,
      dorNoPeito: answers.chestPain,
      nauseaOuVomito: answers.nauseaOrVomiting,
      diarreia: answers.diarrhea,
      dorDeCabeca: answers.headache,
      tonturaOuDesmaio: answers.dizzinessOrFainting,
      confusaoMental: answers.confusion,
      nivelDeDor: answers.painScale,
      gravidadePercebida: answers.perceivedSeverity,
      duracaoDosSintomas: answers.symptomDuration,
      impactoFuncional: answers.normalActivities,
      comorbidades: answers.preExistingConditions,
      usoDeMedicacaoContinua: answers.continuousMedication,
      medicamentosInformados: answers.medicationNames,
      alergias: answers.allergies,
      contatoComPessoaDoente: answers.contactWithSickPerson,
      observacoesAdicionais,
      scoreCalculadoLocalmente: result.score,
      classificacaoPreliminarLocal: result.level,
      resumoLocal: result.summary,
      justificativaLocal: result.justification,
      sinaisDeEmergenciaLocais: result.emergencyAlerts,
      fatoresDecisivosLocais: result.decisiveFactors,
      consultaMedicamentosPublica: medicationLookup?.queriedMedication ?? null,
      respostasTriagem: {
        idade: answers.age,
        sexo: answers.sex,
        gestacaoEmAndamento: answers.pregnant,
        sintomaPrincipal: answers.mainSymptom,
        inicioDosSintomas: answers.symptomOnset,
        duracaoDosSintomas: answers.symptomDuration,
        febre: answers.fever,
        temperatura: answers.temperature,
        tosse: answers.cough,
        faltaDeAr: answers.shortnessOfBreath,
        respiracaoPercebida: answers.breathingQuality,
        saturacao: answers.oxygenSaturation,
        dorNoPeito: answers.chestPain,
        dorDeCabeca: answers.headache,
        nauseaOuVomito: answers.nauseaOrVomiting,
        diarreia: answers.diarrhea,
        tonturaOuDesmaio: answers.dizzinessOrFainting,
        confusaoMental: answers.confusion,
        nivelDeDor: answers.painScale,
        gravidadePercebida: answers.perceivedSeverity,
        impactoFuncional: answers.normalActivities,
        comorbidades: answers.preExistingConditions,
        usoDeMedicacaoContinua: answers.continuousMedication,
        medicamentosInformados: answers.medicationNames,
        alergias: answers.allergies,
        contatoComPessoaDoente: answers.contactWithSickPerson
      }
    };
  }
}
