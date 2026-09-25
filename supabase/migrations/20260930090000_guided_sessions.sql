-- =========================================================
-- Italio — Escritura guiada (Etapa B): sesiones guardadas
-- Migración ADITIVA sobre las anteriores.
--
-- Se guarda la sesión (consigna + estado + resumen opcional del plan)
-- y el texto final con su corrección (un writing normal vinculado por
-- guided_session_id). No se guarda cada mensaje de la conversación.
-- =========================================================

begin;

create type public.guided_session_status as enum ('in_progress', 'completed');

create table public.guided_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  target_level public.cils_level not null,
  prompt_text text not null,
  plan_summary text,
  status public.guided_session_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index guided_sessions_student_id_idx on public.guided_sessions (student_id);

comment on table public.guided_sessions is
  'Sesiones de escritura guiada: consigna que usó el alumno, estado y '
  'un resumen opcional del plan que armó. El texto final es un writing '
  'vinculado por writings.guided_session_id.';

-- Helper SECURITY DEFINER: ¿esta sesión es del usuario actual?
create or replace function public.owns_guided_session(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.guided_sessions
    where id = p_session_id
      and student_id = auth.uid()
  );
$$;

comment on function public.owns_guided_session(uuid) is
  'true si la sesión guiada pertenece al usuario autenticado.';

alter table public.guided_sessions enable row level security;

-- Ve sus propias sesiones; el profesor/admin activo ve las de SUS alumnos.
create policy "Ver las propias sesiones guiadas o las de los propios alumnos"
  on public.guided_sessions
  for select
  using (
    student_id = auth.uid()
    or (
      (public.is_active_teacher() or public.is_active_admin())
      and public.owns_student(student_id)
    )
  );

-- El alumno crea SUS sesiones, siempre en curso. Pasar a 'completed' lo
-- hace solo el servidor (service key), tras corregir el texto: no hay
-- política de UPDATE ni DELETE para usuarios comunes.
create policy "El alumno crea sus propias sesiones guiadas en curso"
  on public.guided_sessions
  for insert
  with check (
    student_id = auth.uid()
    and status = 'in_progress'
    and completed_at is null
  );

-- ---------------------------------------------------------
-- writings.guided_session_id
-- Un writing puede ser: libre, de tarea (assignment_id) o de escritura
-- guiada (guided_session_id).
-- ---------------------------------------------------------
alter table public.writings
  add column guided_session_id uuid references public.guided_sessions (id) on delete set null;

create index writings_guided_session_id_idx on public.writings (guided_session_id);

comment on column public.writings.guided_session_id is
  'Sesión de escritura guiada a la que pertenece este texto. Null = no es guiado.';

-- Un solo texto válido por sesión (los 'error' no cuentan: se puede reintentar).
create unique index writings_one_text_per_guided_session_idx
  on public.writings (guided_session_id)
  where guided_session_id is not null
    and status <> 'error';

-- Insert de writings: mantiene lo anterior (propio, pending, tarea de su
-- clase) y suma que la sesión guiada, si viene, sea del propio alumno.
drop policy "El alumno crea sus propios escritos como pending" on public.writings;

create policy "El alumno crea sus propios escritos como pending"
  on public.writings
  for insert
  with check (
    student_id = auth.uid()
    and status = 'pending'
    and (
      assignment_id is null
      or public.can_submit_assignment(assignment_id)
    )
    and (
      guided_session_id is null
      or public.owns_guided_session(guided_session_id)
    )
  );

commit;
