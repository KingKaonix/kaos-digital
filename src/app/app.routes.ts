import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

// Phase 8: kaosnet-site marketing routes (single-page landing with anchor sections).
// Phase 9 will replace these with dedicated components and wire /generator to the
// AI Template Generator app.
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'services', component: HomeComponent },
  { path: 'about', component: HomeComponent },
  { path: 'contact', component: HomeComponent },
  { path: 'generator', component: HomeComponent }, // placeholder; wired to generator in Phase 9
  { path: '**', component: HomeComponent },
];
