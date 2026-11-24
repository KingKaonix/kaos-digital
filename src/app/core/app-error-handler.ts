import { ErrorHandler } from '@angular/core';

/**
 * AppErrorHandler
 *
 * Global error boundary for the application. Replaces Angular's default
 * ErrorHandler so that unexpected errors are reported with a user-friendly
 * message instead of raw stack traces being surfaced to the user.
 *
 * Errors are still logged to the console for developers, but the message
 * shown anywhere in the UI is sanitized.
 */
export class AppErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message =
      error instanceof Error ? error.message : String(error ?? 'Unknown error');

    // Log details for developers (not shown to end users)
    console.error('[AppErrorHandler]', error);

    // Surface a friendly, sanitized message. Avoid leaking stack traces,
    // internal URLs, or secrets to the UI.
    const friendly =
      message.includes('fetch') ||
      message.includes('Failed to fetch') ||
      message.includes('network')
        ? 'Unable to reach the generation service. Please check your connection and try again.'
        : 'Something went wrong. Please try again later.';

    // Store on window so UI layers can read a last-error if needed.
    (window as unknown as { __gsdLastError?: string }).__gsdLastError = friendly;
  }
}
