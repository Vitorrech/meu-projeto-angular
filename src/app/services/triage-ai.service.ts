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
  nivelRisco?: unknown;
  nivel_risco?: unknown;
  oQueFazerAgora?: unknown;
  o_que_fazer_agora?: unknown;
  cuidadosCaseiros?: unknown;
  cuidados_caseiros?: unknown;
  sinaisDeAlerta?: unknown;
  sinais_alerta?: unknown;
  mensagemFinal?: unknown;
  mensagem_final?: unknown;
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

    return this.http.post<GeminiGenerateContentResponse>(`${this.apiUrl}?key=${this.apiKey}`, body).pipe(
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
      return 'A IA não retornou uma orientação utilizável no momento.';
    }

    return 'Não foi possível gerar a orientação inteligente neste momento.';
  }

  private buildPrompt(input: TriageAiInput): string {
    return `
Você é um assistente de apoio à pré-triagem médica.
Sua função é analisar os dados informados por um paciente em uma triagem inicial e gerar uma orientação educativa, segura e organizada em português do Brasil.

Regras obrigatórias:
- Não forneça diagnóstico definitivo.
- Não use linguagem absoluta.
- Priorize segurança e cautela clínica.
- Deixe claro quando houver necessidade de atendimento urgente ou emergência.
- Considere que esta é uma pré-triagem inicial, não uma consulta médica definitiva.
- Use linguagem compreensível para leigos.
- Responda somente em JSON válido, sem markdown, sem crases e sem texto fora do JSON.

Formato obrigatório:
{
  "resumo": "string",
  "nivelRisco": "baixo|medio|alto|critico",
  "oQueFazerAgora": ["string"],
  "cuidadosCaseiros": ["string"],
  "sinaisDeAlerta": ["string"],
  "mensagemFinal": "string"
}

Instruções para preenchimento:
- "resumo" deve sintetizar o quadro informado pelo paciente e o contexto da pré-triagem.
- "nivelRisco" deve refletir o risco provável com cautela.
- "oQueFazerAgora" deve listar orientações práticas imediatas.
- "cuidadosCaseiros" só deve conter medidas paliativas ou iniciais quando forem seguras.
- "sinaisDeAlerta" deve listar sinais que indicam busca por atendimento médico com urgência.
- "mensagemFinal" deve ser clara, responsável e acolhedora.
- Se não houver cuidado caseiro seguro, retorne um array vazio em "cuidadosCaseiros".

Dados estruturados da triagem:
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

    const oQueFazerAgora = this.uniqueStrings([
      ...this.asStringArray(parsed.oQueFazerAgora ?? parsed.o_que_fazer_agora),
      ...this.asSentenceArray(parsed.recomendacao_imediata),
      ...this.asSentenceArray(parsed.orientacao)
    ]);

    const cuidadosCaseiros = this.uniqueStrings([
      ...this.asStringArray(parsed.cuidadosCaseiros ?? parsed.cuidados_caseiros),
      ...this.asStringArray(parsed.observacoes_importantes)
    ]);

    const sinaisDeAlerta = this.uniqueStrings(
      this.asStringArray(parsed.sinaisDeAlerta ?? parsed.sinais_alerta)
    );

    return {
      resumo: this.asText(parsed.resumo, 'Resumo não disponível.'),
      nivelRisco: this.normalizeRisk(parsed.nivelRisco ?? parsed.nivel_risco),
      oQueFazerAgora:
        oQueFazerAgora.length > 0
          ? oQueFazerAgora
          : ['Observe a evolução dos sintomas e procure avaliação presencial se houver piora.'],
      cuidadosCaseiros,
      sinaisDeAlerta,
      mensagemFinal: this.asText(
        parsed.mensagemFinal ?? parsed.mensagem_final,
        'Esta orientação apoia uma pré-triagem inicial e não substitui avaliação profissional.'
      ),
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
      const jsonSlice = this.extractJsonObject(normalized);
      if (!jsonSlice) {
        return null;
      }

      try {
        return JSON.parse(jsonSlice) as GeminiJsonResponse;
      } catch {
        return null;
      }
    }
  }

  private extractJsonObject(value: string): string | null {
    const start = value.indexOf('{');
    const end = value.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    return value.slice(start, end + 1);
  }

  private buildFallbackFromText(rawText: string): TriageAiResponse {
    return {
      resumo: rawText,
      nivelRisco: 'medio',
      oQueFazerAgora: ['Revise a triagem local e considere avaliação profissional conforme a evolução clínica.'],
      cuidadosCaseiros: [],
      sinaisDeAlerta: [
        'Dificuldade para respirar',
        'Dor intensa ou piora importante dos sintomas',
        'Confusão mental ou desmaio'
      ],
      mensagemFinal:
        'Não foi possível estruturar a orientação inteligente neste momento. Se houver agravamento, procure atendimento médico.',
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

    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
  }

  private asSentenceArray(value: unknown): string[] {
    if (typeof value !== 'string') {
      return [];
    }

    return value
      .split(/\n|(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
  }

  private normalizeRisk(value: unknown): TriageAiResponse['nivelRisco'] {
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
