import { Injectable, signal } from '@angular/core';

/**
 * A single toast notification displayed by ToastComponent.
 */
export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  /** Optional action offered to the user after the message (e.g. "Go to Gallery"). */
  action?: { label: string; callback: () => void };
  duration?: number;
}

/**
 * ToastService
 *
 * Central, never-throw notification bus. Components inject it to show
 * success/error/info/warning toasts; ToastComponent renders them.
 * Auto-dismiss timers are managed here; actions run then dismiss.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  /** Read-only stream of active toasts for the template to bind to. */
  readonly list = this.toasts.asReadonly();

  /**
   * Show a toast.
   * @param message User-friendly message.
   * @param type 'success' | 'error' | 'info' | 'warning'.
   * @param duration Auto-dismiss ms (0 = never auto-dismiss).
   * @param action Optional user action (button) shown with the toast.
   */
  show(
    message: string,
    type: Toast['type'] = 'info',
    duration = 4000,
    action?: Toast['action']
  ): void {
    const id = this.nextId++;
    const toast: Toast = { id, type, message, duration, action };
    this.toasts.update((t) => [...t, toast]);
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'success', duration, action);
  }

  error(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'error', duration, action);
  }

  info(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'info', duration, action);
  }

  warning(message: string, duration?: number, action?: Toast['action']): void {
    this.show(message, 'warning', duration, action);
  }

  /** Remove a toast by id (also called by action callbacks). */
  remove(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  /** Dismiss all toasts. */
  clear(): void {
    this.toasts.set([]);
  }
}
