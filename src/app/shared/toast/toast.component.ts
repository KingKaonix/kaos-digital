import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/toast.service';

/**
 * ToastComponent
 *
 * Renders active toasts from ToastService as a fixed stack at the bottom-right
 * of the screen. Bootstrap 5 styling; no Bootstrap JS required (dismissal is
 * handled by the service timers / action callbacks).
 *
 * Never throws: removal is a filtered signal update.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1060;">
      <div
        *ngFor="let toast of toastService.list()"
        class="toast show align-items-center kaos-card"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        [class.border-success]="toast.type === 'success'"
        [class.border-danger]="toast.type === 'error'"
        [class.border-info]="toast.type === 'info'"
        [class.border-warning]="toast.type === 'warning'"
        [class.text-white]="true"
      >
        <div class="d-flex w-100">
          <div class="toast-body kaos-text">
            {{ toast.message }}
          </div>
          @if (toast.action) {
            <button
              type="button"
              class="btn btn-sm btn-light mt-2 mt-md-0 ms-md-2 kaos-text"
              (click)="executeAction(toast)"
            >
              {{ toast.action.label }}
            </button>
          }
          <button
            type="button"
            class="btn-close btn-close-white ms-auto"
            (click)="dismiss(toast.id)"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  dismiss(id: number): void {
    this.toastService.remove(id);
  }

  executeAction(toast: import('../../core/toast.service').Toast): void {
    toast.action?.callback();
    this.dismiss(toast.id);
  }
}
