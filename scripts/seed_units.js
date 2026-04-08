const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUnits() {
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

  console.log('Fetching company_id...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error: Debes estar autenticado o usar SERVICE_ROLE_KEY en el script.');
    return;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('auth_id', user.id)
    .single();

  const companyId = userData?.company_id;
  if (!companyId) {
    console.error('Error: No se encontró company_id.');
    return;
  }

  console.log(`Seeding units for company ${companyId}...`);

  for (const unit of units) {
    const { error } = await supabase
      .from('product_units')
      .upsert({
        company_id: companyId,
        name: unit.name,
        slug: unit.slug
      }, { onConflict: 'company_id,slug' });

    if (error) {
      console.error(`Error seed unit ${unit.slug}:`, error.message);
    } else {
      console.log(`Unit ${unit.slug} seeded.`);
    }
  }
}

seedUnits();
