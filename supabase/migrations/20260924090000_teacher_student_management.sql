-- =========================================================
-- Italio — Etapa 3a: panel del profesor (gestión de sus alumnos)
-- Migración ADITIVA sobre las anteriores.
-- Un profesor activo (y un admin activo, que actúa como "profesor
-- máster" sobre sus propios alumnos vinculados) gestiona SOLO a los
-- alumnos con teacher_id = su propio id. Todo lo demás sigue cerrado.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Helper: ¿el usuario actual es un profesor activo?
-- SECURITY DEFINER, análogo a is_active_admin(): evita que su propia
-- consulta a profiles dispare de nuevo las políticas de RLS que la usan.
-- ---------------------------------------------------------
create or replace function public.is_active_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'teacher'
      and status = 'active'
  );
$$;

comment on function public.is_active_teacher() is
  'true si el usuario autenticado es profesor y está activo. SECURITY '
  'DEFINER a propósito, igual que is_active_admin(), para no volver a '
  'evaluar las políticas RLS de profiles al consultar.';

-- ---------------------------------------------------------
-- La lectura del propio perfil ("Los usuarios pueden ver su propio
-- perfil", de la etapa 1a) ya cubre que un profesor vea sus propios
-- códigos. No hace falta agregar nada para eso.
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- Trigger: extiende protect_teacher_profile_fields() para también
-- proteger a los alumnos. Desde el panel (profesor o admin actuando
-- sobre sus propios alumnos) solo se puede cambiar el status; el
-- resto de los campos queda protegido. Igual que antes, esto solo se
-- aplica a operaciones que llegan como el rol 'authenticated' — las
-- operaciones directas (SQL Editor, claves de servicio) no pasan por
-- este chequeo.
-- ---------------------------------------------------------
create or replace function public.protect_teacher_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if current_user <> 'authenticated' then
    return new;
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

comment on function public.protect_teacher_profile_fields() is
  'Protege los campos sensibles de profesores y alumnos ante UPDATEs '
  'que llegan por el camino normal de un usuario autenticado (RLS): '
  'solo el status es modificable desde los paneles de admin/profesor.';

-- ---------------------------------------------------------
-- Políticas RLS: el profesor activo (o el admin activo, sobre sus
-- propios alumnos vinculados) gestiona a SUS alumnos.
-- Nunca alcanza a alumnos de otro profesor. Todo lo demás sigue
-- cerrado (los alumnos no ganan permisos nuevos acá).
-- ---------------------------------------------------------
create policy "El profesor activo puede ver a sus propios alumnos"
  on public.profiles
  for select
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and role = 'student'
    and teacher_id = auth.uid()
  );

create policy "El profesor activo puede cambiar el status de sus alumnos"
  on public.profiles
  for update
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and role = 'student'
    and teacher_id = auth.uid()
  )
  with check (
    (public.is_active_teacher() or public.is_active_admin())
    and role = 'student'
    and teacher_id = auth.uid()
  );

create policy "El profesor activo puede eliminar a sus propios alumnos"
  on public.profiles
  for delete
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and role = 'student'
    and teacher_id = auth.uid()
  );

commit;
