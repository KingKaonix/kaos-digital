import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  template: `
    <div class="kaos-page mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="kaos-card shadow">
            <div class="kaos-card-body p-4">
              <h2 class="card-title kaos-text mb-4">Dashboard</h2>
              <p class="kaos-text-secondary">Welcome back, {{ userEmail }}</p>
              <hr class="kaos-text-secondary" />
              <p class="kaos-text-secondary">
                Your generated templates will appear here. Use the navigation to
                create and manage templates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  userEmail: string = 'User';

  async ngOnInit(): Promise<void> {
    const session = await this.auth.getSession();
    if (!session) {
      this.router.navigate(['/login']);
      return;
    }
    this.userEmail = session.user?.email ?? 'User';
  }
}
