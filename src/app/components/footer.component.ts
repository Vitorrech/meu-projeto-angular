import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <h3>MedFlow AI</h3>
          <p>
            Esta plataforma realiza uma avaliação inicial assistida por inteligência computacional e
            não substitui diagnóstico médico.
          </p>
        </div>

        <div class="footer-links">
          <a routerLink="/triage">Nova triagem</a>
          <a routerLink="/history">Histórico local</a>
          <a routerLink="/dashboard">Painel analítico</a>
        </div>

        <div class="footer-alert">
          <strong>Aviso legal</strong>
          <p>Em caso de emergência, procure atendimento imediatamente.</p>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {}
