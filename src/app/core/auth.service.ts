import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { Observable, from } from 'rxjs';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient = supabase;

  /**
   * Sign up a new user with email and password.
   */
  async signUp(credentials: AuthCredentials): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user ?? null, error: null };
  }

  /**
   * Sign in an existing user with email and password.
   */
  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user ?? null, error: null };
  }

  /**
   * Sign out the current user and clear the session.
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /**
   * Get the current session (null if not authenticated).
   */
  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session ?? null;
  }

  /**
   * Get the current user (null if not authenticated).
   */
  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user ?? null;
  }

  /**
   * Subscribe to auth state changes (login, logout, token refresh, etc.).
   * Session persists in browser localStorage via @supabase/supabase-js.
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}
