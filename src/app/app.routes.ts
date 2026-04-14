import { Routes } from '@angular/router';

import { DashboardPageComponent } from './pages/dashboard-page.component';
import { HistoryPageComponent } from './pages/history-page.component';
import { AccessPageComponent } from './pages/access-page.component';
import { LandingPageComponent } from './pages/landing-page.component';
import { ProcessingPageComponent } from './pages/processing-page.component';
import { ResultPageComponent } from './pages/result-page.component';
import { TriagePageComponent } from './pages/triage-page.component';

export const routes: Routes = [
  {
    path: '',
    component: AccessPageComponent,
    title: 'MedFlow AI | Acesso Seguro'
  },
  {
    path: 'overview',
    component: LandingPageComponent,
    title: 'MedFlow AI | Visão Geral'
  },
  {
    path: 'triage',
    component: TriagePageComponent,
    title: 'Nova Triagem | MedFlow AI'
  },
  {
    path: 'processing',
    component: ProcessingPageComponent,
    title: 'Analisando | MedFlow AI'
  },
  {
    path: 'result',
    component: ResultPageComponent,
    title: 'Resultado da Triagem | MedFlow AI'
  },
  {
    path: 'history',
    component: HistoryPageComponent,
    title: 'Histórico | MedFlow AI'
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    title: 'Dashboard | MedFlow AI'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
