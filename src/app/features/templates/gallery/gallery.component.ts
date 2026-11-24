import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TemplatesService, Template } from '../../../core/templates.service';
import { ToastService } from '../../../core/toast.service';

/**
 * GalleryComponent
 *
 * Personal gallery of the current user's saved templates, displayed as cards.
 * Data is fetched via TemplatesService.getUserTemplates(); Supabase RLS
 * guarantees only this user's templates are returned (user isolation).
 *
 * States: loading, empty, error, and the card list. Every card links to the
 * template edit page and offers Duplicate / Rename / Delete actions.
 */
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gallery.component.html',
  styles: []
})
export class GalleryComponent {
  private readonly templatesService = inject(TemplatesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly templates = signal<Template[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');

  /** Id of the template currently being renamed (inline), null when none. */
  private readonly renamingId = signal<string | null>(null);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const result = await this.templatesService.getUserTemplates();
    this.loading.set(false);
    if (result.success) {
      this.templates.set(result.data ?? []);
    } else {
      this.error.set(result.error || 'Unable to load your templates. Please try again.');
      this.toast.error(this.error());
    }
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  /** Shorten a description for card display. */
  truncateDescription(d: string): string {
    return d.length > 140 ? d.slice(0, 140).trimEnd() + '…' : d;
  }

  /** Shorten a code snippet for card preview. */
  codeSnippet(c: string): string {
    return c.length > 200 ? c.slice(0, 200).trimEnd() + '…' : c;
  }

  isRenaming(id: string): boolean {
    return this.renamingId() === id;
  }

  /** Open inline rename for a card. */
  startRename(id: string, currentTitle: string): void {
    this.renameTitle = currentTitle;
    this.renamingId.set(id);
  }

  /** Persist the new title, then refresh the list. */
  async saveRename(id: string): Promise<void> {
    const title = this.renameTitle.trim();
    if (!title) return;
    this.renamingId.set(id);
    const result = await this.templatesService.updateTemplate(id, { title });
    this.renamingId.set(null);
    this.renameTitle = '';
    if (result.success) {
      this.toast.success('Template renamed.');
      await this.load();
    } else {
      this.toast.error(result.error || 'Unable to rename the template.');
    }
  }

  /** Cancel inline rename. */
  cancelRename(): void {
    this.renameTitle = '';
    this.renamingId.set(null);
  }

  /** Duplicate a template, then refresh the gallery. */
  async duplicateTemplate(id: string): Promise<void> {
    const result = await this.templatesService.duplicateTemplate(id);
    if (result.success) {
      this.toast.success('Template duplicated.');
      await this.load();
    } else {
      this.toast.error(result.error || 'Unable to duplicate the template.');
    }
  }

  /** Delete a template after user confirmation, then refresh the gallery. */
  async deleteTemplate(id: string): Promise<void> {
    if (!window.confirm('Delete this template? This cannot be undone.')) {
      return;
    }
    const result = await this.templatesService.deleteTemplate(id);
    if (result.success) {
      this.toast.success('Template deleted.');
      await this.load();
    } else {
      this.toast.error(result.error || 'Unable to delete the template.');
    }
  }

  /** Navigate to the template edit page. */
  goToEdit(id: string): void {
    this.router.navigate(['/generator/templates', id, 'edit']);
  }

  /** Retry loading the gallery. */
  retry(): void {
    this.load();
  }

  /** Bound to [(ngModel)] during inline rename. */
  renameTitle = '';
}
