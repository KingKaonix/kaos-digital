import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GenerationService, GenerationResult } from '../../../core/generation.service';
import { TemplatesService, Template } from '../../../core/templates.service';
import { ToastService } from '../../../core/toast.service';
import { PreviewComponent } from '../../generate/preview/preview.component';

/**
 * TemplateEditComponent
 *
 * Edit page for a saved template: pre-filled title/description, live preview
 * (Phase 2 PreviewComponent), Regenerate (calls the Phase 2 /api/generate
 * serverless function and overwrites the existing record), Save changes,
 * Duplicate, and Delete.
 *
 * Behavior rules:
 *  - Regeneration overwrites the existing template (no version history).
 *  - On regeneration failure the original template is left unchanged.
 *  - RLS guarantees the user can only touch their own templates.
 *  - All service calls are never-throw; failures show friendly toasts.
 */
@Component({
  selector: 'app-template-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, PreviewComponent],
  templateUrl: './template-edit.component.html',
  styles: []
})
export class TemplateEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly generation = inject(GenerationService);
  private readonly templatesService = inject(TemplatesService);
  private readonly toast = inject(ToastService);

  id = '';
  template = signal<Template | null>(null);
  title = '';
  description = '';
  generatedCode = signal<string>('');
  loading = signal(false);
  regenerating = signal(false);
  error = signal<string>('');

  private async loadTemplate(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const result = await this.templatesService.getTemplateById(id);
    this.loading.set(false);
    if (result.success && result.data) {
      this.template.set(result.data);
      this.title = result.data.title;
      this.description = result.data.description;
      this.generatedCode.set(result.data.generated_code);
    } else {
      this.error.set(
        result.error || 'Template not found or you do not have access to it.'
      );
    }
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.loadTemplate(this.id);
  }

  /** Persist title/description edits without regenerating code (overwrite). */
  async saveChanges(): Promise<void> {
    const t = this.template();
    if (!t) return;
    this.loading.set(true);
    const result = await this.templatesService.updateTemplate(t.id, {
      title: this.title.trim(),
      description: this.description.trim(),
    });
    this.loading.set(false);
    if (result.success && result.data) {
      this.template.set(result.data);
      this.title = result.data.title;
      this.description = result.data.description;
      this.toast.success('Template saved.');
    } else {
      this.toast.error(result.error || 'Unable to save changes.');
    }
  }

  /**
   * Regenerate code from the current description and overwrite the template.
   * On failure the original template is left unchanged.
   */
  async regenerate(): Promise<void> {
    if (!this.description.trim()) {
      this.toast.error('Please enter a description before regenerating.');
      return;
    }
    const originalCode = this.generatedCode();
    this.regenerating.set(true);
    this.error.set('');

    const result: GenerationResult = await this.generation.generate(
      this.description
    );

    this.regenerating.set(false);

    if (!result.success || !result.code) {
      // Keep the original template unchanged; restore the original preview.
      this.generatedCode.set(originalCode);
      this.toast.error(
        result.error || 'Regeneration failed. Your template is unchanged.'
      );
      return;
    }

    const t = this.template();
    if (!t) return;

    const update = await this.templatesService.updateTemplate(t.id, {
      description: this.description.trim(),
      generated_code: result.code,
    });

    if (update.success && update.data) {
      this.generatedCode.set(result.code);
      this.template.set(update.data);
      this.title = update.data.title;
      this.description = update.data.description;
      this.toast.success('Template regenerated and saved.');
    } else {
      // Overwrite failed: restore original preview, template unchanged in DB.
      this.generatedCode.set(originalCode);
      this.toast.error(
        update.error || 'Code was regenerated but failed to save. The original template is unchanged.'
      );
    }
  }

  /** Delete this template and return to the gallery. */
  async deleteTemplate(): Promise<void> {
    const t = this.template();
    if (!t) return;
    if (!window.confirm(`Delete "${t.title}"? This cannot be undone.`)) {
      return;
    }
    const result = await this.templatesService.deleteTemplate(t.id);
    if (result.success) {
      this.toast.success('Template deleted.');
      this.router.navigate(['/generator/gallery']);
    }
  }

  /** Duplicate this template and open the copy in the editor. */
  async duplicateTemplate(): Promise<void> {
    const t = this.template();
    if (!t) return;
    const result = await this.templatesService.duplicateTemplate(t.id);
    if (result.success && result.data) {
      this.toast.success('Template duplicated.');
      this.router.navigate(['/generator/templates', result.data.id, 'edit']);
    } else {
      this.toast.error(result.error || 'Unable to duplicate the template.');
    }
  }

  /** Return to the gallery. */
  goToGallery(): void {
    this.router.navigate(['/generator/gallery']);
  }
}
