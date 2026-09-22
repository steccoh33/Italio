-- =========================================================
-- Italio — Etapa 2: panel de administrador (gestión de profesores)
-- Migración ADITIVA sobre las anteriores.
-- Solo un usuario con role='admin' y status='active' puede aprobar,
-- pausar, reactivar o eliminar profesores. Todo lo demás sigue cerrado.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Helper: ¿el usuario actual es un admin activo?
-- SECURITY DEFINER para que su propia consulta a profiles no dispare de
-- nuevo las políticas de RLS que la usan (evita recursión infinita).
-- ---------------------------------------------------------
create or replace function public.is_active_admin()
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
      and role = 'admin'
      and status = 'active'
  );
$$;

comment on function public.is_active_admin() is
  'true si el usuario autenticado es admin y está activo. SECURITY '
  'DEFINER a propósito: se usa dentro de políticas RLS sobre profiles '
  'y no debe volver a evaluar esas mismas políticas al consultar.';

-- ---------------------------------------------------------
-- Regla de acceso efectivo (ya usada en la app en TypeScript): un
-- alumno solo está "efectivamente" activo si él está active Y su
-- profesor también está active. Se deja lista a nivel de base para
-- reutilizarla desde SQL (p. ej. paneles futuros de profesor/alumno).
-- ---------------------------------------------------------
create or replace function public.get_effective_status(p_profile_id uuid)
returns public.user_status
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role public.user_role;
  v_status public.user_status;
  v_teacher_id uuid;
  v_teacher_status public.user_status;
begin
  select role, status, teacher_id
    into v_role, v_status, v_teacher_id
  from public.profiles
  where id = p_profile_id;

  if v_role is null then
    return null;
  end if;

  if v_role <> 'student' or v_status <> 'active' or v_teacher_id is null then
    return v_status;
  end if;

  select status into v_teacher_status
  from public.profiles
  where id = v_teacher_id;

  if v_teacher_status is not null and v_teacher_status <> 'active' then
    return v_teacher_status;
  end if;

  return v_status;
end;
$$;

comment on function public.get_effective_status(uuid) is
  'Estado efectivo de un perfil: para profesor/admin es su propio '
  'status; para alumno, si su profesor no está active, devuelve el '
  'status del profesor (pausar/eliminar al profesor "arrastra" a sus '
  'alumnos). Espejo en SQL de la misma regla ya aplicada en la app.';

-- ---------------------------------------------------------
-- RPC: listar profesores para el panel de admin, con la cantidad de
-- alumnos de cada uno. SECURITY DEFINER porque cuenta filas de
-- alumnos (role='student'), que el admin no tiene por qué poder leer
-- fila por fila; esta función expone solo el conteo, nunca los datos
-- de los alumnos. Verifica is_active_admin() ella misma antes de
-- devolver nada.
-- ---------------------------------------------------------
create or replace function public.admin_list_teachers()
returns table (
  id uuid,
  full_name text,
  status public.user_status,
  teacher_code text,
  login_code text,
  created_at timestamptz,
  student_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_active_admin() then
    raise exception 'Solo un administrador activo puede listar profesores.';
  end if;

  return query
    select
      p.id,
      p.full_name,
      p.status,
      p.teacher_code,
      p.login_code,
      p.created_at,
      (
        select count(*)
        from public.profiles s
        where s.teacher_id = p.id
      ) as student_count
    from public.profiles p
    where p.role = 'teacher'
    order by p.created_at desc;
end;
$$;

comment on function public.admin_list_teachers() is
  'Lista de profesores con cantidad de alumnos, para el panel de '
  'admin. Rechaza la llamada si quien la invoca no es admin activo.';

-- ---------------------------------------------------------
-- Trigger: un profesor solo puede cambiar de status a través del
-- panel de admin. Protege role/login_code/teacher_code/teacher_id/
-- full_name/id de cualquier UPDATE que llegue por el camino normal de
-- un usuario autenticado (RLS). Operaciones directas (SQL Editor,
-- claves de servicio — p. ej. promover manualmente a un profesor a
-- admin) NO pasan por este chequeo: solo se aplica cuando el rol de
-- Postgres de quien ejecuta es 'authenticated'.
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
  end if;

  return new;
end;
$$;

drop trigger if exists protect_teacher_profile_fields_trigger on public.profiles;
create trigger protect_teacher_profile_fields_trigger
  before update on public.profiles
  for each row
  execute function public.protect_teacher_profile_fields();

-- ---------------------------------------------------------
-- Políticas RLS: el admin activo gestiona profesores.
-- Todo lo demás sigue cerrado (alumnos y otros roles no ganan nada).
-- ---------------------------------------------------------
create policy "El admin activo puede ver los perfiles de profesores"
  on public.profiles
  for select
  using (public.is_active_admin() and role = 'teacher');

create policy "El admin activo puede cambiar el status de un profesor"
  on public.profiles
  for update
  using (public.is_active_admin() and role = 'teacher')
  with check (public.is_active_admin() and role = 'teacher');

create policy "El admin activo puede eliminar profesores"
  on public.profiles
  for delete
  using (public.is_active_admin() and role = 'teacher');

commit;
