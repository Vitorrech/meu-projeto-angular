import { Injectable } from '@angular/core';

import { RISK_COPY } from '../constants/triage.constants';
import { Recommendation, RiskFactor, RiskLevel, TriageAnswers, TriageResult } from '../models/triage.models';

@Injectable({ providedIn: 'root' })
export class TriageEngineService {
  evaluate(answers: TriageAnswers): TriageResult {
    let score = 0;
    const factors: RiskFactor[] = [];
    const alerts: string[] = [];

    const addFactor = (
      label: string,
      description: string,
      weight: number,
      severity: RiskFactor['severity']
    ): void => {
      score += weight;
      factors.push({ label, description, weight, severity });
    };

    const hasCondition = (...terms: string[]): boolean =>
      answers.preExistingConditions.some((condition) =>
        terms.some((term) => condition.toLowerCase().includes(term.toLowerCase()))
      );

    if (answers.age >= 75) {
      addFactor('Idade avançada', 'Paciente com 75 anos ou mais.', 5, 'high');
    } else if (answers.age >= 60 || answers.age <= 5) {
      addFactor('Faixa etária sensível', 'Extremos de idade aumentam vulnerabilidade.', 3, 'attention');
    }

    if (answers.pregnant) {
      addFactor('Gestação', 'Gestação exige avaliação mais cautelosa.', 2, 'attention');
    }

    if (answers.preExistingConditions.length > 0) {
      const weight = Math.min(6, answers.preExistingConditions.length * 2);
      addFactor(
        'Condições pré-existentes',
        `Há ${answers.preExistingConditions.length} condição(ões) de base informada(s).`,
        weight,
        weight >= 4 ? 'high' : 'attention'
      );
    }

    if (answers.fever) {
      addFactor('Febre referida', 'Foi informada presença de febre.', 2, 'attention');
      if ((answers.temperature ?? 0) >= 39) {
        addFactor('Febre alta', 'Temperatura aproximada acima de 39°C.', 5, 'high');
      } else if ((answers.temperature ?? 0) >= 38) {
        addFactor('Temperatura elevada', 'Temperatura aproximada acima de 38°C.', 3, 'attention');
      }
    }

    if (answers.shortnessOfBreath === 'mild') {
      addFactor('Falta de ar leve', 'Desconforto respiratório leve relatado.', 3, 'attention');
    }
    if (answers.shortnessOfBreath === 'moderate') {
      addFactor('Falta de ar moderada', 'Respiração comprometida em nível moderado.', 6, 'high');
    }
    if (answers.shortnessOfBreath === 'severe') {
      addFactor('Falta de ar intensa', 'Dificuldade respiratória importante.', 9, 'critical');
      alerts.push('Falta de ar intensa exige avaliação emergencial imediata.');
    }

    if (answers.breathingQuality === 'muito_ruim') {
      addFactor('Respiração muito ruim', 'Sensação de respiração bastante comprometida.', 6, 'high');
    }
    if (answers.breathingQuality === 'saturacao_baixa') {
      addFactor('Saturação preocupante', 'Relato de saturação baixa ou sensação respiratória muito ruim.', 8, 'critical');
      alerts.push('Saturação baixa é um sinal de alarme respiratório.');
    }
    if ((answers.oxygenSaturation ?? 100) <= 90) {
      addFactor('Oximetria crítica', 'Saturação informada igual ou abaixo de 90%.', 10, 'critical');
      alerts.push('Saturação igual ou abaixo de 90% sugere urgência médica.');
    } else if ((answers.oxygenSaturation ?? 100) <= 94) {
      addFactor('Oximetria reduzida', 'Saturação informada entre 91% e 94%.', 6, 'high');
    }

    if (answers.chestPain === 'mild') {
      addFactor('Dor no peito leve', 'Desconforto torácico leve informado.', 3, 'attention');
    }
    if (answers.chestPain === 'moderate') {
      addFactor('Dor no peito moderada', 'Dor torácica moderada precisa de avaliação breve.', 6, 'high');
    }
    if (answers.chestPain === 'severe') {
      addFactor('Dor no peito intensa', 'Dor torácica intensa é um sinal relevante.', 9, 'critical');
      alerts.push('Dor no peito intensa pode representar situação grave.');
    }

    if (answers.dizzinessOrFainting === 'tontura') {
      addFactor('Tontura', 'Foi relatada tontura associada ao quadro.', 3, 'attention');
    }
    if (answers.dizzinessOrFainting === 'desmaio') {
      addFactor('Desmaio', 'Relato de desmaio aumenta gravidade potencial.', 10, 'critical');
      alerts.push('Desmaio requer atendimento emergencial imediato.');
    }

    if (answers.confusion) {
      addFactor('Confusão mental', 'Alteração do estado mental informada.', 10, 'critical');
      alerts.push('Confusão mental é sinal de alerta importante.');
    }

    if (answers.painScale >= 9) {
      addFactor('Dor intensa', 'Escala de dor muito alta.', 6, 'high');
    } else if (answers.painScale >= 6) {
      addFactor('Dor moderada/importante', 'Escala de dor intermediária.', 3, 'attention');
    }

    if (answers.cough === 'produtiva') {
      addFactor('Tosse produtiva', 'Tosse com secreção relatada.', 2, 'attention');
    }
    if (answers.cough === 'com_sangue') {
      addFactor('Tosse com sangue', 'Hemoptise é sinal de alerta respiratório.', 8, 'critical');
      alerts.push('Tosse com sangue deve ser avaliada rapidamente.');
    }

    if (answers.nauseaOrVomiting === 'vomiting') {
      addFactor('Vômitos', 'Presença de vômitos aumenta risco de desidratação.', 3, 'attention');
    }
    if (answers.nauseaOrVomiting === 'persistent') {
      addFactor('Vômitos persistentes', 'Persistência do sintoma sugere maior gravidade.', 5, 'high');
    }

    if (answers.diarrhea === 'moderate') {
      addFactor('Diarreia moderada', 'Quadro gastrointestinal com impacto moderado.', 2, 'attention');
    }
    if (answers.diarrhea === 'severe') {
      addFactor('Diarreia intensa', 'Risco de desidratação e piora funcional.', 4, 'high');
    }

    if (answers.headache === 'severe') {
      addFactor('Dor de cabeça intensa', 'Cefaleia intensa precisa de correlação com outros sinais.', 3, 'attention');
    } else if (answers.headache === 'moderate') {
      addFactor('Dor de cabeça moderada', 'Sintoma sistêmico em intensidade intermediária.', 1, 'attention');
    }

    if (answers.symptomDuration === '4_7_dias') {
      addFactor('Duração prolongada', 'Sintomas persistem por mais de 4 dias.', 2, 'attention');
    }
    if (answers.symptomDuration === 'mais_7_dias') {
      addFactor('Duração extensa', 'Sintomas com mais de 7 dias de evolução.', 4, 'high');
    }

    if (answers.perceivedSeverity >= 5) {
      addFactor('Gravidade percebida muito alta', 'Paciente percebe o quadro como muito grave.', 4, 'high');
    } else if (answers.perceivedSeverity >= 4) {
      addFactor('Gravidade percebida alta', 'Paciente relata preocupação relevante.', 2, 'attention');
    }

    if (answers.normalActivities === 'muito_limitadas') {
      addFactor('Limitação funcional importante', 'Atividades diárias muito reduzidas.', 4, 'high');
    }
    if (answers.normalActivities === 'incapaz') {
      addFactor('Incapacidade funcional', 'Paciente relata incapacidade para atividades normais.', 7, 'critical');
      alerts.push('Incapacidade funcional importante sugere urgência clínica.');
    }

    if (
      (answers.chestPain === 'moderate' || answers.chestPain === 'severe') &&
      (answers.shortnessOfBreath === 'moderate' || answers.shortnessOfBreath === 'severe')
    ) {
      addFactor(
        'Combinação cardiorrespiratória',
        'Dor no peito associada a falta de ar eleva significativamente o risco.',
        10,
        'critical'
      );
      alerts.push('Dor no peito associada à falta de ar indica risco muito elevado.');
    }

    if (
      answers.fever &&
      (answers.temperature ?? 0) >= 38.5 &&
      answers.preExistingConditions.length > 0 &&
      (answers.symptomDuration === '4_7_dias' || answers.symptomDuration === 'mais_7_dias')
    ) {
      addFactor(
        'Febre persistente com comorbidade',
        'Febre alta associada a comorbidades e evolução prolongada.',
        6,
        'high'
      );
    }

    if (
      answers.symptomOnset === 'subito' &&
      (answers.chestPain !== 'none' ||
        answers.shortnessOfBreath === 'severe' ||
        answers.dizzinessOrFainting === 'desmaio')
    ) {
      addFactor(
        'Início súbito com sinal maior',
        'Sintomas de início abrupto associados a alerta clínico.',
        5,
        'critical'
      );
    }

    if (
      answers.age >= 60 &&
      (answers.shortnessOfBreath === 'moderate' || answers.shortnessOfBreath === 'severe')
    ) {
      addFactor(
        'Idade + sintoma respiratório',
        'Sintoma respiratório relevante em paciente mais vulnerável.',
        5,
        'high'
      );
    }

    if (
      hasCondition('cardio', 'hipertensão', 'diabetes', 'pulmonar', 'asma') &&
      (answers.shortnessOfBreath !== 'none' || answers.chestPain !== 'none')
    ) {
      addFactor(
        'Comorbidade com sintoma cardiorrespiratório',
        'Condição prévia amplifica risco diante de queixa respiratória ou torácica.',
        4,
        'high'
      );
    }

    if (
      answers.nauseaOrVomiting === 'persistent' &&
      (answers.diarrhea === 'moderate' || answers.diarrhea === 'severe')
    ) {
      addFactor(
        'Perda gastrointestinal combinada',
        'Vômitos persistentes com diarreia aumentam risco de desidratação.',
        4,
        'high'
      );
    }

    const sortedFactors = factors.sort((left, right) => right.weight - left.weight);
    const topFactors = sortedFactors.slice(0, 4);
    const criticalSignals = sortedFactors.some((factor) => factor.severity === 'critical');

    const level = this.calculateLevel(score, criticalSignals || alerts.length > 0);
    const copy = RISK_COPY[level];
    const recommendations = this.mergeRecommendations(copy.recommendations, alerts);

    return {
      level,
      score,
      summary: copy.title,
      explanation: copy.description,
      justification: this.buildJustification(topFactors, level),
      riskFactors: sortedFactors,
      recommendations,
      emergencyAlerts: alerts,
      decisiveFactors: topFactors.map((factor) => factor.label),
      generatedAt: new Date().toISOString()
    };
  }

  private calculateLevel(score: number, hasCriticalSignals: boolean): RiskLevel {
    if (hasCriticalSignals || score >= 28) {
      return 'CRITICO';
    }
    if (score >= 18) {
      return 'ALTO';
    }
    if (score >= 9) {
      return 'MEDIO';
    }
    return 'BAIXO';
  }

  private mergeRecommendations(
    recommendations: Recommendation[],
    alerts: string[]
  ): Recommendation[] {
    if (alerts.length === 0) {
      return recommendations;
    }

    return [
      ...recommendations,
      {
        title: 'Sinais prioritários identificados',
        detail: alerts[0],
        emphasis: 'danger'
      }
    ];
  }

  private buildJustification(factors: RiskFactor[], level: RiskLevel): string {
    if (factors.length === 0 && level === 'BAIXO') {
      return 'Os sintomas relatados parecem leves, sem fatores agravantes dominantes na análise inicial.';
    }

    const labels = factors.map((factor) => factor.label.toLowerCase()).join(', ');
    return `A classificação ${level.toLowerCase()} foi influenciada principalmente por ${labels}.`;
  }
}
