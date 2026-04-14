import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { FooterComponent } from './components/footer.component';
import { TopNavComponent } from './components/top-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent, FooterComponent],
  template: `
    <div class="app-shell">
      @if (!isAccessRoute()) {
        <app-top-nav />
      }

      <main class="page-shell" [class.access-shell]="isAccessRoute()">
        <router-outlet />
      </main>

      @if (!isAccessRoute()) {
        <app-footer />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isAccessRoute = computed(() => this.currentUrl() === '/');
}
