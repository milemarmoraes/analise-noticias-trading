import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para o banco de dados (caso precise usar futuramente)
export interface Analysis {
  id: string;
  indicator: string;
  pair: string;
  signal_type: 'COMPRA' | 'VENDA';
  probability: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  created_at: string;
}
