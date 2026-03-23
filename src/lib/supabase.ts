import { createClient as _createClient } from '@supabase/supabase-js'

let instance: ReturnType<typeof _createClient> | null = null

export function createClient() {
  if (!instance) {
    instance = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return instance
}
