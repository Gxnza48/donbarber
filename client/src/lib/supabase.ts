import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Conectando a Supabase URL:", supabaseUrl || "UNDEFINED (Error de .env)");

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("CRÍTICO: No se encontraron VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
    throw new Error(
        'Faltan las variables de entorno. Asegurate de que el archivo .env esté en la raíz del proyecto y en la carpeta client/.'
    );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
