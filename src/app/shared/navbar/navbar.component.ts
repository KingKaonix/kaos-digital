import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isAuthenticated = false;

  constructor() {
    this.checkAuth();
  }

  private async checkAuth(): Promise<void> {
    const session = await this.auth.getSession();
    this.isAuthenticated = !!session;
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }
}
