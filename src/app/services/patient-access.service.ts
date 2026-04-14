import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const ACCESS_STORAGE_KEY = 'medflow-ai-patient-access';

@Injectable({ providedIn: 'root' })
export class PatientAccessService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly cpfSignal = signal('');

  readonly cpf = computed(() => this.cpfSignal());

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.cpfSignal.set(localStorage.getItem(ACCESS_STORAGE_KEY) ?? '');
  }

  setCpf(cpf: string): void {
    this.cpfSignal.set(cpf);

    if (this.isBrowser) {
      localStorage.setItem(ACCESS_STORAGE_KEY, cpf);
    }
  }

  clear(): void {
    this.cpfSignal.set('');

    if (this.isBrowser) {
      localStorage.removeItem(ACCESS_STORAGE_KEY);
    }
  }
}
