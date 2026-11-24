import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { routes } from './app.routes';
import { AppErrorHandler } from './core/app-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: ErrorHandler, useClass: AppErrorHandler }
  ]
};
