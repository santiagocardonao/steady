create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  estatura_cm numeric,
  meta_peso text check (meta_peso in ('bajar','subir','mantener')) default 'mantener',
  peso_objetivo_kg numeric,
  meta_agua_vasos int not null default 8,
  creado_en timestamptz not null default now()
);
grant select, insert, update, delete on public.perfiles to authenticated;
grant all on public.perfiles to service_role;
alter table public.perfiles enable row level security;
create policy "perfil propio" on public.perfiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.categorias (
  id serial primary key,
  nombre text not null,
  tipo text not null check (tipo in ('fuerza','cardio')),
  orden int not null default 0
);
grant select on public.categorias to authenticated;
grant all on public.categorias to service_role;
alter table public.categorias enable row level security;
create policy "categorias lectura" on public.categorias for select to authenticated using (true);

create table public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  categoria_id int not null references public.categorias(id),
  nombre text not null,
  es_default boolean not null default false,
  creado_en timestamptz not null default now()
);
grant select, insert, update, delete on public.ejercicios to authenticated;
grant all on public.ejercicios to service_role;
alter table public.ejercicios enable row level security;
create policy "ejercicios lectura" on public.ejercicios for select to authenticated using (user_id is null or user_id = auth.uid());
create policy "ejercicios insert propio" on public.ejercicios for insert to authenticated with check (user_id = auth.uid());
create policy "ejercicios update propio" on public.ejercicios for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ejercicios delete propio" on public.ejercicios for delete to authenticated using (user_id = auth.uid());

create table public.entrenamientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  ejercicio_id uuid not null references public.ejercicios(id),
  tipo text not null check (tipo in ('fuerza','cardio')),
  rpe int check (rpe between 1 and 10),
  duracion_min int,
  notas text,
  creado_en timestamptz not null default now()
);
grant select, insert, update, delete on public.entrenamientos to authenticated;
grant all on public.entrenamientos to service_role;
alter table public.entrenamientos enable row level security;
create policy "entrenamientos propios" on public.entrenamientos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  entrenamiento_id uuid not null references public.entrenamientos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  numero_serie int not null,
  repeticiones int,
  peso_kg numeric
);
grant select, insert, update, delete on public.series to authenticated;
grant all on public.series to service_role;
alter table public.series enable row level security;
create policy "series propias" on public.series for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.peso_corporal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  peso_kg numeric not null,
  creado_en timestamptz not null default now(),
  unique (user_id, fecha)
);
grant select, insert, update, delete on public.peso_corporal to authenticated;
grant all on public.peso_corporal to service_role;
alter table public.peso_corporal enable row level security;
create policy "peso propio" on public.peso_corporal for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.agua (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  vasos int not null default 0,
  creado_en timestamptz not null default now(),
  unique (user_id, fecha)
);
grant select, insert, update, delete on public.agua to authenticated;
grant all on public.agua to service_role;
alter table public.agua enable row level security;
create policy "agua propia" on public.agua for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.categorias (nombre, tipo, orden) values
 ('Hombro','fuerza',1),('Pecho','fuerza',2),('Espalda','fuerza',3),('Bíceps','fuerza',4),
 ('Tríceps','fuerza',5),('Isquiotibial','fuerza',6),('Cuádriceps','fuerza',7),('Gemelos','fuerza',8),
 ('Abdomen','fuerza',9),('Cardio en banda','cardio',10),('Cardio en bicicleta','cardio',11),
 ('Bicicleta elíptica','cardio',12);

insert into public.ejercicios (user_id, categoria_id, nombre, es_default)
select null, c.id, e.nombre, true
from (values
 ('Hombro','Press militar'),('Hombro','Press Arnold'),('Hombro','Elevaciones laterales'),('Hombro','Elevaciones frontales'),('Hombro','Vuelos posteriores (pájaros)'),('Hombro','Remo al mentón'),('Hombro','Face pull'),
 ('Pecho','Press de banca plano'),('Pecho','Press inclinado'),('Pecho','Press declinado'),('Pecho','Aperturas con mancuerna'),('Pecho','Cruce de poleas'),('Pecho','Press en máquina'),('Pecho','Fondos en paralelas'),
 ('Espalda','Dominadas'),('Espalda','Jalón al pecho'),('Espalda','Remo con barra'),('Espalda','Remo con mancuerna'),('Espalda','Remo en polea baja'),('Espalda','Peso muerto'),('Espalda','Pull-over'),
 ('Bíceps','Curl con barra'),('Bíceps','Curl con mancuerna'),('Bíceps','Curl martillo'),('Bíceps','Curl predicador'),
 ('Tríceps','Extensión en polea (cuerda)'),('Tríceps','Press francés'),('Tríceps','Fondos en banco'),('Tríceps','Patada de tríceps'),('Tríceps','Extensión sobre la cabeza'),
 ('Isquiotibial','Curl femoral tumbado'),('Isquiotibial','Curl femoral sentado'),('Isquiotibial','Peso muerto rumano'),('Isquiotibial','Buenos días'),
 ('Cuádriceps','Sentadilla'),('Cuádriceps','Prensa de pierna'),('Cuádriceps','Extensión de cuádriceps'),('Cuádriceps','Zancadas'),('Cuádriceps','Sentadilla búlgara'),('Cuádriceps','Hip thrust'),
 ('Gemelos','Elevación de talones de pie'),('Gemelos','Elevación de talones sentado'),('Gemelos','Elevación de talones en prensa'),
 ('Abdomen','Crunch'),('Abdomen','Elevación de piernas'),('Abdomen','Plancha'),('Abdomen','Rueda abdominal'),('Abdomen','Crunch en polea'),('Abdomen','Giro ruso'),
 ('Cardio en banda','Caminadora / trote en banda'),
 ('Cardio en bicicleta','Bicicleta estática'),
 ('Bicicleta elíptica','Elíptica')
) as e(categoria, nombre)
join public.categorias c on c.nombre = e.categoria;