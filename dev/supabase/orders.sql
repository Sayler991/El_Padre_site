-- El Padré — commandes en ligne (confirmées par téléphone). Prix recalculés côté serveur depuis site_content.
create table if not exists elpadre.orders (
  id bigint generated always as identity primary key,
  ref text not null check (ref ~ '^[A-Z0-9]{4,8}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  status text not null default 'en attente d''appel' check (status in ('en attente d''appel','confirmée','prête','annulée')),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 80),
  phone text not null check (phone ~ '^0[2-7][0-9]{7,8}$'),
  fulfillment text not null check (fulfillment in ('emporter','livraison')),
  address text check (address is null or char_length(address) <= 300),
  slot text not null check (char_length(slot) <= 40),
  note text check (note is null or char_length(note) <= 500),
  items jsonb not null check (jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 40 and octet_length(items::text) <= 16000),
  total_da integer not null default 0 check (total_da between 0 and 10000000),
  constraint orders_addr check (fulfillment <> 'livraison' or char_length(btrim(coalesce(address,''))) >= 5));
create index if not exists orders_created_idx on elpadre.orders (created_at desc);
create or replace function elpadre.orders_before_insert() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_menu jsonb; v_it jsonb; v_cat jsonb; v_item jsonb; v_out jsonb := '[]'::jsonb; v_price numeric; v_qty int; v_total numeric := 0; v_ex jsonb; v_exp numeric; v_extras jsonb; v_size text;
begin
  new.status := 'en attente d''appel'; new.created_at := now(); new.updated_at := now();
  new.phone := regexp_replace(new.phone, '[^0-9]', '', 'g');
  if (select count(*) from elpadre.orders where created_at > now() - interval '1 minute') >= 20 then raise exception 'Trop de commandes en ce moment, réessayez dans une minute.' using errcode='P0001'; end if;
  if (select count(*) from elpadre.orders where phone = new.phone and created_at > now() - interval '10 minutes') >= 3 then raise exception 'Plusieurs commandes déjà envoyées avec ce numéro : merci d''appeler le restaurant.' using errcode='P0001'; end if;
  select data->'menu' into v_menu from elpadre.site_content where id = 1;
  if coalesce((select (data->'order_options'->>'enabled')::boolean from elpadre.site_content where id=1), true) = false then raise exception 'La commande en ligne est momentanément fermée.' using errcode='P0001'; end if;
  for v_it in select * from jsonb_array_elements(new.items) loop
    v_cat := null; v_item := null;
    select c, i into v_cat, v_item from jsonb_array_elements(v_menu) c, jsonb_array_elements(c->'items') i
      where c->>'name' = v_it->>'cat' and i->>'name' = v_it->>'name' and coalesce((i->>'hidden')::boolean,false) = false limit 1;
    if v_item is null then raise exception 'Article indisponible : %', v_it->>'name' using errcode='P0001'; end if;
    v_price := nullif(regexp_replace(coalesce(v_item->>'price',''), '[^0-9.]', '', 'g'), '')::numeric; v_size := null;
    if jsonb_typeof(v_item->'sizes') = 'array' and jsonb_array_length(v_item->'sizes') > 0 then
      select s->>'name', nullif(regexp_replace(coalesce(s->>'price',''), '[^0-9.]', '', 'g'), '')::numeric into v_size, v_price
        from jsonb_array_elements(v_item->'sizes') s where s->>'name' = coalesce(v_it->>'size', v_item->'sizes'->0->>'name') limit 1;
      if v_size is null then raise exception 'Taille inconnue : %', v_it->>'name' using errcode='P0001'; end if;
    end if;
    v_qty := greatest(1, least(20, coalesce((v_it->>'qty')::int, 1))); v_extras := '[]'::jsonb;
    for v_ex in select * from jsonb_array_elements(case when jsonb_typeof(v_it->'extras')='array' then v_it->'extras' else '[]'::jsonb end) loop
      select nullif(regexp_replace(coalesce(e->>'price',''), '[^0-9.]', '', 'g'), '')::numeric into v_exp from jsonb_array_elements(coalesce(v_cat->'extras','[]'::jsonb)) e where e->>'name' = v_ex #>> '{}' limit 1;
      if not found then continue; end if;
      v_price := coalesce(v_price,0) + coalesce(v_exp,0); v_extras := v_extras || jsonb_build_object('name', v_ex #>> '{}', 'price', v_exp);
    end loop;
    v_total := v_total + coalesce(v_price,0) * v_qty;
    v_out := v_out || jsonb_build_object('cat', v_it->>'cat', 'name', v_it->>'name', 'size', v_size, 'qty', v_qty, 'unit', v_price, 'extras', v_extras, 'note', left(coalesce(v_it->>'note',''),120));
  end loop;
  new.items := v_out; new.total_da := round(v_total); return new;
end; $$;
drop trigger if exists trg_orders_before_insert on elpadre.orders;
create trigger trg_orders_before_insert before insert on elpadre.orders for each row execute function elpadre.orders_before_insert();
create or replace function elpadre.orders_before_update() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists trg_orders_before_update on elpadre.orders;
create trigger trg_orders_before_update before update on elpadre.orders for each row execute function elpadre.orders_before_update();
alter table elpadre.orders enable row level security;
drop policy if exists "commandes: envoi public" on elpadre.orders;
create policy "commandes: envoi public" on elpadre.orders for insert to anon, authenticated with check (status = 'en attente d''appel');
drop policy if exists "commandes: lecture admin" on elpadre.orders;
create policy "commandes: lecture admin" on elpadre.orders for select to authenticated using (elpadre.is_admin());
drop policy if exists "commandes: statut admin" on elpadre.orders;
create policy "commandes: statut admin" on elpadre.orders for update to authenticated using (elpadre.is_admin()) with check (elpadre.is_admin());
revoke all on elpadre.orders from anon, authenticated;
grant insert (ref, customer_name, phone, fulfillment, address, slot, note, items) on elpadre.orders to anon, authenticated;
grant select on elpadre.orders to authenticated;
grant update (status) on elpadre.orders to authenticated;
