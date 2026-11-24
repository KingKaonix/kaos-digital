import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface EntitlementResult {
  entitled: boolean;
  reason?: string;
  user_id?: string;
}

/**
 * EntitlementService
 *
 * Client-side wrapper around /api/entitlement. Used only as a UX hint to show
 * or hide export buttons and paywall upsells. The server always re-verifies
 * entitlement on export endpoints — frontend flags are never trusted.
 *
 * Never throws: returns { entitled: false } with a reason on any failure.
 */
@Injectable({
  providedIn: 'root',
})
export class EntitlementService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly apiUrl = '/api/entitlement';

  /** Last fetched entitlement (UX hint only). null until first check. */
  readonly entitled = signal<boolean | null>(null);
  readonly reason = signal<string | undefined>(undefined);
  readonly checking = signal(false);

  /**
   * Fetch the user's entitlement from the server.
   * Never throws; returns EntitlementResult.
   */
  async checkEntitlement(): Promise<EntitlementResult> {
    this.checking.set(true);
    try {
      const session = await this.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await lastValueFrom(
        this.http.get<{ entitled?: boolean; reason?: string; user_id?: string }>(
          this.apiUrl,
          { headers: new HttpHeaders(headers) }
        )
      );

      const entitled = response?.entitled ?? false;
      this.entitled.set(entitled);
      this.reason.set(response?.reason);
      return {
        entitled,
        reason: response?.reason,
        user_id: response?.user_id,
      };
    } catch {
      this.entitled.set(false);
      this.reason.set('Unable to verify your subscription. Please try again later.');
      return { entitled: false, reason: this.reason() };
    } finally {
      this.checking.set(false);
    }
  }
}
