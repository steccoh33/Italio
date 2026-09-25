-- =========================================================
-- Italio — Tareas por clase (assignments)
-- Migración ADITIVA sobre las anteriores.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Helpers SECURITY DEFINER (evitan recursión de RLS y permiten que el
-- alumno consulte SU pertenencia sin poder leer class_students).
-- ---------------------------------------------------------
create or replace function public.is_class_member(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.class_students
    where class_id = p_class_id
      and student_id = auth.uid()
  );
$$;

comment on function public.is_class_member(uuid) is
  'true si el usuario autenticado es alumno de esa clase (fila en '
  'class_students). SECURITY DEFINER porque el alumno no tiene SELECT '
  'sobre class_students.';

-- ---------------------------------------------------------
-- Tabla assignments
-- ---------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  instructions text not null,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

create index assignments_class_id_idx on public.assignments (class_id);

comment on table public.assignments is
  'Tareas/consignas de escritura que un profesor asigna a una de sus clases.';

-- Se define después de la tabla porque su cuerpo la referencia.
create or replace function public.can_submit_assignment(p_assignment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.assignments a
    join public.class_students cs on cs.class_id = a.class_id
    where a.id = p_assignment_id
      and cs.student_id = auth.uid()
  );
$$;

comment on function public.can_submit_assignment(uuid) is
  'true si el usuario autenticado pertenece a la clase de esa tarea.';

alter table public.assignments enable row level security;

create policy "El profesor activo ve las tareas de sus clases; el alumno las de sus clases"
  on public.assignments
  for select
  using (
    (
      (public.is_active_teacher() or public.is_active_admin())
      and public.owns_class(class_id)
    )
    or public.is_class_member(class_id)
  );

create policy "El profesor activo crea tareas en sus propias clases"
  on public.assignments
  for insert
  with check (
    (public.is_active_teacher() or public.is_active_admin())
    and public.owns_class(class_id)
    and teacher_id = auth.uid()
  );

create policy "El profesor activo edita las tareas de sus propias clases"
  on public.assignments
  for update
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and public.owns_class(class_id)
  )
  with check (
    (public.is_active_teacher() or public.is_active_admin())
    and public.owns_class(class_id)
    and teacher_id = auth.uid()
  );

create policy "El profesor activo elimina las tareas de sus propias clases"
  on public.assignments
  for delete
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and public.owns_class(class_id)
  );

-- ---------------------------------------------------------
-- El alumno puede ver el nombre de las clases a las que pertenece
-- (para mostrar "de qué clase es" cada tarea).
-- ---------------------------------------------------------
create policy "El alumno ve las clases a las que pertenece"
  on public.classes
  for select
  using (public.is_class_member(id));

-- ---------------------------------------------------------
-- writings.assignment_id: vincula una respuesta a una tarea. Sin
-- assignment_id = escritura libre. Si se borra la tarea, las entregas
-- se conservan como escritos libres.
-- ---------------------------------------------------------
alter table public.writings
  add column assignment_id uuid references public.assignments (id) on delete set null;

create index writings_assignment_id_idx on public.writings (assignment_id);

comment on column public.writings.assignment_id is
  'Tarea a la que responde este escrito. Null = escritura libre.';

-- Insert de writings: igual que antes, y además, si trae assignment_id,
-- el alumno debe pertenecer a la clase de esa tarea.
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
  );

commit;
