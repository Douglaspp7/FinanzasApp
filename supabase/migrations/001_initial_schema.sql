-- AgendaPro LATAM — Initial Schema
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles: owner can read" on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner can update" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.businesses (
  id                    uuid primary key default uuid_generate_v4(),
  owner_id              uuid not null references public.profiles(id) on delete cascade,
  name                  text not null,
  profession            text not null,
  country               text not null default 'MX',
  timezone              text not null default 'America/Mexico_City',
  currency              text not null default 'MXN',
  primary_color         text not null default '#6366f1',
  logo_url              text,
  phone                 text,
  address               text,
  plan                  text not null default 'free' check (plan in ('free','starter','pro','business','enterprise')),
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table public.businesses enable row level security;
create policy "businesses: owner can all" on public.businesses for all using (auth.uid() = owner_id);

create table if not exists public.clients (
  id           uuid primary key default uuid_generate_v4(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  full_name    text not null,
  phone        text,
  whatsapp     text,
  email        text,
  birthday     date,
  notes        text,
  total_spent  numeric(12,2) not null default 0,
  last_visit   date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.clients enable row level security;
create policy "clients: business owner" on public.clients for all using (
  exists (select 1 from public.businesses b where b.id = clients.business_id and b.owner_id = auth.uid())
);
create index idx_clients_business_id on public.clients(business_id);
create index idx_clients_full_name_trgm on public.clients using gin(full_name gin_trgm_ops);

create table if not exists public.services (
  id                 uuid primary key default uuid_generate_v4(),
  business_id        uuid not null references public.businesses(id) on delete cascade,
  name               text not null,
  description        text,
  price              numeric(12,2) not null default 0,
  duration_minutes   int not null default 60,
  category           text,
  color              text not null default '#6366f1',
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.services enable row level security;
create policy "services: business owner" on public.services for all using (
  exists (select 1 from public.businesses b where b.id = services.business_id and b.owner_id = auth.uid())
);

create table if not exists public.appointments (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  service_id  uuid references public.services(id) on delete set null,
  title       text not null,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  status      text not null default 'scheduled' check (status in ('scheduled','confirmed','completed','cancelled','no_show')),
  notes       text,
  price       numeric(12,2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.appointments enable row level security;
create policy "appointments: business owner" on public.appointments for all using (
  exists (select 1 from public.businesses b where b.id = appointments.business_id and b.owner_id = auth.uid())
);
create index idx_appointments_business_id on public.appointments(business_id);
create index idx_appointments_start_at on public.appointments(start_at);

create table if not exists public.products (
  id                      uuid primary key default uuid_generate_v4(),
  business_id             uuid not null references public.businesses(id) on delete cascade,
  name                    text not null,
  description             text,
  price                   numeric(12,2) not null default 0,
  cost                    numeric(12,2),
  stock_quantity          int not null default 0,
  stock_alert_threshold   int not null default 5,
  supplier                text,
  category                text,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products: business owner" on public.products for all using (
  exists (select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid())
);

create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  appointment_id  uuid references public.appointments(id) on delete set null,
  type            text not null check (type in ('income','expense')),
  amount          numeric(12,2) not null,
  description     text not null,
  category        text not null,
  date            date not null,
  payment_method  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "transactions: business owner" on public.transactions for all using (
  exists (select 1 from public.businesses b where b.id = transactions.business_id and b.owner_id = auth.uid())
);
create index idx_transactions_business_id on public.transactions(business_id);
create index idx_transactions_date on public.transactions(date);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.businesses for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.clients for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.services for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.appointments for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.transactions for each row execute procedure public.set_updated_at();
