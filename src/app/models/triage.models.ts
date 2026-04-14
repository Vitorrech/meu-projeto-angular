export type RiskLevel = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type BiologicalSex = 'feminino' | 'masculino' | 'outro' | 'nao_informado';
export type BreathingLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type BreathingQuality = 'normal' | 'desconforto' | 'muito_ruim' | 'saturacao_baixa';
export type ChestPainLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type DizzinessLevel = 'none' | 'tontura' | 'desmaio';
export type CoughType = 'none' | 'seca' | 'produtiva' | 'com_sangue';
export type DigestiveLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'vomiting' | 'persistent';
export type HeadacheLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type SymptomDuration = 'menos_24h' | '1_3_dias' | '4_7_dias' | 'mais_7_dias';
export type SymptomOnset = 'subito' | 'gradual';
export type FunctionalCapacity = 'normal' | 'reduzidas' | 'muito_limitadas' | 'incapaz';

export interface PatientInfo {
  age: number;
  sex: BiologicalSex;
  pregnant: boolean;
  preExistingConditions: string[];
  allergies: string;
  continuousMedication: string;
}

export interface SymptomsForm {
  mainSymptom: string;
  fever: boolean;
  temperature: number | null;
  shortnessOfBreath: BreathingLevel;
  breathingQuality: BreathingQuality;
  chestPain: ChestPainLevel;
  dizzinessOrFainting: DizzinessLevel;
  confusion: boolean;
  painScale: number;
  symptomDuration: SymptomDuration;
  cough: CoughType;
  nauseaOrVomiting: DigestiveLevel;
  diarrhea: DigestiveLevel;
  headache: HeadacheLevel;
  perceivedSeverity: number;
  symptomOnset: SymptomOnset;
  normalActivities: FunctionalCapacity;
  contactWithSickPerson: boolean;
  oxygenSaturation: number | null;
  medicationNames: string;
}

export interface TriageAnswers extends PatientInfo, SymptomsForm {}

export interface RiskFactor {
  label: string;
  description: string;
  weight: number;
  severity: 'positive' | 'attention' | 'high' | 'critical';
}

export interface Recommendation {
  title: string;
  detail: string;
  emphasis?: 'neutral' | 'warning' | 'danger';
}

export interface TriageResult {
  level: RiskLevel;
  score: number;
  summary: string;
  explanation: string;
  justification: string;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  emergencyAlerts: string[];
  decisiveFactors: string[];
  generatedAt: string;
}

export interface MedicationLookupResult {
  queriedMedication: string;
  status: 'success' | 'unavailable';
  labelTitle?: string;
  brandNames: string[];
  warnings: string[];
  adverseReactions: string[];
  purpose: string[];
  sourceUrl?: string;
  message?: string;
}

export interface TriageAiInput {
  idade: number;
  sexo: BiologicalSex;
  gestacaoEmAndamento: boolean;
  sintomaPrincipal: string;
  inicioDosSintomas: SymptomOnset;
  febre: boolean;
  temperatura: number | null;
  tosse: CoughType;
  faltaDeAr: BreathingLevel;
  respiracaoPercebida: BreathingQuality;
  saturacao: number | null;
  dorNoPeito: ChestPainLevel;
  nauseaOuVomito: DigestiveLevel;
  diarreia: DigestiveLevel;
  dorDeCabeca: HeadacheLevel;
  tonturaOuDesmaio: DizzinessLevel;
  confusaoMental: boolean;
  nivelDeDor: number;
  gravidadePercebida: number;
  duracaoDosSintomas: SymptomDuration;
  impactoFuncional: FunctionalCapacity;
  comorbidades: string[];
  usoDeMedicacaoContinua: string;
  medicamentosInformados: string;
  alergias: string;
  contatoComPessoaDoente: boolean;
  observacoesAdicionais: string[];
  scoreCalculadoLocalmente: number;
  classificacaoPreliminarLocal: RiskLevel;
  resumoLocal: string;
  justificativaLocal: string;
  sinaisDeEmergenciaLocais: string[];
  fatoresDecisivosLocais: string[];
  consultaMedicamentosPublica: string | null;
}

export interface TriageAiResponse {
  resumo: string;
  nivel_risco: 'baixo' | 'medio' | 'alto' | 'critico';
  sinais_alerta: string[];
  orientacao: string;
  recomendacao_imediata: string;
  observacoes_importantes: string[];
  rawText: string;
  generatedAt: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  answers: TriageAnswers;
  result: TriageResult;
  medicationLookup: MedicationLookupResult | null;
  aiAnalysis: TriageAiResponse | null;
  aiAnalysisError: string | null;
}
