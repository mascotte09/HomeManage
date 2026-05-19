import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tirjlhdlumctcdhemxlg.supabase.co'
const supabaseKey = 'sb_publishable_YnAzytPsmfKH0X9x0psCmw_W18kdpCq'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)