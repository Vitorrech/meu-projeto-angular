import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PatientAccessService } from '../services/patient-access.service';

@Component({
  selector: 'app-access-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="access-page container">
      <div class="access-stage">
        <article class="access-card surface-card">
          <div class="access-copy">
            <span class="access-badge">Triagem inteligente com segurança clínica</span>
            <h1>Acesso seguro à sua triagem.</h1>
            <p class="access-subtitle">
              Inicie o atendimento com uma identificação simples, precisa e desenhada para manter a
              experiência clara desde o primeiro toque.
            </p>
          </div>

          <form class="access-form" (ngSubmit)="continue()" novalidate>
            <label class="access-field" for="cpf">
              <span>CPF do paciente</span>
              <input
                id="cpf"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                maxlength="14"
                placeholder="000.000.000-00"
                [formControl]="cpfControl"
                (input)="onCpfInput()"
                (keydown.enter)="handleEnter($event)"
              />
            </label>

            <div class="access-form-footer">
              <p class="access-privacy">
                Seus dados são utilizados apenas para iniciar a triagem com segurança.
              </p>

              <button class="btn btn-primary access-submit" type="submit" [disabled]="!isCpfReady()">
                Continuar
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessPageComponent {
  private readonly router = inject(Router);
  private readonly access = inject(PatientAccessService);

  readonly cpfControl = new FormControl(this.access.cpf(), {
    nonNullable: true
  });

  onCpfInput(): void {
    const formatted = this.formatCpf(this.cpfControl.value);
    if (formatted !== this.cpfControl.value) {
      this.cpfControl.setValue(formatted, { emitEvent: false });
    }
  }

  isCpfReady(): boolean {
    return this.cpfDigits().length === 11;
  }

  continue(): void {
    this.onCpfInput();

    if (!this.isCpfReady()) {
      this.cpfControl.markAsTouched();
      return;
    }

    this.access.setCpf(this.cpfControl.value);
    void this.router.navigate(['/triage']);
  }

  handleEnter(event: Event): void {
    event.preventDefault();
    this.continue();
  }

  private cpfDigits(): string {
    return this.cpfControl.value.replace(/\D/g, '').slice(0, 11);
  }

  private formatCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
}
