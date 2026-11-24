import { Component } from '@angular/core';

@Component({
  selector: 'app-marketing-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class MarketingAboutComponent {
  protected readonly currentYear = new Date().getFullYear();
}
