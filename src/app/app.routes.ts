import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { GenerateComponent } from './features/generate/generate.component';
import { GalleryComponent } from './features/templates/gallery/gallery.component';
import { TemplateEditComponent } from './features/templates/edit/template-edit.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { MarketingHomeComponent } from './features/marketing/home/home.component';
import { MarketingAboutComponent } from './features/marketing/about/about.component';
import { MarketingServicesComponent } from './features/marketing/services/services.component';
import { MarketingPricingComponent } from './features/marketing/pricing/pricing.component';
import { MarketingProductsComponent } from './features/marketing/products/products.component';
import { MarketingContactComponent } from './features/marketing/contact/contact.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  // Marketing (public) — kaosnet site content integrated at root
  { path: '', component: MarketingHomeComponent },
  { path: 'about', component: MarketingAboutComponent },
  { path: 'services', component: MarketingServicesComponent },
  { path: 'pricing', component: MarketingPricingComponent },
  { path: 'products', component: MarketingProductsComponent },
  { path: 'contact', component: MarketingContactComponent },

  // Auth (shared — site visitors + generator users)
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // Generator (auth-gated) — AI Template Generator under /generator
  {
    path: 'generator',
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'generate', component: GenerateComponent },
      { path: 'gallery', component: GalleryComponent },
      { path: 'templates/:id/edit', component: TemplateEditComponent },
    ],
  },

  { path: '**', component: NotFoundComponent },
];
