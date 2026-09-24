-- =========================================================
-- Italio — Etapa 4: el corrector de escritos (CILS)
-- Migración ADITIVA sobre las anteriores.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Nivel CILS objetivo del alumno.
-- ---------------------------------------------------------
create type public.cils_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

alter table public.profiles
  add column target_level public.cils_level;

alter table public.profiles
  add constraint profiles_target_level_rules check (
    (role = 'student' and target_level is not null)
    or (role in ('teacher', 'admin') and target_level is null)
  );

comment on column public.profiles.target_level is
  'Nivel CILS que el alumno eligió rendir/alcanzar. Obligatorio para '
  'alumnos, null para profesor/admin.';

-- ---------------------------------------------------------
-- Trigger handle_new_user: ahora también guarda target_level para
-- los alumnos, leído de raw_user_meta_data.
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  requested_full_name text;
  requested_teacher_code text;
  requested_login_code text;
  requested_target_level text;
  linked_teacher_id uuid;
begin
  requested_role := new.raw_user_meta_data ->> 'role';
  requested_full_name := new.raw_user_meta_data ->> 'full_name';
  requested_login_code := new.raw_user_meta_data ->> 'login_code';

  -- Un usuario NUNCA puede auto-asignarse 'admin' (ni ningún otro valor
  -- que no sea 'teacher' o 'student') desde el registro. El rol 'admin'
  -- se asigna después, a mano, con un UPDATE directo sobre profiles.
  if requested_role not in ('teacher', 'student') then
    raise exception
      'Rol de registro inválido: "%". Solo se permite "teacher" o "student".',
      coalesce(requested_role, 'null');
  end if;

  if requested_role = 'teacher' then
    if requested_login_code is null or requested_login_code = '' then
      requested_login_code := public.generate_login_code(3);
    end if;

    insert into public.profiles (
      id, role, status, full_name, teacher_code, login_code
    )
    values (
      new.id,
      'teacher',
      'pending',
      requested_full_name,
      public.generate_teacher_code(),
      requested_login_code
    );
  else
    requested_teacher_code := new.raw_user_meta_data ->> 'teacher_code';
    requested_target_level := new.raw_user_meta_data ->> 'target_level';

    if requested_target_level not in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') then
      raise exception
        'Nivel objetivo inválido: "%". Debe ser A1, A2, B1, B2, C1 o C2.',
        coalesce(requested_target_level, 'null');
    end if;

    select id into linked_teacher_id
    from public.profiles
    where teacher_code = requested_teacher_code
      and role in ('teacher', 'admin')
    limit 1;

    if linked_teacher_id is null then
      raise exception
        'Código de profesor inválido: "%". No corresponde a ningún profesor registrado.',
        coalesce(requested_teacher_code, 'null');
    end if;

    if requested_login_code is null or requested_login_code = '' then
      requested_login_code := public.generate_login_code(2);
    end if;

    insert into public.profiles (
      id, role, status, full_name, teacher_id, login_code, target_level
    )
    values (
      new.id,
      'student',
      'pending',
      requested_full_name,
      linked_teacher_id,
      requested_login_code,
      requested_target_level::public.cils_level
    );
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crea el perfil al registrarse, leyendo role/full_name/teacher_code/'
  'login_code/target_level de raw_user_meta_data. Rechaza el registro '
  'si el rol, el código de profesor o el nivel objetivo no son válidos.';

-- ---------------------------------------------------------
-- Tablas: writings (escritos) y corrections (correcciones de la IA)
-- ---------------------------------------------------------
create type public.writing_status as enum ('pending', 'corrected', 'error');
create type public.level_verdict as enum ('below', 'at', 'above');

create table public.writings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  target_level public.cils_level not null,
  prompt_text text,
  content text not null,
  status public.writing_status not null default 'pending',
  created_at timestamptz not null default now()
);

comment on table public.writings is
  'Escritos enviados por un alumno para corregir. target_level es una '
  'foto del nivel objetivo del alumno al momento de escribir.';

create table public.corrections (
  writing_id uuid primary key references public.writings (id) on delete cascade,
  corrected_text text not null,
  errors jsonb not null default '[]'::jsonb,
  assessment jsonb not null,
  level_verdict public.level_verdict not null,
  level_demonstrated public.cils_level not null,
  general_comment text not null,
  created_at timestamptz not null default now()
);

comment on table public.corrections is
  'Resultado de la corrección de la IA, 1:1 con writings (la clave '
  'primaria es writing_id). La escribe siempre el servidor con la '
  'service key, nunca el alumno directamente.';

-- ---------------------------------------------------------
-- Helper: ¿el usuario actual puede ver este writing? (es su propio
-- escrito, o es el profesor/admin dueño de ese alumno). SECURITY
-- DEFINER, análogo a owns_class()/owns_student(): se usa también
-- desde la política de SELECT de corrections, sobre la tabla
-- writings, para no depender de que la RLS de writings ya lo filtre.
-- ---------------------------------------------------------
create or replace function public.can_access_writing(p_writing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_student_id uuid;
begin
  select student_id into v_student_id
  from public.writings
  where id = p_writing_id;

  if v_student_id is null then
    return false;
  end if;

  if v_student_id = auth.uid() then
    return true;
  end if;

  return (public.is_active_teacher() or public.is_active_admin())
    and public.owns_student(v_student_id);
end;
$$;

comment on function public.can_access_writing(uuid) is
  'true si el usuario autenticado puede ver este writing: es su '
  'propio escrito, o es el profesor/admin activo dueño de ese alumno.';

-- ---------------------------------------------------------
-- RLS: writings
-- El alumno solo puede INSERTAR con su propio id y en estado
-- 'pending' (la corrección y el cambio de status a corrected/error
-- los hace el servidor con la service key, que bypassea RLS). No hay
-- política de UPDATE/DELETE para usuarios comunes.
-- ---------------------------------------------------------
alter table public.writings enable row level security;

create policy "Ver los propios escritos o los de los propios alumnos"
  on public.writings
  for select
  using (public.can_access_writing(id));

create policy "El alumno crea sus propios escritos como pending"
  on public.writings
  for insert
  with check (student_id = auth.uid() and status = 'pending');

-- ---------------------------------------------------------
-- RLS: corrections
-- Solo lectura para alumno/profesor/admin. Nadie tiene INSERT/UPDATE/
-- DELETE: esas filas las escribe exclusivamente el servidor con la
-- service key (que bypassea RLS por completo).
-- ---------------------------------------------------------
alter table public.corrections enable row level security;

create policy "Ver las correcciones de los propios escritos"
  on public.corrections
  for select
  using (public.can_access_writing(writing_id));

commit;
