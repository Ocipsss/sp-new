import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://flbuxeimxmeofyycmcoq.supabase.co'

const SUPABASE_ANON_KEY = 'sb_publishable_FAwiOQ5ZdWVy43szI1nAEA_Ww1J5Af9'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
