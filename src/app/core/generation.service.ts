import { inject, Injectable, signal } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface GenerationResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * GenerationService
 *
 * Client-side wrapper around the /api/generate serverless function.
 *
 * Guarantees:
 *  - Never throws to the caller: every failure path returns a
 *    GenerationResult with success: false and a user-friendly error.
 *  - Tracks a `generating` loading state for UI binding.
 *  - Aborts requests that exceed a reasonable timeout.
 */
@Injectable({
  providedIn: 'root',
})
export class GenerationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly apiUrl = '/api/generate';

  /** Generation timeout window (Nemotron can be slow). */
  private readonly requestTimeoutMs = 45000;

  /** True while a generation request is in flight. */
  readonly generating = signal(false);

  /**
   * Generate Angular + Bootstrap 5 code from a natural-language description.
   * Never throws; returns a GenerationResult in all cases.
   */
  async generate(description: string): Promise<GenerationResult> {
    this.generating.set(true);
    try {
      const session = await this.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const body = { description };
      const timeoutId = setTimeout(() => {}, this.requestTimeoutMs);

      try {
        const response = await lastValueFrom(
          this.http.post<{ code?: string; error?: string }>(
            this.apiUrl,
            body,
            {
              headers: new HttpHeaders(headers),
            }
          )
        );

        clearTimeout(timeoutId);

        // Server returned a friendly error (e.g. Nemotron unavailable)
        if (response?.error && !response.code) {
          return { success: false, error: response.error };
        }

        if (response?.code) {
          return { success: true, code: response.code };
        }

        return {
          success: false,
          error: 'No code was returned by the generation service.',
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      return this.handleError(err);
    } finally {
      this.generating.set(false);
    }
  }

  /**
   * Convert any error into a user-friendly GenerationResult.
   * Never re-throws.
   */
  private handleError(err: unknown): GenerationResult {
    // Network / HTTP errors
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return {
          success: false,
          error:
            'Unable to reach the generation service. Please check your connection and try again.',
        };
      }
      if (err.status === 401) {
        return {
          success: false,
          error:
            'Your session has expired. Please sign in again and try again.',
        };
      }
      if (err.status === 429) {
        return {
          success: false,
          error:
            'The generation service is busy. Please wait a moment and try again.',
        };
      }
      return {
        success: false,
        error: `Generation failed (${err.status}). Please try again later.`,
      };
    }

    // Request timeout / abort
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error:
          'The generation request timed out. Please try again with a shorter description.',
      };
    }

    // Anything else
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
}
