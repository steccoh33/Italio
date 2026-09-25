-- =========================================================
-- Italio — Una sola entrega por alumno y tarea (a nivel de base)
-- Migración ADITIVA sobre 20260928090000_assignments.sql
--
-- Índice único parcial: no puede haber más de un writing del mismo
-- alumno para la misma tarea. Los escritos con status 'error' (la
-- corrección falló) no cuentan, para que el alumno pueda reintentar.
-- Un 'pending' sí cuenta: bloquea envíos simultáneos duplicados.
-- Los escritos libres (assignment_id null) no se ven afectados.
-- =========================================================

begin;

create unique index writings_one_submission_per_assignment_idx
  on public.writings (student_id, assignment_id)
  where assignment_id is not null
    and status <> 'error';

comment on index public.writings_one_submission_per_assignment_idx is
  'Un solo escrito (pending o corrected) por alumno y tarea. Los '
  'escritos en error no cuentan, así se puede reintentar.';

commit;
