import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GenerationService, GenerationResult } from '../../core/generation.service';
import { AuthService } from '../../core/auth.service';
import { TemplatesService, Template } from '../../core/templates.service';
import { ToastService } from '../../core/toast.service';
import { EntitlementService, EntitlementResult } from '../../core/entitlement.service';
import { ExportService } from '../../core/export.service';
import { PreviewComponent } from './preview/preview.component';
import { PaywallModalComponent } from '../../shared/paywall/paywall-modal.component';

interface PromptTemplate {
  label: string;
  description: string;
  prompt: string;
}

/**
 * GenerateComponent
 *
 * Page for the core generation flow:
 * 1. User enters a natural-language description (or picks a template/example).
 * 2. Calls GenerationService to request Angular + Bootstrap 5 code from Nemotron.
 * 3. Displays the generated code with copy-to-clipboard.
 * 4. Save the template, then paid users can export (ZIP / Angular project).
 * 5. Free users see a paywall upsell when they attempt export.
 *
 * Route is protected by authGuard.
 */
@Component({
  selector: 'app-generate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PreviewComponent,
    PaywallModalComponent,
  ],
  templateUrl: './generate.component.html',
  styles: []
})
export class GenerateComponent {
  private readonly generation = inject(GenerationService);
  private readonly auth = inject(AuthService);
  private readonly templates = inject(TemplatesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly entitlement = inject(EntitlementService);
  private readonly exportService = inject(ExportService);

  // ---- UI state -----------------------------------------------------------
  description = '';
  generatedCode = signal<string>('');
  result = signal<GenerationResult | null>(null);
  errorMessage = signal<string>('');

  /** ID of the most recently saved template (used for export). */
  savedTemplateId = signal<string | null>(null);

  /** Save-modal state. */
  readonly showSaveModal = signal(false);
  saveTitle = '';
  readonly saving = signal(false);

  /** Export state. */
  readonly exporting = signal(false);
  readonly paywallAction = signal<string>('');

  // ---- Prompt templates & examples ----------------------------------------
  readonly promptTemplates: PromptTemplate[] = [
    {
      label: 'Landing Page',
      description: 'Hero, features grid, testimonials, CTA footer.',
      prompt:
        'A modern landing page with a hero section, a features grid, testimonials, and a CTA footer. Use Bootstrap 5.3 classes, responsive layout, and a standalone Angular component.',
    },
    {
      label: 'Dashboard',
      description: 'Sidebar, stats cards, orders table, profile widget.',
      prompt:
        'An admin dashboard with sidebar navigation, stats cards, a recent orders table, and a user profile widget. Use Bootstrap 5.3 and Angular standalone component.',
    },
    {
      label: 'Profile Page',
      description: 'Avatar, bio, stats, edit form.',
      prompt:
        'A user profile page with avatar, bio, stats, and an edit profile form. Use Bootstrap 5.3 classes and a standalone Angular component.',
    },
    {
      label: 'Contact Form',
      description: 'Contact form, company info, map placeholder.',
      prompt:
        'A contact page with a contact form (name, email, message), company info, and a map placeholder. Use Bootstrap 5.3 classes and a standalone Angular component.',
    },
    {
      label: 'Pricing Page',
      description: 'Three tiers, feature checklists, FAQ.',
      prompt:
        'A pricing page with three pricing tiers, feature checklists, and a FAQ section. Use Bootstrap 5.3 classes and a standalone Angular component.',
    },
  ];

  readonly examples = [
    'A simple portfolio page with a hero, about section, project gallery, and contact form.',
    'A SaaS landing page with navbar, hero, features, pricing, and footer.',
    'A blog layout with a post list, sidebar, and post card components.',
    'An event page with date, location, speaker list, and registration form.',
  ];

  isLoading = this.generation.generating;

  userEmail = 'User';

  async ngOnInit(): Promise<void> {
    const session = await this.auth.getSession();
    if (!session) {
      this.router.navigate(['/login']);
      return;
    }
    this.userEmail = session.user?.email ?? 'User';
  }

  /** Fill the textarea with a template prompt. */
  useTemplate(template: PromptTemplate): void {
    this.description = template.prompt;
    this.clearResult();
  }

  /** Fill the textarea with an example description. */
  useExample(example: string): void {
    this.description = example;
    this.clearResult();
  }

  /** Generate code from the current description. */
  async generate(): Promise<void> {
    this.clearResult();
    this.savedTemplateId.set(null);
    if (!this.description.trim()) {
      return;
    }

    const result = await this.generation.generate(this.description);
    this.result.set(result);

    if (result.success && result.code) {
      // Client-side sanity check: only render code that looks like Angular.
      if (!this.isAngularLike(result.code)) {
        this.generatedCode.set('');
        this.errorMessage.set(
          'The generated code did not look like a valid Angular component. Please try again.'
        );
        return;
      }
      this.generatedCode.set(result.code);
      this.errorMessage.set('');
    } else {
      this.generatedCode.set('');
      this.errorMessage.set(result.error || 'Generation failed. Please try again.');
    }
  }

  /** Open the save-modal with a title derived from the description. */
  openSaveModal(): void {
    this.saveTitle = this.deriveTitle();
    this.showSaveModal.set(true);
  }

  /** Close the save-modal. */
  closeSaveModal(): void {
    this.showSaveModal.set(false);
    this.saveTitle = '';
  }

  /** Close the modal only when the backdrop itself is clicked. */
  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement) === (event.currentTarget as HTMLElement)) {
      this.closeSaveModal();
    }
  }

  /**
   * Save the generated code as a template for the current user.
   * Never throws: success/failure is shown via toasts.
   */
  async saveTemplate(): Promise<void> {
    if (!this.saveTitle.trim() || !this.generatedCode()) {
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.templates.createTemplate({
        title: this.saveTitle.trim(),
        description: this.description.trim(),
        generated_code: this.generatedCode(),
      });

      if (result.success) {
        const saved = result.data as Template | undefined;
        if (saved?.id) {
          this.savedTemplateId.set(saved.id);
        }
        this.closeSaveModal();
        this.toast.success(
          'Template saved to your gallery.',
          6000,
          {
            label: 'Go to Gallery',
            callback: () => this.router.navigate(['/generator/gallery']),
          }
        );
      } else {
        this.toast.error(result.error || 'Unable to save the template. Please try again.');
      }
    } catch {
      this.toast.error('An unexpected error occurred while saving the template.');
    } finally {
      this.saving.set(false);
    }
  }

  /** Attempt a paid export (zip or project). Checks entitlement first. */
  async attemptExport(type: 'zip' | 'project'): Promise<void> {
    const templateId = this.savedTemplateId();
    if (!templateId) {
      this.toast.error('Please save the template before exporting.');
      return;
    }

    // UX hint: check entitlement via the server.
    const ent = await this.entitlement.checkEntitlement();
    if (!ent.entitled) {
      this.paywallAction.set(type === 'zip' ? 'Download ZIP' : 'Download Angular Project');
      this.showPaywall.set(true);
      return;
    }

    await this.downloadExport(type, templateId);
  }

  /** Download the export archive (paid users only). */
  async downloadExport(type: 'zip' | 'project', templateId: string): Promise<void> {
    this.exporting.set(true);
    try {
      const endpoint = type === 'zip' ? '/api/export/zip' : '/api/export/project';
      const result = await this.exportService.download(templateId, endpoint);
      if (!result.ok) {
        this.toast.error(result.error || 'Export failed. Please try again.');
      }
    } finally {
      this.exporting.set(false);
    }
  }

  /** Derive a default title from the current description. */
  private deriveTitle(): string {
    const words = this.description.trim().split(/\s+/).filter(Boolean).slice(0, 8);
    let title = words.join(' ');
    if (!title || !title.trim()) {
      title = 'Untitled Template';
    }
    if (title.length > 60) {
      title = title.slice(0, 60).trimEnd();
    }
    return title;
  }

  /** Copy generated code to clipboard. */
  async copyCode(): Promise<void> {
    const code = this.generatedCode();
    if (!code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      this.errorMessage.set('Code copied to clipboard.');
      setTimeout(() => this.errorMessage.set(''), 2500);
    } catch {
      this.errorMessage.set('Unable to copy code. Please copy manually.');
    }
  }

  /** Client-side sanity check: does the code look like an Angular component? */
  private isAngularLike(code: string): boolean {
    if (!code || code.length < 10) {
      return false;
    }
    const lower = code.toLowerCase();
    return (
      lower.includes('@component') ||
      lower.includes('standalone') ||
      lower.includes('<') ||
      lower.includes('template')
    );
  }

  private clearResult(): void {
    this.result.set(null);
    this.generatedCode.set('');
    this.errorMessage.set('');
  }

  // ---- Paywall modal ------------------------------------------------------
  readonly showPaywall = signal(false);

  openPaywall(): void {
    this.showPaywall.set(true);
  }

  closePaywall(): void {
    this.showPaywall.set(false);
    this.paywallAction.set('');
  }
}
