import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="kaos-page min-vh-100 d-flex align-items-center justify-content-center py-4">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="kaos-card shadow">
            <div class="kaos-card-body p-4">
              <h2 class="card-title text-center kaos-text mb-4">Login</h2>

              @if (errorMessage) {
                <div class="kaos-alert-danger">{{ errorMessage }}</div>
              }

              <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
                <div class="mb-3">
                  <label for="email" class="form-label kaos-text">Email</label>
                  <input
                    type="email"
                    id="email"
                    class="form-control kaos-form-control"
                    [(ngModel)]="email"
                    name="email"
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label kaos-text">Password</label>
                  <input
                    type="password"
                    id="password"
                    class="form-control kaos-form-control"
                    [(ngModel)]="password"
                    name="password"
                    required
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100"
                  [disabled]="isLoading"
                >
                  {{ isLoading ? 'Signing in…' : 'Sign In' }}
                </button>
              </form>

              <p class="text-center mt-3 kaos-text-secondary">
                Don't have an account? <a routerLink="/signup" class="kaos-link">Sign up</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage: string | null = null;
  isLoading = false;

  async onSubmit(): Promise<void> {
    this.errorMessage = null;
    this.isLoading = true;

    const result = await this.auth.signIn({
      email: this.email,
      password: this.password,
    });

    this.isLoading = false;

    if (result.error) {
      this.errorMessage = result.error;
      return;
    }

    this.router.navigate(['/generator/dashboard']);
  }
}
