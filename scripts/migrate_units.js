const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const units = [
    { name: 'Unidad', slug: 'und' },
    { name: 'Caja', slug: 'cja' },
    { name: 'Paquete', slug: 'pqt' },
    { name: 'Set / Juego', slug: 'set' },
    { name: 'Kit', slug: 'kit' },
    { name: 'Tubo', slug: 'tbo' },
    { name: 'Frasco', slug: 'frs' },
    { name: 'Rollo', slug: 'rlo' },
    { name: 'Blíster', slug: 'blis' },
    { name: 'Gramos', slug: 'g' },
    { name: 'Kilogramos', slug: 'kg' },
    { name: 'Mililitros', slug: 'ml' },
    { name: 'Litros', slug: 'l' }
  ];

  // For a multitenant app, units are usually global or company scoped. 
  // Let's create the table via RPC if possible or assume it's created.
  // Actually, I should use psql or check if the table exists.
}

main();
