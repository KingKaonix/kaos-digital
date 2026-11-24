import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface ExportResult {
  ok: boolean;
  error?: string;
}

/**
 * ExportService
 *
 * Downloads paid export archives (ZIP, Angular project) from the server.
 * The server verifies entitlement; this service just performs the download
 * with the caller's auth token. Never throws.
 */
@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly downloading = signal(false);

  /**
   * Download an export archive. `endpoint` is '/api/export/zip' or
   * '/api/export/project'. `templateId` identifies the template.
   */
  async download(templateId: string, endpoint: string): Promise<ExportResult> {
    this.downloading.set(true);
    try {
      const session = await this.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await lastValueFrom(
        this.http.get(`${endpoint}?templateId=${encodeURIComponent(templateId)}`, {
          headers: new HttpHeaders(headers),
          responseType: 'blob',
        })
      );

      const blob = response as Blob;
      // Prefer the server-suggested filename from Content-Disposition.
      let fileName = 'export.zip';
      const disposition = (response as any)?.headers?.get?.('content-disposition');
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) {
          fileName = match[1];
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : 'Unable to download the export archive.',
      };
    } finally {
      this.downloading.set(false);
    }
  }
}
