import { Injectable } from '@angular/core';
import { supabase } from '../../../lib/supabase';

export interface Template {
  id: string;
  user_id: string;
  title: string;
  description: string;
  generated_code: string;
  created_at: string;
  updated_at: string;
}

export interface NewTemplate {
  title: string;
  description: string;
  generated_code: string;
}

/**
 * Standard never-throw result returned by every TemplatesService operation.
 * Callers inspect `success` and read `data` or `error`; no try/catch required.
 */
export interface TemplateResult<T = Template> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * TemplatesService
 *
 * Full CRUD for saved templates, backed by Supabase with Row Level Security
 * (Phase 1). Every query is scoped to the current user; RLS policies
 * (`auth.uid() = user_id`) enforce user isolation at the database level so the
 * client can never read or modify another user's templates.
 *
 * Guarantees:
 *  - Every operation returns a TemplateResult; none ever throw.
 *  - Writes are validated before reaching Supabase (title, description, code required).
 *  - `user_id` and `id` are never client-updatable.
 */
@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  /** Validate required fields before any write. Never throws. */
  private validateTemplate(
    template: Pick<NewTemplate, 'title' | 'description' | 'generated_code'>
  ): TemplateResult<void> {
    if (!template.title || !template.title.trim()) {
      return { success: false, error: 'Template title is required.' };
    }
    if (!template.description || !template.description.trim()) {
      return { success: false, error: 'Template description is required.' };
    }
    if (!template.generated_code || !template.generated_code.trim()) {
      return { success: false, error: 'Template code is required.' };
    }
    return { success: true };
  }

  /** Resolve the current user id, or return a friendly error if unsigned. */
  private async currentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }

  /**
   * Create a new template for the current user.
   * RLS insert policy sets/enforces user_id = auth.uid().
   */
  async createTemplate(template: NewTemplate): Promise<TemplateResult> {
    const validation = this.validateTemplate(template);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const userId = await this.currentUserId();
    if (!userId) {
      return { success: false, error: 'You must be signed in to save a template.' };
    }

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('templates')
        .insert({
          ...template,
          user_id: userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: `Save failed: ${error.message}` };
      }
      return { success: true, data: data as Template };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred while saving the template.',
      };
    }
  }

  /**
   * Fetch all templates belonging to the current user, newest first.
   * RLS select policy returns only the user's own rows.
   */
  async getUserTemplates(): Promise<TemplateResult<Template[]>> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: `Unable to load templates: ${error.message}` };
      }
      return { success: true, data: (data as Template[]) ?? [] };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred while loading templates.',
      };
    }
  }

  /**
   * Fetch a single template by ID. RLS ensures the user owns it.
   */
  async getTemplateById(id: string): Promise<TemplateResult<Template>> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: `Unable to load template: ${error.message}` };
      }
      return { success: true, data: data as Template };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred while loading the template.',
      };
    }
  }

  /**
   * Update an existing template. RLS ensures the user owns it.
   * `id` and `user_id` are stripped from updates so ownership cannot be changed.
   * `updated_at` is refreshed automatically.
   */
  async updateTemplate(
    id: string,
    updates: Partial<Template>
  ): Promise<TemplateResult<Template>> {
    const { user_id, id: _id, ...safeUpdates } = updates as Record<
      string,
      unknown
    >;
    const payload = { ...safeUpdates, updated_at: new Date().toISOString() };

    try {
      const { data, error } = await supabase
        .from('templates')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: `Update failed: ${error.message}` };
      }
      return { success: true, data: data as Template };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred while updating the template.',
      };
    }
  }

  /**
   * Delete a template. RLS ensures the user owns it.
   */
  async deleteTemplate(id: string): Promise<TemplateResult<void>> {
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) {
        return { success: false, error: `Delete failed: ${error.message}` };
      }
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'An unexpected error occurred while deleting the template.',
      };
    }
  }

  /**
   * Duplicate an existing template: reload it, then insert a copy titled
   * "{original title} (Copy)" for the current user. RLS keeps it user-owned.
   */
  async duplicateTemplate(id: string): Promise<TemplateResult<Template>> {
    const original = await this.getTemplateById(id);
    if (!original.success || !original.data) {
      return original;
    }

    const copy: NewTemplate = {
      title: `${original.data.title} (Copy)`,
      description: original.data.description,
      generated_code: original.data.generated_code,
    };
    return this.createTemplate(copy);
  }
}
