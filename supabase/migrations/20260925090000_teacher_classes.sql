-- =========================================================
-- Italio — Etapa 3b: clases dentro del panel del profesor
-- Migración ADITIVA sobre las anteriores.
-- Un profesor activo (o admin activo, "profesor máster") gestiona
-- SOLO sus propias clases (classes.teacher_id = auth.uid()) y solo
-- puede vincular en ellas a sus propios alumnos
-- (profiles.teacher_id = auth.uid()). Todo lo demás sigue cerrado.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Helpers: ¿esta clase / este alumno le pertenecen al usuario
-- actual? SECURITY DEFINER para evaluarlos de forma explícita y
-- directa dentro de las políticas de class_students, en vez de
-- depender de subconsultas implícitamente filtradas por otras RLS.
-- ---------------------------------------------------------
create or replace function public.owns_class(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.classes
    where id = p_class_id
      and teacher_id = auth.uid()
  );
$$;

comment on function public.owns_class(uuid) is
  'true si la clase p_class_id le pertenece al usuario autenticado '
  '(su teacher_id = auth.uid()). SECURITY DEFINER, análogo a '
  'is_active_admin()/is_active_teacher().';

create or replace function public.owns_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_student_id
      and role = 'student'
      and teacher_id = auth.uid()
  );
$$;

comment on function public.owns_student(uuid) is
  'true si el alumno p_student_id le pertenece al usuario autenticado '
  '(su teacher_id = auth.uid()). SECURITY DEFINER, análogo a '
  'is_active_admin()/is_active_teacher().';

-- ---------------------------------------------------------
-- Políticas RLS: classes
-- ---------------------------------------------------------
create policy "El profesor activo puede ver sus propias clases"
  on public.classes
  for select
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and teacher_id = auth.uid()
  );

create policy "El profesor activo puede crear sus propias clases"
  on public.classes
  for insert
  with check (
    (public.is_active_teacher() or public.is_active_admin())
    and teacher_id = auth.uid()
  );

create policy "El profesor activo puede renombrar sus propias clases"
  on public.classes
  for update
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and teacher_id = auth.uid()
  )
  with check (
    (public.is_active_teacher() or public.is_active_admin())
    and teacher_id = auth.uid()
  );

create policy "El profesor activo puede eliminar sus propias clases"
  on public.classes
  for delete
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and teacher_id = auth.uid()
  );

-- ---------------------------------------------------------
-- Políticas RLS: class_students
-- Reforzadas con AMBAS condiciones (clase propia Y alumno propio) en
-- SELECT/INSERT/DELETE. No hace falta política de UPDATE: agregar o
-- quitar a un alumno de una clase es un INSERT o un DELETE, la fila
-- no tiene columnas mutables además de la clave.
--
-- Al eliminar una clase, estas filas se borran solas (on delete
-- cascade sobre class_id, ya definido en la etapa 1a) — el perfil del
-- alumno nunca se toca.
-- ---------------------------------------------------------
create policy "El profesor activo puede ver la composicion de sus clases"
  on public.class_students
  for select
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and public.owns_class(class_id)
    and public.owns_student(student_id)
  );

create policy "El profesor activo puede agregar sus alumnos a sus clases"
  on public.class_students
  for insert
  with check (
    (public.is_active_teacher() or public.is_active_admin())
    and public.owns_class(class_id)
    and public.owns_student(student_id)
  );

create policy "El profesor activo puede quitar sus alumnos de sus clases"
  on public.class_students
  for delete
  using (
    (public.is_active_teacher() or public.is_active_admin())
    and public.owns_class(class_id)
    and public.owns_student(student_id)
  );

commit;
