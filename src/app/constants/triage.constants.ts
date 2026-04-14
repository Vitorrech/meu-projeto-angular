import { Recommendation, RiskLevel } from '../models/triage.models';

export const APP_NAME = 'MedFlow AI';

export const HERO_METRICS = [
  { value: '4 níveis', label: 'Classificação clínica inicial' },
  { value: '20 perguntas', label: 'Triagem estruturada e responsiva' },
  { value: 'openFDA', label: 'Consulta pública complementar de medicamentos' }
];

export const BENEFITS = [
  {
    title: 'Triagem assistida por IA',
    description:
      'Motor clínico baseado em score ponderado, sinais de alarme e combinações de sintomas.'
  },
  {
    title: 'Experiência premium',
    description:
      'Fluxo em etapas com microinterações, validação contextual e resultado apresentado como produto real.'
  },
  {
    title: 'Pronto para apresentação',
    description:
      'Histórico local, dashboard analítico, exportação para PDF/impressão e integração pública desacoplada.'
  }
];

export const HOW_IT_WORKS = [
  'Você informa sintomas, intensidade, duração, condições pré-existentes e impacto funcional.',
  'O motor avalia pesos clínicos, sinais críticos e fatores agravantes em tempo real.',
  'A plataforma entrega uma classificação inicial com justificativa clara, alertas e conduta sugerida.'
];

export const PRE_EXISTING_OPTIONS = [
  'Hipertensão arterial',
  'Diabetes',
  'Cardiopatia',
  'Doença pulmonar crônica',
  'Asma',
  'Imunossupressão',
  'Doença renal',
  'Obesidade',
  'Câncer em tratamento'
];

export const MAIN_SYMPTOM_OPTIONS = [
  'Febre e mal-estar',
  'Falta de ar',
  'Dor no peito',
  'Tosse persistente',
  'Dor abdominal',
  'Dor de cabeça',
  'Náusea ou vômito',
  'Diarreia',
  'Tontura ou desmaio',
  'Outro sintoma relevante'
];

export const TRIAGE_STEPS = [
  {
    title: 'Perfil clínico',
    description: 'Identificação básica e contexto do paciente.',
    fields: ['age', 'sex', 'pregnant', 'mainSymptom', 'symptomOnset']
  },
  {
    title: 'Sinais respiratórios',
    description: 'Respiração, febre, dor torácica e manifestações associadas.',
    fields: [
      'fever',
      'temperature',
      'shortnessOfBreath',
      'breathingQuality',
      'oxygenSaturation',
      'chestPain',
      'cough'
    ]
  },
  {
    title: 'Sintomas sistêmicos',
    description: 'Sintomas neurológicos, dor e sinais gastrointestinais.',
    fields: [
      'dizzinessOrFainting',
      'confusion',
      'painScale',
      'headache',
      'nauseaOrVomiting',
      'diarrhea'
    ]
  },
  {
    title: 'Histórico e risco',
    description: 'Condições de base, medicamentos e fatores adicionais.',
    fields: [
      'preExistingConditions',
      'continuousMedication',
      'medicationNames',
      'allergies',
      'contactWithSickPerson'
    ]
  },
  {
    title: 'Impacto funcional',
    description: 'Duração, gravidade percebida e capacidade para atividades normais.',
    fields: ['symptomDuration', 'perceivedSeverity', 'normalActivities']
  },
  {
    title: 'Revisão final',
    description: 'Confira as informações antes de iniciar a análise.',
    fields: []
  }
] as const;

export const ANALYSIS_STAGES = [
  'Analisando sinais informados...',
  'Cruzando fatores de risco...',
  'Verificando combinações cardiorrespiratórias...',
  'Consultando contexto medicamentoso público...',
  'Gerando classificação inicial...'
];

export const RISK_COPY: Record<
  RiskLevel,
  {
    accent: string;
    title: string;
    description: string;
    recommendations: Recommendation[];
  }
> = {
  BAIXO: {
    accent: 'positive',
    title: 'Risco inicial baixo',
    description:
      'O conjunto de respostas sugere quadro aparentemente estável, sem sinais críticos predominantes.',
    recommendations: [
      { title: 'Monitorar sintomas', detail: 'Observe evolução nas próximas horas e dias.' },
      { title: 'Repouso e hidratação', detail: 'Mantenha autocuidado e suporte básico domiciliar.' },
      {
        title: 'Buscar avaliação se piorar',
        detail: 'Procure atendimento se surgirem novos sinais de alerta.',
        emphasis: 'warning'
      }
    ]
  },
  MEDIO: {
    accent: 'attention',
    title: 'Risco inicial moderado',
    description:
      'Existem fatores que merecem avaliação médica breve e observação cuidadosa de agravamento.',
    recommendations: [
      {
        title: 'Buscar avaliação médica em breve',
        detail: 'Idealmente no mesmo dia ou conforme disponibilidade de atendimento.'
      },
      {
        title: 'Observar agravamento',
        detail: 'Fique atento a piora da respiração, dor intensa, febre persistente ou limitação funcional.',
        emphasis: 'warning'
      },
      {
        title: 'Não usar como diagnóstico',
        detail: 'Esta análise é apenas suporte inicial e não substitui profissional de saúde.'
      }
    ]
  },
  ALTO: {
    accent: 'high',
    title: 'Risco inicial alto',
    description:
      'Há combinação de sintomas e fatores agravantes que indicam necessidade de atendimento rápido.',
    recommendations: [
      {
        title: 'Procurar atendimento rapidamente',
        detail: 'Evite esperar por melhora espontânea quando houver piora clínica persistente.',
        emphasis: 'danger'
      },
      {
        title: 'Ir acompanhado se possível',
        detail: 'Leve informações sobre comorbidades e medicações de uso contínuo.'
      },
      {
        title: 'Observar sinais de emergência',
        detail: 'Se aparecer desmaio, confusão, dor torácica intensa ou respiração muito ruim, vá ao pronto atendimento.'
      }
    ]
  },
  CRITICO: {
    accent: 'critical',
    title: 'Risco inicial crítico',
    description:
      'Os sinais informados sugerem situação potencialmente grave, com necessidade de assistência emergencial.',
    recommendations: [
      {
        title: 'Procurar atendimento emergencial imediatamente',
        detail: 'Considere serviço de urgência ou pronto-socorro sem demora.',
        emphasis: 'danger'
      },
      {
        title: 'Não permanecer sozinho',
        detail: 'Se possível, acione familiar, acompanhante ou serviço de emergência.'
      },
      {
        title: 'Levar histórico clínico',
        detail: 'Informe sintomas principais, horário de início e medicamentos em uso.'
      }
    ]
  }
};
