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
          <a class="btn btn-primary nav-cta" routerLink="/triage">Iniciar triagem</a>
          <button class="btn btn-ghost nav-logout" type="button" (click)="logout()">Sair</button>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopNavComponent {
  private readonly router = inject(Router);
  private readonly access = inject(PatientAccessService);

  readonly appName = APP_NAME;

  logout(): void {
    this.access.clear();
    void this.router.navigate(['/']);
  }
}
