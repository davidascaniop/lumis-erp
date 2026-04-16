const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const startIndex = code.indexOf('export default async function DashboardPage');
const bottomCode = code.substring(startIndex);

fs.writeFileSync('src/app/dashboard/page.tsx', 
`import { createClient } from '@/lib/supabase/server';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { Suspense } from 'react';

` + bottomCode);
console.log("cleaned page");
