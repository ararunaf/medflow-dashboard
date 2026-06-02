-- Bootstrap do administrador geral do sistema.
-- Execute apenas em ambientes controlados e troque a senha inicial apos o primeiro acesso.

DO $$
DECLARE
  v_email text := 'admin@iaeasy.com.br';
  v_password text := '@Myson3sgm';
  v_user_id uuid;
  v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (name, slug)
  VALUES ('MedicFlow-AI Administracao', 'medflow-admin')
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name
  RETURNING id INTO v_tenant_id;

  SELECT u.id
  INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador Geral"}'::jsonb,
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      recovery_token = COALESCE(recovery_token, ''),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
        || '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || '{"full_name":"Administrador Geral"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = v_user_id
      AND i.provider = 'email'
  );

  INSERT INTO public.profiles (
    id,
    tenant_id,
    full_name,
    role
  )
  VALUES (
    v_user_id,
    v_tenant_id,
    'Administrador Geral',
    'super_admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    tenant_id = EXCLUDED.tenant_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  INSERT INTO public.tenant_settings (
    tenant_id,
    institution_name,
    primary_color,
    secondary_color,
    contact_email
  )
  VALUES (
    v_tenant_id,
    'MedicFlow-AI Administração',
    '#1e3a5f',
    '#0d9488',
    'admin@iaeasy.com.br'
  )
  ON CONFLICT (tenant_id) DO NOTHING;
END $$;
