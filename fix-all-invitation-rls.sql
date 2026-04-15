-- 1. Permitir que los Superadmins actualicen datos en users (Necesario para el Upsert al Re-invitar)
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
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'superadmin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'superadmin')
);

-- 2. Permitir que cualquier persona pueda LEER de user_invitations (Necesario para que el enlace no diga "No válido" si no has iniciado sesión)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can select user_invitations" ON public.user_invitations;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Anyone can select user_invitations"
ON public.user_invitations
FOR SELECT
USING (true);

-- 3. Permitir que el usuario recién registrado actualice su estado a "accepted"
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update their own invitation" ON public.user_invitations;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can update their own invitation"
ON public.user_invitations
FOR UPDATE
USING (email = (auth.jwt() ->> 'email')::varchar)
WITH CHECK (email = (auth.jwt() ->> 'email')::varchar);

-- 4. Permitir que el usuario recién registrado "reclame" su perfil de user y le asigne su nuevo auth_id
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can claim their profile" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can claim their profile"
ON public.users
FOR UPDATE
USING (email = (auth.jwt() ->> 'email')::varchar AND auth_id IS NULL)
WITH CHECK (email = (auth.jwt() ->> 'email')::varchar);
