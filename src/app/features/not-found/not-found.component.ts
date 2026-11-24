import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="kaos-page min-vh-100 d-flex align-items-center justify-content-center py-4">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="kaos-card shadow">
            <div class="kaos-card-body p-5 text-center">
              <h1 class="kaos-text mb-3 display-5">404</h1>
              <p class="kaos-text-secondary mb-4">Page not found</p>
              <p class="kaos-text-secondary mb-5">
                The page you're looking for doesn't exist. It may have been moved or removed.
              </p>
              <a routerLink="/generator/dashboard" class="btn btn-primary">
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotFoundComponent {}
