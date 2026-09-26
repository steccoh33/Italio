-- =========================================================
-- Constancia de aceptación de Términos y Política de Privacidad
-- (Ley N.° 25.326: consentimiento libre, expreso e informado).
-- Aditiva: solo agrega dos columnas nulas a profiles y refuerza el
-- trigger de protección para que esos campos no puedan alterarse
-- desde los paneles (rol 'authenticated'). Las cuentas anteriores
-- quedan en NULL (se registraron antes de existir la casilla).
-- =========================================================
begin;

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz null,
  add column if not exists terms_version text null;

comment on column public.profiles.terms_accepted_at is
  'Fecha y hora en que el usuario aceptó los Términos y la Política de Privacidad al registrarse.';
comment on column public.profiles.terms_version is
  'Versión (fecha AAAA-MM-DD) de los documentos legales aceptados.';

create or replace function public.protect_teacher_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  -- La constancia de aceptación no se puede modificar desde la app.
  if new.terms_accepted_at is distinct from old.terms_accepted_at
    or new.terms_version is distinct from old.terms_version
  then
    raise exception
      'La constancia de aceptación de los términos no se puede modificar.';
  end if;

  if old.role = 'teacher' then
    if new.role is distinct from old.role
      or new.login_code is distinct from old.login_code
      or new.teacher_code is distinct from old.teacher_code
      or new.full_name is distinct from old.full_name
      or new.teacher_id is distinct from old.teacher_id
      or new.id is distinct from old.id
    then
      raise exception
        'Desde el panel de administración solo se puede cambiar el status de un profesor.';
    end if;
  elsif old.role = 'student' then
    if new.role is distinct from old.role
      or new.login_code is distinct from old.login_code
      or new.teacher_id is distinct from old.teacher_id
      or new.full_name is distinct from old.full_name
      or new.id is distinct from old.id
    then
      raise exception
        'Desde el panel del profesor solo se puede cambiar el status de un alumno.';
    end if;
  end if;

  return new;
end;
$$;

commit;
