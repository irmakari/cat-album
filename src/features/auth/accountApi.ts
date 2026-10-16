import type { AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const MIN_PASSWORD_LENGTH = 8;

type Result = { ok: true } | { ok: false; message: string };

const messages: Record<string, string> = {
  email_exists: 'That email already has an account.',
  user_already_exists: 'That email already has an account.',
  email_address_invalid: 'That email address doesn’t look right.',
  validation_failed: 'That email address doesn’t look right.',
  weak_password: `Choose a longer password, at least ${MIN_PASSWORD_LENGTH} characters.`,
  otp_expired: 'That code has expired or isn’t right. Ask for a new one.',
  over_email_send_rate_limit: 'Too many emails just now. Try again in a minute.',
  over_request_rate_limit: 'Too many tries just now. Try again in a minute.',
  same_password: 'Choose a different password.',
};

function fail(error: AuthError): Result {
  if (error.name === 'AuthRetryableFetchError') return { ok: false, message: 'You seem to be offline.' };
  return { ok: false, message: (error.code && messages[error.code]) || 'Something went wrong. Please try again.' };
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// The anonymous account the app made on first launch becomes permanent in
// three steps, keeping its id and so every cat already collected:
// 1. the email is linked, which emails a six-digit code;
// 2. the code confirms it (no browser needed);
// 3. a password is set, which Supabase only allows once the email is confirmed.
// The "Change email address" template must include {{ .Token }}.
// With "Confirm email" off in Supabase, step 2 never comes: the email is
// taken at once, and `confirmed` says to go straight on to step 3.
export async function linkEmail(email: string): Promise<Result & { confirmed?: boolean }> {
  const { data, error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) return fail(error);
  const confirmed = data.user.email?.toLowerCase() === email.trim().toLowerCase() && !data.user.new_email;
  if (confirmed) await supabase.auth.refreshSession().catch(() => {});
  return { ok: true, confirmed };
}

export async function confirmEmail(email: string, code: string): Promise<Result> {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email_change' });
  if (error) return fail(error);
  // The new token says the account is no longer anonymous.
  await supabase.auth.refreshSession().catch(() => {});
  return { ok: true };
}

export async function setPassword(password: string): Promise<Result> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? fail(error) : { ok: true };
}

// Removes the account and everything kept under it on the server. Images
// go first, through storage; the database then drops the user, and the
// profile and cats go with it. If a step fails the account is still there
// and the whole thing can be tried again.
export async function deleteAccount(userId: string): Promise<Result> {
  try {
    const bucket = supabase.storage.from('cat-images');
    for (;;) {
      const { data, error } = await bucket.list(userId, { limit: 100 });
      if (error) throw error;
      if (data.length === 0) break;
      const { error: removeError } = await bucket.remove(data.map((file) => `${userId}/${file.name}`));
      if (removeError) throw removeError;
    }
    const { error } = await supabase.rpc('delete_account');
    if (error) throw error;
  } catch {
    return { ok: false, message: 'Could not delete your account. Please try again.' };
  }
  // The session outlives the user it belonged to; a fresh anonymous one
  // follows on its own.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  return { ok: true };
}
