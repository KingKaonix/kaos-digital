import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  protected readonly currentYear = new Date().getFullYear();

  onSubmit(event: Event): void {
    event.preventDefault();
    alert('Thanks! We\'ll be in touch within 24 hours.');
    (event.target as HTMLFormElement).reset();
  }
}
