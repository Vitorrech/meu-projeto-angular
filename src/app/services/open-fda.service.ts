import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { MedicationLookupResult } from '../models/triage.models';

interface OpenFdaResponse {
  results?: Array<{
    openfda?: {
      brand_name?: string[];
      generic_name?: string[];
    };
    warnings?: string[];
    adverse_reactions?: string[];
    indications_and_usage?: string[];
  }>;
}

@Injectable({ providedIn: 'root' })
export class OpenFdaService {
  private readonly http = inject(HttpClient);

  lookupMedicationInfo(input: string): Observable<MedicationLookupResult | null> {
    const normalized = input
      .split(',')
      .map((term) => term.trim())
      .filter(Boolean)[0];

    if (!normalized) {
      return of(null);
    }

    const encoded = encodeURIComponent(
      `openfda.brand_name:"${normalized}" openfda.generic_name:"${normalized}"`
    );
    const url = `https://api.fda.gov/drug/label.json?search=${encoded}&limit=1`;

    return this.http.get<OpenFdaResponse>(url).pipe(
      map((response) => {
        const item = response.results?.[0];

        if (!item) {
          return {
            queriedMedication: normalized,
            status: 'unavailable',
            brandNames: [],
            warnings: [],
            adverseReactions: [],
            purpose: [],
            message:
              'Nenhuma informação pública adicional foi localizada no openFDA para o medicamento informado.'
          } satisfies MedicationLookupResult;
        }

        return {
          queriedMedication: normalized,
          status: 'success',
          labelTitle: item.openfda?.generic_name?.[0] ?? normalized,
          brandNames: item.openfda?.brand_name ?? [],
          warnings: (item.warnings ?? []).slice(0, 3),
          adverseReactions: (item.adverse_reactions ?? []).slice(0, 3),
          purpose: (item.indications_and_usage ?? []).slice(0, 2),
          sourceUrl: `https://api.fda.gov/drug/label.json?search=${encoded}&limit=1`
        } satisfies MedicationLookupResult;
      }),
      catchError(() =>
        of({
          queriedMedication: normalized,
          status: 'unavailable',
          brandNames: [],
          warnings: [],
          adverseReactions: [],
          purpose: [],
          message:
            'A consulta pública complementar está indisponível no momento. A triagem principal segue normalmente.'
        } satisfies MedicationLookupResult)
      )
    );
  }
}
