-- =========================================================
-- Italio — Etapa 4 (fix): la política SELECT de writings no puede
-- llamar a una función que vuelva a consultar writings, porque en un
-- INSERT ... RETURNING esa función no ve la fila recién insertada y
-- el insert falla con 42501. Se evalúa directo sobre las columnas de
-- la propia fila.
-- =========================================================

begin;

drop policy "Ver los propios escritos o los de los propios alumnos"
  on public.writings;

create policy "Ver los propios escritos o los de los propios alumnos"
  on public.writings
  for select
  using (
    student_id = auth.uid()
    or (
      (public.is_active_teacher() or public.is_active_admin())
      and public.owns_student(student_id)
    )
  );

commit;
