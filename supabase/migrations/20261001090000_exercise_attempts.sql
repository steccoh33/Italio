-- =========================================================
-- Italio — "Analisi delle strutture": intentos de ejercicios
-- Migración ADITIVA sobre las anteriores.
--
-- Se guarda solo el resultado de cada intento (tipo, huecos y
-- aciertos) para las estadísticas. El ejercicio en sí (generado por
-- IA) no se guarda.
-- =========================================================

begin;

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  target_level public.cils_level not null,
  exercise_type text not null
    check (exercise_type in ('verbi', 'strutturale', 'cloze')),
  total_blanks integer not null check (total_blanks > 0),
  correct_count integer not null,
  created_at timestamptz not null default now(),
  constraint exercise_attempts_correct_in_range
    check (correct_count >= 0 and correct_count <= total_blanks)
);

create index exercise_attempts_student_id_idx
  on public.exercise_attempts (student_id, created_at);

comment on table public.exercise_attempts is
  'Resultado de cada ejercicio de "Analisi delle strutture" resuelto por un alumno.';

alter table public.exercise_attempts enable row level security;

-- Ve sus propios intentos; el profesor/admin activo ve los de SUS alumnos.
create policy "Ver los propios intentos de ejercicios o los de los propios alumnos"
  on public.exercise_attempts
  for select
  using (
    student_id = auth.uid()
    or (
      (public.is_active_teacher() or public.is_active_admin())
      and public.owns_student(student_id)
    )
  );

-- El alumno registra SUS intentos. No hay UPDATE ni DELETE para usuarios comunes.
create policy "El alumno registra sus propios intentos de ejercicios"
  on public.exercise_attempts
  for insert
  with check (student_id = auth.uid());

commit;
