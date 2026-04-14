import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';

import { TriageAiInput, TriageAiResponse } from '../models/triage.models';
import { environment } from '../../environments/environment';

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

interface GeminiJsonResponse {
  resumo?: unknown;
  nivel_risco?: unknown;
  sinais_alerta?: unknown;
  orientacao?: unknown;
  recomendacao_imediata?: unknown;
  observacoes_importantes?: unknown;
}

@Injectable({ providedIn: 'root' })
export class TriageAiService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = environment.geminiApiKey;
  private readonly model = environment.geminiModel;
  private readonly apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

  generateFinalAnalysis(input: TriageAiInput): Observable<TriageAiResponse> {
    if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY') {
      return throwError(() => new Error('missing_api_key'));
    }

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: this.buildPrompt(input) }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    };

    return this.http
      .post<GeminiGenerateContentResponse>(`${this.apiUrl}?key=${this.apiKey}`, body)
      .pipe(
        map((response) => {
          const rawText = this.extractText(response);
          return this.parseStructuredResponse(rawText);
        })
      );
  }

  toUserMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : '';

    if (message === 'missing_api_key') {
      return 'A chave da API Gemini não foi configurada no ambiente.';
    }

    if (message === 'empty_gemini_response' || message === 'invalid_gemini_payload') {
      return 'A IA não retornou uma análise utilizável no momento.';
    }

    return 'Não foi possível gerar a análise com IA no momento. Revise a triagem local e tente novamente.';
  }

  private buildPrompt(input: TriageAiInput): string {
    return `
Você é um assistente de apoio à pré-triagem clínica.
Analise os dados abaixo com prudência clínica.

Regras obrigatórias:
- Não forneça diagnóstico definitivo.
- Não use linguagem absoluta.
- Indique urgência quando houver sinais graves.
- Reforce que se trata de triagem inicial e não substitui avaliação profissional.
- Se houver forte indicação de risco crítico, mencione a necessidade de emergência imediata.
- Responda somente em JSON válido.

Formato obrigatório:
{
  "resumo": "string",
  "nivel_risco": "baixo|medio|alto|critico",
  "sinais_alerta": ["string"],
  "orientacao": "string",
  "recomendacao_imediata": "string",
  "observacoes_importantes": ["string"]
}

Dados da triagem:
${JSON.stringify(input, null, 2)}
    `.trim();
  }

  private extractText(response: GeminiGenerateContentResponse): string {
    const text = response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new Error(
        response.promptFeedback?.blockReason ? `blocked:${response.promptFeedback.blockReason}` : 'empty_gemini_response'
      );
    }

    return text;
  }

  private parseStructuredResponse(rawText: string): TriageAiResponse {
    const parsed = this.tryParseJson(rawText);

    if (!parsed) {
      return this.buildFallbackFromText(rawText);
    }

    return {
      resumo: this.asText(parsed.resumo, 'Resumo não disponível.'),
      nivel_risco: this.normalizeRisk(parsed.nivel_risco),
      sinais_alerta: this.asStringArray(parsed.sinais_alerta),
      orientacao: this.asText(parsed.orientacao, 'Procure avaliação médica se houver piora clínica.'),
      recomendacao_imediata: this.asText(
        parsed.recomendacao_imediata,
        'Mantenha observação clínica e procure atendimento presencial se necessário.'
      ),
      observacoes_importantes: this.asStringArray(parsed.observacoes_importantes),
      rawText,
      generatedAt: new Date().toISOString()
    };
  }

  private tryParseJson(rawText: string): GeminiJsonResponse | null {
    const normalized = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(normalized) as GeminiJsonResponse;
    } catch {
      return null;
    }
  }

  private buildFallbackFromText(rawText: string): TriageAiResponse {
    return {
      resumo: rawText,
      nivel_risco: 'medio',
      sinais_alerta: [],
      orientacao: 'Revise a triagem local e considere avaliação profissional conforme a evolução clínica.',
      recomendacao_imediata:
        'Se houver sinais de piora, dificuldade respiratória, dor intensa ou confusão, procure atendimento imediatamente.',
      observacoes_importantes: [],
      rawText,
      generatedAt: new Date().toISOString()
    };
  }

  private asText(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  private normalizeRisk(value: unknown): TriageAiResponse['nivel_risco'] {
    if (typeof value !== 'string') {
      return 'medio';
    }

    const normalized = value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    if (normalized === 'baixo' || normalized === 'medio' || normalized === 'alto' || normalized === 'critico') {
      return normalized;
    }

    return 'medio';
  }
}
