-- El Padré (Tlemcen) — contenu du site, isolé dans le schéma « elpadre ». Idempotent.
create schema if not exists elpadre;
grant usage on schema elpadre to anon, authenticated, service_role;

create table if not exists elpadre.admins (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table elpadre.admins enable row level security;
create or replace function elpadre.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from elpadre.admins a where a.user_id = auth.uid());
$$;
grant execute on function elpadre.is_admin() to anon, authenticated;
drop policy if exists "admins: soi-même" on elpadre.admins;
create policy "admins: soi-même" on elpadre.admins for select to authenticated using (user_id = auth.uid() or elpadre.is_admin());

create table if not exists elpadre.site_content (
  id integer primary key default 1 check (id = 1),
  data jsonb not null check (jsonb_typeof(data) = 'object') check (octet_length(data::text) <= 524288),
  updated_at timestamptz not null default now(), updated_by uuid);
create table if not exists elpadre.site_content_history (
  id bigint generated always as identity primary key, saved_at timestamptz not null default now(), saved_by uuid, data jsonb not null);
create or replace function elpadre.site_content_before_update() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.data is distinct from old.data then
    insert into elpadre.site_content_history (saved_by, data) values (old.updated_by, old.data);
    delete from elpadre.site_content_history where id not in (select id from elpadre.site_content_history order by id desc limit 50);
  end if;
  new.updated_at := now(); new.updated_by := auth.uid(); new.id := old.id; return new;
end; $$;
drop trigger if exists trg_before_update on elpadre.site_content;
create trigger trg_before_update before update on elpadre.site_content for each row execute function elpadre.site_content_before_update();

alter table elpadre.site_content enable row level security;
alter table elpadre.site_content_history enable row level security;
drop policy if exists "contenu: lecture publique" on elpadre.site_content;
create policy "contenu: lecture publique" on elpadre.site_content for select to anon, authenticated using (true);
drop policy if exists "contenu: modif admin" on elpadre.site_content;
create policy "contenu: modif admin" on elpadre.site_content for update to authenticated using (elpadre.is_admin()) with check (elpadre.is_admin());
drop policy if exists "historique: lecture admin" on elpadre.site_content_history;
create policy "historique: lecture admin" on elpadre.site_content_history for select to authenticated using (elpadre.is_admin());

grant select on elpadre.site_content to anon, authenticated;
grant update on elpadre.site_content to authenticated;
grant select on elpadre.site_content_history, elpadre.admins to authenticated;

-- Photos : bucket public « images », fichiers « up-elpadre_… »
drop policy if exists "images : ajout admin elpadre" on storage.objects;
create policy "images : ajout admin elpadre" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and elpadre.is_admin() and name ~ '^up-elpadre_[a-z0-9]+-[0-9]+\.(webp|jpg|png)$');
