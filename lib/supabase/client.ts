// lib/supabase/client.ts
'use client';

import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Helpful console message in dev; avoid silent undefined
  // You can also throw here if you prefer.
  console.error('Missing NEXT_PUBLIC_SUPABASE_* envs');
}

export const supabase = createClient(url ?? '', anon ?? '');
