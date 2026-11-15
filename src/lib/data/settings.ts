import 'server-only';

import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const getPlatformSettings = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('platform_settings').select('*').eq('id', true).maybeSingle();
  return data;
});
