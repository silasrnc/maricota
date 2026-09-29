create extension if not exists pgcrypto;

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'ingrediente' check (category in ('ingrediente', 'embalagem', 'tecido', 'material')),
  unit text not null check (unit in ('g', 'kg', 'ml', 'l', 'un')),
  current_stock numeric(14,3) not null default 0 check (current_stock >= 0),
  min_stock numeric(14,3) not null default 0 check (min_stock >= 0),
  avg_unit_cost numeric(14,4) not null default 0 check (avg_unit_cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Geral',
  occasion text,
  available_from date,
  available_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (available_until is null or available_from is null or available_until >= available_from)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  units_per_sale numeric(12,3) not null default 1 check (units_per_sale > 0),
  price numeric(12,2) not null default 0 check (price >= 0),
  extra_unit_cost numeric(12,4) not null default 0 check (extra_unit_cost >= 0),
  markup_percent numeric(6,2) not null default 50 check (markup_percent >= 0),
  target_margin_percent numeric(6,2) not null default 35 check (target_margin_percent >= 0 and target_margin_percent < 100),
  created_at timestamptz not null default now()
);

create table public.recipe_items (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  quantity numeric(14,4) not null check (quantity > 0),
  primary key (variant_id, ingredient_id)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_contact text,
  sale_date timestamptz not null default now(),
  due_date date,
  total numeric(12,2) not null default 0 check (total >= 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id),
  variant_id uuid not null references public.product_variants(id),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  unit_cost_snapshot numeric(12,4) not null default 0,
  total_cost_snapshot numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'pix',
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id),
  sale_id uuid references public.sales(id),
  movement_type text not null check (movement_type in ('purchase', 'adjustment', 'loss', 'sale_consumption', 'sale_reversal')),
  quantity_change numeric(14,3) not null check (quantity_change <> 0),
  unit_cost numeric(14,4) not null default 0,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null default 'Outros',
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  note text,
  inventory_movement_id uuid unique references public.inventory_movements(id),
  affects_result boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index sales_sale_date_idx on public.sales(sale_date desc);
create index sales_status_idx on public.sales(status);
create index payments_paid_at_idx on public.payments(paid_at desc);
create index inventory_movements_created_at_idx on public.inventory_movements(created_at desc);
create index expenses_expense_date_idx on public.expenses(expense_date desc);

create view public.product_costs with (security_invoker = true) as
select
  v.id as variant_id,
  coalesce(sum(ri.quantity * i.avg_unit_cost), 0) + v.extra_unit_cost as unit_cost,
  (coalesce(sum(ri.quantity * i.avg_unit_cost), 0) + v.extra_unit_cost) * (1 + v.markup_percent / 100) as markup_price,
  case when v.target_margin_percent >= 100 then null
    else (coalesce(sum(ri.quantity * i.avg_unit_cost), 0) + v.extra_unit_cost) / (1 - v.target_margin_percent / 100)
  end as margin_price
from public.product_variants v
left join public.recipe_items ri on ri.variant_id = v.id
left join public.ingredients i on i.id = ri.ingredient_id
group by v.id, v.extra_unit_cost, v.markup_percent, v.target_margin_percent;

alter table public.ingredients enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.recipe_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.expenses enable row level security;

create policy "authenticated owner access" on public.ingredients for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.products for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.product_variants for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.recipe_items for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.sales for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.sale_items for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.payments for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.inventory_movements for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "authenticated owner access" on public.expenses for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);

grant select on public.product_costs to authenticated;
revoke all on public.ingredients, public.products, public.product_variants, public.recipe_items, public.sales, public.sale_items, public.payments, public.inventory_movements, public.expenses from anon;
grant select, insert, update on public.ingredients to authenticated;
grant select on public.products, public.product_variants, public.recipe_items, public.sales, public.sale_items, public.payments, public.inventory_movements to authenticated;
grant select, insert, update on public.expenses to authenticated;

create or replace function public.create_product(
  p_name text,
  p_category text,
  p_occasion text,
  p_available_from date,
  p_available_until date,
  p_variant_label text,
  p_units_per_sale numeric,
  p_price numeric,
  p_extra_unit_cost numeric,
  p_markup_percent numeric,
  p_target_margin_percent numeric,
  p_recipe jsonb
) returns uuid
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_product_id uuid;
  v_variant_id uuid;
  v_row jsonb;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  if trim(p_name) = '' then raise exception 'Informe o nome do produto.'; end if;
  if p_target_margin_percent < 0 or p_target_margin_percent >= 100 then raise exception 'A margem precisa ficar entre 0 e 99,99%%.'; end if;

  insert into products (name, category, occasion, available_from, available_until)
  values (trim(p_name), coalesce(nullif(trim(p_category), ''), 'Geral'), nullif(trim(p_occasion), ''), p_available_from, p_available_until)
  returning id into v_product_id;

  insert into product_variants (product_id, label, units_per_sale, price, extra_unit_cost, markup_percent, target_margin_percent)
  values (v_product_id, coalesce(nullif(trim(p_variant_label), ''), 'Unidade'), p_units_per_sale, p_price, p_extra_unit_cost, p_markup_percent, p_target_margin_percent)
  returning id into v_variant_id;

  if jsonb_typeof(coalesce(p_recipe, '[]'::jsonb)) = 'array' then
    for v_row in select value from jsonb_array_elements(coalesce(p_recipe, '[]'::jsonb)) loop
      insert into recipe_items (variant_id, ingredient_id, quantity)
      values (v_variant_id, (v_row->>'ingredient_id')::uuid, (v_row->>'quantity')::numeric);
    end loop;
  end if;

  return v_product_id;
end;
$$;

create or replace function public.record_stock_purchase(p_ingredient_id uuid, p_quantity numeric, p_unit_cost numeric, p_note text default null)
returns uuid language plpgsql security definer set search_path = public, auth
as $$
declare
  v_item ingredients%rowtype;
  v_movement_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  if p_quantity <= 0 or p_unit_cost < 0 then raise exception 'Quantidade e custo inválidos.'; end if;
  select * into v_item from ingredients where id = p_ingredient_id and active for update;
  if not found then raise exception 'Insumo não encontrado.'; end if;
  update ingredients set
    avg_unit_cost = case when current_stock + p_quantity = 0 then p_unit_cost else ((current_stock * avg_unit_cost) + (p_quantity * p_unit_cost)) / (current_stock + p_quantity) end,
    current_stock = current_stock + p_quantity
  where id = p_ingredient_id;
  insert into inventory_movements (ingredient_id, movement_type, quantity_change, unit_cost, note, created_by)
  values (p_ingredient_id, 'purchase', p_quantity, p_unit_cost, p_note, auth.uid()) returning id into v_movement_id;
  if p_unit_cost > 0 and round(p_quantity * p_unit_cost, 2) > 0 then
    insert into expenses (description, category, amount, expense_date, note, inventory_movement_id, affects_result, created_by)
    values (
      'Compra de ' || v_item.name,
      case v_item.category when 'embalagem' then 'Embalagens' when 'tecido' then 'Materiais' when 'material' then 'Materiais' else 'Insumos' end,
      round(p_quantity * p_unit_cost, 2),
      timezone('America/Sao_Paulo', now())::date,
      p_note,
      v_movement_id,
      false,
      auth.uid()
    );
  end if;
  return v_movement_id;
end;
$$;

create or replace function public.adjust_stock(p_ingredient_id uuid, p_quantity_change numeric, p_note text, p_movement_type text default 'adjustment')
returns uuid language plpgsql security definer set search_path = public, auth
as $$
declare
  v_item ingredients%rowtype;
  v_movement_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  if p_quantity_change = 0 or p_movement_type not in ('adjustment', 'loss') then raise exception 'Ajuste inválido.'; end if;
  select * into v_item from ingredients where id = p_ingredient_id and active for update;
  if not found then raise exception 'Insumo não encontrado.'; end if;
  if v_item.current_stock + p_quantity_change < 0 then raise exception 'O ajuste deixaria o estoque negativo.'; end if;
  update ingredients set current_stock = current_stock + p_quantity_change where id = p_ingredient_id;
  insert into inventory_movements (ingredient_id, movement_type, quantity_change, unit_cost, note, created_by)
  values (p_ingredient_id, p_movement_type, p_quantity_change, v_item.avg_unit_cost, p_note, auth.uid()) returning id into v_movement_id;
  return v_movement_id;
end;
$$;

create or replace function public.create_sale(
  p_customer_name text,
  p_customer_contact text,
  p_due_date date,
  p_items jsonb,
  p_initial_payment numeric default 0,
  p_payment_method text default 'pix'
) returns uuid
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_sale_id uuid;
  v_row jsonb;
  v_recipe record;
  v_item ingredients%rowtype;
  v_variant product_variants%rowtype;
  v_unit_cost numeric(14,4);
  v_quantity numeric(12,3);
  v_line_total numeric(12,2);
  v_total numeric(12,2) := 0;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Adicione pelo menos um produto.'; end if;
  if coalesce(p_initial_payment, 0) < 0 then raise exception 'Pagamento inválido.'; end if;

  insert into sales (customer_name, customer_contact, due_date, created_by)
  values (nullif(trim(p_customer_name), ''), nullif(trim(p_customer_contact), ''), p_due_date, auth.uid())
  returning id into v_sale_id;

  for v_row in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_row->>'quantity')::numeric;
    if v_quantity <= 0 then raise exception 'Quantidade inválida.'; end if;
    select * into v_variant from product_variants where id = (v_row->>'variant_id')::uuid;
    if not found then raise exception 'Produto não encontrado.'; end if;

    select coalesce(sum(ri.quantity * i.avg_unit_cost), 0) + v_variant.extra_unit_cost
    into v_unit_cost
    from recipe_items ri join ingredients i on i.id = ri.ingredient_id
    where ri.variant_id = v_variant.id;

    v_line_total := round(v_variant.price * v_quantity, 2);
    v_total := v_total + v_line_total;
    insert into sale_items (sale_id, variant_id, quantity, unit_price, unit_cost_snapshot, total_cost_snapshot, line_total)
    values (v_sale_id, v_variant.id, v_quantity, v_variant.price, v_unit_cost, round(v_unit_cost * v_quantity, 2), v_line_total);

    for v_recipe in select ingredient_id, quantity from recipe_items where variant_id = v_variant.id loop
      select * into v_item from ingredients where id = v_recipe.ingredient_id and active for update;
      if not found then raise exception 'Um item da receita está inativo ou não existe.'; end if;
      if v_item.current_stock < (v_recipe.quantity * v_quantity) then
        raise exception 'Estoque insuficiente para %.', v_item.name;
      end if;
      update ingredients set current_stock = current_stock - (v_recipe.quantity * v_quantity) where id = v_item.id;
      insert into inventory_movements (ingredient_id, sale_id, movement_type, quantity_change, unit_cost, note, created_by)
      values (v_item.id, v_sale_id, 'sale_consumption', -(v_recipe.quantity * v_quantity), v_item.avg_unit_cost, 'Consumo da venda', auth.uid());
    end loop;
  end loop;

  if coalesce(p_initial_payment, 0) > v_total then raise exception 'A entrada não pode exceder o total da venda.'; end if;
  update sales set total = v_total where id = v_sale_id;
  if coalesce(p_initial_payment, 0) > 0 then
    insert into payments (sale_id, amount, method, created_by)
    values (v_sale_id, p_initial_payment, coalesce(nullif(trim(p_payment_method), ''), 'pix'), auth.uid());
  end if;
  return v_sale_id;
end;
$$;

create or replace function public.record_sale_payment(p_sale_id uuid, p_amount numeric, p_method text default 'pix')
returns uuid language plpgsql security definer set search_path = public, auth
as $$
declare
  v_sale sales%rowtype;
  v_paid numeric(12,2);
  v_payment_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  if p_amount <= 0 then raise exception 'O pagamento precisa ser maior que zero.'; end if;
  select * into v_sale from sales where id = p_sale_id for update;
  if not found or v_sale.status <> 'confirmed' then raise exception 'Venda não encontrada ou cancelada.'; end if;
  select coalesce(sum(amount), 0) into v_paid from payments where sale_id = p_sale_id;
  if v_paid + p_amount > v_sale.total then raise exception 'O pagamento excede o saldo pendente.'; end if;
  insert into payments (sale_id, amount, method, created_by)
  values (p_sale_id, p_amount, coalesce(nullif(trim(p_method), ''), 'pix'), auth.uid()) returning id into v_payment_id;
  return v_payment_id;
end;
$$;

create or replace function public.cancel_sale(p_sale_id uuid)
returns void language plpgsql security definer set search_path = public, auth
as $$
declare
  v_sale sales%rowtype;
  v_movement record;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  select * into v_sale from sales where id = p_sale_id for update;
  if not found or v_sale.status <> 'confirmed' then raise exception 'Venda não encontrada ou já cancelada.'; end if;
  for v_movement in select id, ingredient_id, quantity_change, unit_cost from inventory_movements where sale_id = p_sale_id and movement_type = 'sale_consumption' loop
    update ingredients set current_stock = current_stock - v_movement.quantity_change where id = v_movement.ingredient_id;
    insert into inventory_movements (ingredient_id, sale_id, movement_type, quantity_change, unit_cost, note, created_by)
    values (v_movement.ingredient_id, p_sale_id, 'sale_reversal', -v_movement.quantity_change, v_movement.unit_cost, 'Estorno de venda cancelada', auth.uid());
  end loop;
  update sales set status = 'cancelled' where id = p_sale_id;
end;
$$;

revoke all on function public.create_product(text,text,text,date,date,text,numeric,numeric,numeric,numeric,numeric,jsonb) from public, anon;
revoke all on function public.record_stock_purchase(uuid,numeric,numeric,text) from public, anon;
revoke all on function public.adjust_stock(uuid,numeric,text,text) from public, anon;
revoke all on function public.create_sale(text,text,date,jsonb,numeric,text) from public, anon;
revoke all on function public.record_sale_payment(uuid,numeric,text) from public, anon;
revoke all on function public.cancel_sale(uuid) from public, anon;
grant execute on function public.create_product(text,text,text,date,date,text,numeric,numeric,numeric,numeric,numeric,jsonb) to authenticated;
grant execute on function public.record_stock_purchase(uuid,numeric,numeric,text) to authenticated;
grant execute on function public.adjust_stock(uuid,numeric,text,text) to authenticated;
grant execute on function public.create_sale(text,text,date,jsonb,numeric,text) to authenticated;
grant execute on function public.record_sale_payment(uuid,numeric,text) to authenticated;
grant execute on function public.cancel_sale(uuid) to authenticated;
