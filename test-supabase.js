import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'aurevitelli@gmail.com',
    password: 'Aure@2026',
  });
  console.log('Signup result:', { data, error });
}
run();
