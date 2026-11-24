import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-marketing-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class MarketingContactComponent {
  protected readonly currentYear = new Date().getFullYear();

  onSubmit(event: Event): void {
    event.preventDefault();
    alert('Thanks! We\'ll be in touch within 24 hours.');
    (event.target as HTMLFormElement).reset();
  }
}
