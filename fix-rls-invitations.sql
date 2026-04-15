-- Permitir a Superadmins insertar en la tabla de usuarios
DO $$
BEGIN
    DROP POLICY IF EXISTS "Superadmins can insert users" ON public.users;
    DROP POLICY IF EXISTS "Superadmins can manage invitations" ON public.user_invitations;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Superadmins can insert users"
ON public.users
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_id = auth.uid() AND u.role = 'superadmin'
    )
);

-- Habilitar RLS en user_invitations si no lo está
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage invitations"
ON public.user_invitations
FOR ALL
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

-- Asegurarse de que el token sea visible temporalmente si es necesario, 
-- aunque el superadmin es quien los consulta
