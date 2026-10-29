import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Hinglish: Browser me sirf publishable key jaati hai; private service-role key kabhi nahi.
export const configured = Boolean(url && key);
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

export async function requireData<T>(operation: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await operation;
  if (error) throw new Error(error.message);
  return data as T;
}
