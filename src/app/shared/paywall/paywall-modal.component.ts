import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * PaywallModalComponent
 *
 * Shown when a free user attempts a paid action (export). Presents the upsell
 * and an "Upgrade" button that navigates to the pricing page. Emits upgrade
 * so the parent can react if desired.
 */
@Component({
  selector: 'app-paywall-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paywall-modal.component.html',
  styles: []
})
export class PaywallModalComponent {
  private readonly router = inject(Router);

  /** Whether the modal is visible. */
  readonly visible = signal(false);

  /** The paywalled action being attempted (e.g. 'export', 'download-zip'). */
  action = signal<string>('export');

  /** Optional reason the user is not entitled (e.g. 'no active subscription'). */
  reason = signal<string | undefined>(undefined);

  @Output() upgrade = new EventEmitter<void>();

  /** Open the modal for the given action. */
  open(action?: string, reason?: string): void {
    this.action.set(action ?? 'export');
    this.reason.set(reason);
    this.visible.set(true);
  }

  /** Close the modal. */
  close(): void {
    this.visible.set(false);
  }

  /** Close only when the backdrop itself is clicked. */
  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement) === (event.currentTarget as HTMLElement)) {
      this.close();
    }
  }

  /** Navigate to the pricing page to upgrade. */
  goToPricing(): void {
    this.close();
    this.upgrade.emit();
    this.router.navigate(['/pricing']);
  }
}
