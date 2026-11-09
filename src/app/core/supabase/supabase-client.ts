import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from './database.types';

export type TastimiiSupabaseClient = SupabaseClient<Database>;

/** Client Supabase unique de l'application. */
export const SUPABASE_CLIENT: InjectionToken<TastimiiSupabaseClient> =
  new InjectionToken<TastimiiSupabaseClient>('SUPABASE_CLIENT', {
    providedIn: 'root',
    factory: (): TastimiiSupabaseClient =>
      createClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey),
  });
