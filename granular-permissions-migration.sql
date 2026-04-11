-- ==========================================
-- MIGRATION: GRANULAR PERMISSIONS & INVITES
-- (Alineado con módulos reales del Super Admin Sidebar)
-- ==========================================

-- 1. Actualizar tabla usuarios (si no tienen las columnas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'permissions') THEN
        ALTER TABLE public.users ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE public.users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- 2. Crear tabla de invitaciones
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb,
    token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.user_invitations(email);

-- 3. Migrar permisos: dar acceso total a superadmins existentes con las NUEVAS claves
UPDATE public.users 
SET permissions = jsonb_build_object(
    'command_center', true,
    'finances', true,
    'reports', true,
    'clients', true,
    'daily_seed', true,
    'communication', true,
    'users', true,
    'configuration', true
)
WHERE role IN ('superadmin', 'system_admin', 'admin') AND (permissions IS NULL OR permissions = '{}'::jsonb);
