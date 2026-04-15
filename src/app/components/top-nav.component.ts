import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { APP_NAME } from '../constants/triage.constants';
import { PatientAccessService } from '../services/patient-access.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="top-nav">
      <div class="container nav-inner">
        <a class="brand" routerLink="/overview">
          <span class="brand-mark">+</span>
          <span>
            <strong>{{ appName }}</strong>
            <small>Triagem médica inteligente</small>
          </span>
        </a>

        <nav class="nav-links" aria-label="Navegação principal">
          <a routerLink="/overview" routerLinkActive="active">Visão geral</a>
          <a routerLink="/triage" routerLinkActive="active">Triagem</a>
          <a routerLink="/history" routerLinkActive="active">Histórico</a>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        </nav>

        <div class="nav-actions">
          <button class="btn btn-primary nav-cta" type="button" (click)="startTriage()">Iniciar triagem</button>
          <button class="btn btn-ghost nav-logout" type="button" (click)="logout()">Sair</button>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopNavComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly access = inject(PatientAccessService);

  readonly appName = APP_NAME;

  startTriage(): void {
    if (this.router.url.startsWith('/triage')) {
      this.document.getElementById('triage-form-start')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      return;
    }

    void this.router.navigate(['/triage']);
  }

  logout(): void {
    this.access.clear();
    void this.router.navigate(['/']);
  }
}
