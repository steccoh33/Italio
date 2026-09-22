-- =========================================================
-- Italio — Etapa 1a: estructura de base de datos
-- Roles, estados, perfiles, clases y relación alumno-clase.
-- Todavía SIN pantallas de registro/login (próximo paso).
-- =========================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Tipos enum
-- ---------------------------------------------------------
create type public.user_role as enum ('admin', 'teacher', 'student');
create type public.user_status as enum ('pending', 'active', 'paused');

-- ---------------------------------------------------------
-- Tabla profiles: un registro por usuario, ligado a auth.users
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  status public.user_status not null default 'pending',
  full_name text,
  teacher_code text unique,
  teacher_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profiles_teacher_code_format check (
    teacher_code is null or teacher_code ~ '^[A-Z]{3}-[0-9]{3}$'
  ),
  constraint profiles_teacher_code_only_for_staff check (
    role in ('teacher', 'admin') or teacher_code is null
  ),
  constraint profiles_teacher_id_only_for_students check (
    role = 'student' or teacher_id is null
  )
);

comment on table public.profiles is
  'Un registro por usuario, ligado 1:1 a auth.users.';
comment on column public.profiles.teacher_code is
  'Código único del profesor/admin (formato LLL-DDD, ej. MRC-482). Null para alumnos.';
comment on column public.profiles.teacher_id is
  'Profesor al que pertenece un alumno. Null para profesores/admin.';

-- ---------------------------------------------------------
-- Tabla classes: clases de cada profesor
-- ---------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.classes is 'Clases creadas por cada profesor.';

-- ---------------------------------------------------------
-- Tabla class_students: relación muchos a muchos alumno <-> clase
-- ---------------------------------------------------------
create table public.class_students (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

comment on table public.class_students is
  'Relación muchos a muchos entre alumnos y clases.';

-- ---------------------------------------------------------
-- Función: generar un teacher_code único (formato LLL-DDD)
-- ---------------------------------------------------------
create or replace function public.generate_teacher_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  letters text;
  digits text;
  candidate text;
  i int;
begin
  loop
    letters := '';
    for i in 1..3 loop
      letters := letters || chr(65 + floor(random() * 26)::int);
    end loop;

    digits := lpad(floor(random() * 1000)::int::text, 3, '0');
    candidate := letters || '-' || digits;

    exit when not exists (
      select 1 from public.profiles where teacher_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

comment on function public.generate_teacher_code() is
  'Genera un código único de profesor/admin con formato LLL-DDD (ej: MRC-482).';

-- ---------------------------------------------------------
-- Trigger: crear el perfil al registrarse (auth.users AFTER INSERT)
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
  linked_teacher_id uuid;
begin
  requested_role := new.raw_user_meta_data ->> 'role';
  requested_full_name := new.raw_user_meta_data ->> 'full_name';

  -- Un usuario NUNCA puede auto-asignarse 'admin' (ni ningún otro valor
  -- que no sea 'teacher' o 'student') desde el registro. El rol 'admin'
  -- se asigna después, a mano, con un UPDATE directo sobre profiles.
  if requested_role not in ('teacher', 'student') then
    raise exception
      'Rol de registro inválido: "%". Solo se permite "teacher" o "student".',
      coalesce(requested_role, 'null');
  end if;

  if requested_role = 'teacher' then
    insert into public.profiles (id, role, status, full_name, teacher_code)
    values (
      new.id,
      'teacher',
      'pending',
      requested_full_name,
      public.generate_teacher_code()
    );
  else
    requested_teacher_code := new.raw_user_meta_data ->> 'teacher_code';

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

    insert into public.profiles (id, role, status, full_name, teacher_id)
    values (
      new.id,
      'student',
      'pending',
      requested_full_name,
      linked_teacher_id
    );
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crea el perfil al registrarse, leyendo role/full_name/teacher_code de '
  'raw_user_meta_data. Rechaza el registro si el rol o el código de '
  'profesor no son válidos.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;

-- Política conservadora por ahora: cada usuario puede leer su propio
-- perfil. No existe ninguna política de INSERT/UPDATE/DELETE para
-- usuarios comunes, así que nadie puede cambiar su propio role, status,
-- teacher_code ni teacher_id desde la API. La creación del perfil la hace
-- el trigger de arriba con SECURITY DEFINER, que no pasa por RLS.
create policy "Los usuarios pueden ver su propio perfil"
  on public.profiles
  for select
  using (auth.uid() = id);

-- classes y class_students quedan con RLS activado y SIN políticas por
-- ahora: nadie (ni el propio profesor/alumno) puede leer ni escribir
-- todavía desde la API. Las políticas de administración llegan después:
--
--   - Etapa 2: el admin gestiona profesores (aprobar 'pending',
--     pausar/activar, etc.).
--   - Etapa 3: el profesor gestiona sus propias clases y sus alumnos
--     (via teacher_id); el alumno puede ver sus propias clases.
--
-- También queda pendiente para más adelante:
--
--   - Pausar a un profesor (status = 'paused') debe congelar el acceso
--     efectivo de sus alumnos. La regla de "acceso efectivo" será:
--       alumno.status = 'active'
--       AND profesor(alumno.teacher_id).status = 'active'
--     Se puede materializar como una función
--       public.has_effective_access(profile_id uuid) returns boolean
--     que las políticas de las etapas 2/3 usen en su `using (...)`.
--
--   - Eliminar un profesor debe eliminar a sus alumnos: esto ya está
--     cubierto por el `on delete cascade` de profiles.teacher_id, no
--     hace falta ningún trigger adicional para ese caso.

commit;
