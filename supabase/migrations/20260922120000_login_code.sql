-- =========================================================
-- Italio — Etapa 1c: login por frase de palabras (login_code)
-- Migración ADITIVA sobre 20260922070000_profiles_classes_schema.sql
-- No confirmar/registrar más con email+contraseña elegida por la
-- persona: el sistema genera un login_code (frase italiana) que
-- funciona como contraseña interna.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Columna: profiles.login_code
-- Frase legible (ej. "mela-fiume-verde") con la que la persona
-- inicia sesión. A propósito es legible/recordable: se sigue
-- mostrando en el panel mientras la cuenta esté pending/paused.
-- Nota: requiere que la tabla profiles esté vacía (o que todas
-- las filas existentes reciban un valor) para poder agregarla
-- como NOT NULL sin DEFAULT.
-- ---------------------------------------------------------
alter table public.profiles
  add column login_code text unique not null;

alter table public.profiles
  add constraint profiles_login_code_format check (
    login_code ~ '^[a-z]+(-[a-z]+){1,2}$'
  );

comment on column public.profiles.login_code is
  'Frase de palabras italianas (2 para alumno, 3 para profesor/admin) '
  'usada como código de acceso en lugar de contraseña. Distinta de '
  'teacher_code (el código corto para compartir).';

-- ---------------------------------------------------------
-- Función: generar un login_code único de N palabras italianas
-- ---------------------------------------------------------
create or replace function public.generate_login_code(word_count int)
returns text
language plpgsql
set search_path = public
as $$
declare
  words text[] := array[
    'mela','pera','uva','fragola','banana','limone','arancia','pesca',
    'ciliegia','ananas','kiwi','melone','cocco','fico','prugna','carota',
    'patata','pomodoro','cipolla','aglio','zucca','fungo','spinaci',
    'broccolo','sedano','ravanello','gatto','cane','cavallo','mucca',
    'pecora','capra','gallina','papera','coniglio','topo','orso','lupo',
    'volpe','cervo','leone','tigre','elefante','giraffa','zebra',
    'scimmia','pinguino','delfino','balena','aquila','gufo','farfalla',
    'ape','formica','ragno','tartaruga','rana','pesce','granchio',
    'polpo','riccio','scoiattolo','pipistrello','fiume','monte','mare',
    'lago','bosco','prato','cielo','sole','luna','stella','nuvola',
    'pioggia','neve','vento','fiore','albero','foglia','radice','sasso',
    'roccia','sabbia','spiaggia','valle','collina','isola','cascata',
    'deserto','vulcano','ghiaccio','arcobaleno','rosso','verde','blu',
    'giallo','viola','rosa','nero','bianco','grigio','marrone',
    'arancione','azzurro','dorato','argento','tavolo','sedia','porta',
    'finestra','lampada','libro','penna','chiave','orologio','specchio',
    'tazza','piatto','forchetta','cucchiaio','coltello','borsa',
    'cappello','scarpa','guanto','ombrello','valigia','scatola','cesto',
    'vaso','candela','cuscino','coperta','pane','formaggio','latte',
    'miele','zucchero','sale','pepe','riso','pasta','pizza','gelato',
    'torta','biscotto','cioccolato','giorno','notte','mattina','sera',
    'estate','inverno','primavera','autunno','mano','piede','cuore',
    'sorriso','casa','scuola','giardino','piazza','ponte','torre',
    'castello','chiesa','strada','musica','danza','gioco','sogno',
    'viaggio','amico','luce','ombra','tempo','vita','mondo','pianeta',
    'nave','treno','aereo','bicicletta','barca','stadio','teatro',
    'mercato','faro','mulino','vigna','orto','campo','fattoria','nido',
    'tana','grotta','cristallo','diamante'
  ];
  total int := array_length(words, 1);
  chosen text[];
  idx int;
  candidate text;
begin
  loop
    chosen := array[]::text[];

    while coalesce(array_length(chosen, 1), 0) < word_count loop
      idx := floor(random() * total)::int + 1;
      if not (words[idx] = any(chosen)) then
        chosen := chosen || words[idx];
      end if;
    end loop;

    candidate := array_to_string(chosen, '-');

    exit when not exists (
      select 1 from public.profiles where login_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

comment on function public.generate_login_code(int) is
  'Genera una frase única de word_count palabras italianas separadas '
  'por guion (ej. mela-fiume-verde), usada como login_code.';

-- ---------------------------------------------------------
-- Trigger handle_new_user: ahora también guarda login_code.
-- El servidor (Server Action) genera login_code de antemano y lo
-- pasa en raw_user_meta_data; si por algún motivo no viene, el
-- trigger genera uno como respaldo (mismo criterio que teacher_code).
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
      id, role, status, full_name, teacher_id, login_code
    )
    values (
      new.id,
      'student',
      'pending',
      requested_full_name,
      linked_teacher_id,
      requested_login_code
    );
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crea el perfil al registrarse, leyendo role/full_name/teacher_code/'
  'login_code de raw_user_meta_data. Rechaza el registro si el rol o el '
  'código de profesor no son válidos. Genera login_code (y teacher_code '
  'para profesores) como respaldo si no vinieron en los metadatos.';

commit;
