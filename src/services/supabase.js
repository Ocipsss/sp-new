import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://rwpmhjjyoviibtkolgbm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG1oamp5b3ZpaWJ0a29sZ2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NTAyODcsImV4cCI6MjEwOTMyNjI4N30.SpKXVtYi4JCR-cmcqWOC4fflPRAmNjuo-y9649Uaf2o'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
