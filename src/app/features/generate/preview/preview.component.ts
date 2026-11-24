import {
  Component,
  input,
  effect,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * PreviewComponent
 *
 * Renders generated Angular + Bootstrap 5 code inside a sandboxed iframe.
 *
 * Isolation guarantees:
 *  - The iframe uses `srcdoc`, giving it a unique (null) origin that cannot
 *    access the parent page's DOM, cookies, or localStorage.
 *  - Sandbox flags allow scripts but block popups, top-navigation, and
 *    same-origin access to the parent.
 *  - iframe load/render failures are caught and shown as a friendly fallback;
 *    errors never propagate to the parent UI.
 */
@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview.component.html',
  styles: []
})
export class PreviewComponent {
  /** Generated Angular component code from Nemotron. */
  readonly code = input<string>('');

  /** Rendered preview HTML (trusted, set via srcdoc). */
  readonly previewHtml = signal<string>('');

  readonly loadError = signal<string>('');
  readonly isLoading = signal(false);
  readonly mobile = signal(false);

  @ViewChild('previewIframe') iframe!: ElementRef<HTMLIFrameElement>;

  private static readonly BOOTSTRAP_CSS =
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';

  constructor() {
    // Re-render the preview whenever the generated code changes (auto-refresh)
    effect(() => {
      const c = this.code();
      if (c && c.trim()) {
        this.render(c);
      } else {
        this.previewHtml.set('');
        this.loadError.set('');
      }
    });
  }

  toggleResponsive(): void {
    this.mobile.set(!this.mobile());
  }

  /** Re-render the current preview (manual refresh). */
  refresh(): void {
    const c = this.code();
    if (c && c.trim()) {
      this.render(c);
    }
  }

  private render(code: string): void {
    this.loadError.set('');
    this.isLoading.set(true);

    const templateHtml = this.extractTemplate(code);
    const escapedCode = this.escapeHtml(code);
    const hasTemplate = templateHtml.trim().length > 0;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Template Preview — Kaos Digital</title>
  <link rel="stylesheet" href="${PreviewComponent.BOOTSTRAP_CSS}">
  <style>
    body { margin: 0; background: var(--kaos-bg-primary, #020617); color: var(--kaos-text-primary, #ffffff); font-family: var(--kaos-font-family, Inter, sans-serif); }
    #preview-root { min-height: 100vh; overflow: auto; }
    .kaos-preview-shell {
      background: var(--kaos-bg-primary, #020617);
      border-bottom: 2px solid var(--kaos-accent-primary, #7c3aed);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .kaos-preview-shell .brand-mark {
      font-weight: 700;
      font-size: 1.1rem;
      letter-spacing: -0.5px;
    }
    .kaos-preview-shell .brand-mark span {
      color: var(--kaos-accent-primary, #7c3aed);
    }
  </style>
</head>
<body>
  <header class="kaos-preview-shell">
    <span class="brand-mark">Kaos <span>Template</span> Preview</span>
  </header>
  <div id="preview-root" class="p-3 p-md-4">
    ${hasTemplate ? templateHtml : this.noPreviewFallback()}
  </div>

  <!-- Full generated Angular component source embedded for reference -->
  <script type="text/plain" id="generated-component">
${escapedCode}
  </script>
</body>
</html>`;

    // Defer to next tick so the ViewChild iframe is available
    setTimeout(() => {
      try {
        const iframe = this.iframe?.nativeElement;
        if (iframe) {
          iframe.srcdoc = html;
        }
        this.previewHtml.set(html);
        this.isLoading.set(false);
      } catch (err) {
        this.isLoading.set(false);
        this.loadError.set(
          'Unable to render the preview. You can still copy the code below.'
        );
      }
    }, 0);
  }

  /** Best-effort extraction of the component template for visual preview. */
  private extractTemplate(code: string): string {
    const patterns = [
      /template\s*:\s*`([\s\S]*?)`\s*[,}]/,
      /template\s*:\s*'([\s\S]*?)'\s*[,}]/,
      /template\s*:\s*"([\s\S]*?)"\s*[,}]/,
    ];
    for (const pattern of patterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return '';
  }

  private noPreviewFallback(): string {
    return `
      <div class="text-center text-muted py-5">
        <p class="fs-5">Preview not available for this template.</p>
        <p class="text-sm">Copy the generated code below to run it locally.</p>
      </div>
    `;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  onIframeError(): void {
    this.isLoading.set(false);
    this.loadError.set(
      'Preview failed to load. You can still copy the generated code below.'
    );
  }
}
