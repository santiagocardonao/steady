create extension if not exists pg_cron;

create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d int;
  f date;
  entreno uuid;
  ex record;
  s int;
  prog numeric;
  n int := 0;
  ejs text[] := array['Press de banca plano','Sentadilla','Jalón al pecho','Curl con mancuerna','Press militar'];
  ini numeric[] := array[40,50,35,8,20];
  fin numeric[] := array[47.5,60,42.5,11,25];
  paso numeric[] := array[2.5,2.5,2.5,1,2.5];
  i int;
  kg numeric;
  cardio_id uuid;
begin
  if uid is null then raise exception 'No autenticado'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) is not true then
    raise exception 'Solo disponible en modo demo';
  end if;
  if exists (select 1 from entrenamientos where user_id = uid)
     or exists (select 1 from peso_corporal where user_id = uid) then
    return;
  end if;

  insert into perfiles (id, nombre, estatura_cm, meta_peso, peso_objetivo_kg, meta_agua_vasos)
  values (uid, 'Invitado', 172, 'bajar', 78, 8)
  on conflict (id) do update set nombre = excluded.nombre, estatura_cm = excluded.estatura_cm,
    meta_peso = excluded.meta_peso, peso_objetivo_kg = excluded.peso_objetivo_kg,
    meta_agua_vasos = excluded.meta_agua_vasos;

  for d in reverse 55..0 loop
    f := current_date - d;
    prog := (55 - d)::numeric / 55;

    -- Agua diaria
    insert into agua (user_id, fecha, vasos) values (uid, f,
      case when random() < 0.6 then 8 + floor(random()*2)::int else 5 + floor(random()*3)::int end);

    -- Peso 3-4 por semana
    if d % 7 in (0, 2, 4) or (d % 14 = 6) then
      insert into peso_corporal (user_id, fecha, peso_kg)
      values (uid, f, round((84 - 2.5*prog + (random()*0.6 - 0.3))::numeric, 1));
    end if;

    -- Entrenamientos: hoy y 3 días antes; racha mejor (7 días) hace ~5 semanas; resto 3-4/semana
    if d <= 3 or d between 34 and 40 or (d > 3 and d % 7 in (1, 3, 5)) or (d > 3 and d % 14 = 6) then
      n := n + 1;
      for i in select unnest(array[((n*2) % 5) + 1, ((n*2+1) % 5) + 1]) loop
        select id into entreno from ejercicios where nombre = ejs[i] and user_id is null limit 1;
        if entreno is null then continue; end if;
        kg := ini[i] + (fin[i]-ini[i])*prog;
        kg := round(kg / paso[i]) * paso[i];
        insert into entrenamientos (user_id, fecha, ejercicio_id, tipo)
          values (uid, f, entreno, 'fuerza') returning id into entreno;
        for s in 1..(3 + floor(random()*2)::int) loop
          insert into series (entrenamiento_id, user_id, numero_serie, repeticiones, peso_kg)
          values (entreno, uid, s, 8 + floor(random()*5)::int, kg);
        end loop;
      end loop;

      if n % 3 = 0 then
        select id into cardio_id from ejercicios
          where user_id is null and nombre = case when n % 2 = 0 then 'Elíptica' else 'Caminadora / trote en banda' end limit 1;
        if cardio_id is not null then
          insert into entrenamientos (user_id, fecha, ejercicio_id, tipo, rpe, duracion_min)
          values (uid, f, cardio_id, 'cardio', 5 + floor(random()*4)::int, 20 + floor(random()*16)::int);
        end if;
      end if;
    end if;
  end loop;
end;
$$;

revoke all on function public.seed_demo_data() from public, anon;
grant execute on function public.seed_demo_data() to authenticated;

create or replace function public.limpiar_usuarios_demo()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where is_anonymous = true and created_at < now() - interval '24 hours';
$$;
revoke all on function public.limpiar_usuarios_demo() from public, anon, authenticated;

select cron.schedule('limpiar-usuarios-demo', '0 * * * *', 'select public.limpiar_usuarios_demo()');