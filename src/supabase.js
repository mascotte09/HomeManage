import { createClient } from '@supabase/supabase-js'

// Read env safely (support Vite `.env` and CRA `REACT_APP_` vars)
const getEnv = () => {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  const runtimeShim = (typeof window !== 'undefined' && window.__VITE_ENV__) ? window.__VITE_ENV__ : (typeof global !== 'undefined' && global.__VITE_ENV__ ? global.__VITE_ENV__ : {});
  return { ...runtimeShim, ...env };
};

const ENV = getEnv();

const supabaseUrl = ENV.VITE_SUPABASE_URL || ENV.REACT_APP_SUPABASE_URL || 'https://tirjlhdlumctcdhemxlg.supabase.co'
const supabaseKey = ENV.VITE_SUPABASE_KEY || ENV.REACT_APP_SUPABASE_KEY || 'sb_publishable_YnAzytPsmfKH0X9x0psCmw_W18kdpCq'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)