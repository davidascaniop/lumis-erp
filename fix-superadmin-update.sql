-- Permitir a Superadmins actualizar perfiles (tabla users)
-- Esto soluciona el error "new row violates row-level security policy" en upserts y updates
DO $$
BEGIN
    DROP POLICY IF EXISTS "Superadmins can update users" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Superadmins can update users"
ON public.users
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_id = auth.uid() AND u.role = 'superadmin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_id = auth.uid() AND u.role = 'superadmin'
    )
);

-- También, para evitar problemas al eliminar, añadimos la política de DELETE:
DO $$
BEGIN
    DROP POLICY IF EXISTS "Superadmins can delete users" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Superadmins can delete users"
ON public.users
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_id = auth.uid() AND u.role = 'superadmin'
    )
);
