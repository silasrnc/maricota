import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();
  if (!supabase) return null;

  const currentMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date());
  const monthStart = `${currentMonth}-01T00:00:00-03:00`;
  const [year, month] = currentMonth.split("-").map(Number);
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const nextMonthStart = `${nextMonth}-01T00:00:00-03:00`;

  const [salesResult, paymentResult, expenseResult, stockResult, latestResult, openSalesResult, allPaymentsResult] = await Promise.all([
    supabase.from("sales").select("id,total,sale_date,status").gte("sale_date", monthStart).lt("sale_date", nextMonthStart).eq("status", "confirmed"),
    supabase.from("payments").select("amount,paid_at,sales!inner(status)").gte("paid_at", monthStart).lt("paid_at", nextMonthStart).eq("sales.status", "confirmed"),
    supabase.from("expenses").select("amount,expense_date").eq("affects_result", true).gte("expense_date", currentMonth + "-01").lt("expense_date", nextMonth + "-01"),
    supabase.from("ingredients").select("id,name,unit,current_stock,min_stock,avg_unit_cost").eq("active", true).order("name"),
    supabase.from("sales").select("id,customer_name,total,sale_date,status").eq("status", "confirmed").order("sale_date", { ascending: false }).limit(5),
    supabase.from("sales").select("id,total").eq("status", "confirmed"),
    supabase.from("payments").select("sale_id,amount"),
  ]);

  const sales = salesResult.data ?? [];
  const salesIds = sales.map((sale) => sale.id);
  const itemsResult = salesIds.length
    ? await supabase.from("sale_items").select("quantity,total_cost_snapshot,sale_id").in("sale_id", salesIds)
    : { data: [] as { total_cost_snapshot: number }[] };

  const paidBySale = new Map<string, number>();
  (allPaymentsResult.data ?? []).forEach((payment: { sale_id: string; amount: number }) => {
    paidBySale.set(payment.sale_id, (paidBySale.get(payment.sale_id) ?? 0) + Number(payment.amount));
  });

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const received = (paymentResult.data ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const receivables = (openSalesResult.data ?? []).reduce((sum, sale) => sum + Math.max(0, Number(sale.total) - (paidBySale.get(sale.id) ?? 0)), 0);
  const expenses = (expenseResult.data ?? []).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const costOfGoods = (itemsResult.data ?? []).reduce((sum: number, item: { total_cost_snapshot: number }) => sum + Number(item.total_cost_snapshot), 0);
  const lowStock = (stockResult.data ?? []).filter((item) => Number(item.current_stock) <= Number(item.min_stock));
  const monthDays = new Date(Number(currentMonth.slice(0, 4)), Number(currentMonth.slice(5, 7)), 0).getDate();
  const chartTotals = Array.from({ length: 12 }, () => 0);
  sales.forEach((sale) => {
    const day = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", day: "2-digit" }).format(new Date(sale.sale_date)));
    chartTotals[Math.min(11, Math.floor(((day - 1) / monthDays) * 12))] += Number(sale.total);
  });
  const chartMax = Math.max(...chartTotals, 1);
  const chartBars = chartTotals.map((value) => value ? Math.max(9, Math.round(value / chartMax * 100)) : 3);
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(new Date());

  return {
    revenue,
    received,
    receivables,
    expenses,
    estimatedResult: revenue - costOfGoods - expenses,
    lowStock,
    latestSales: latestResult.data ?? [],
    salesCount: sales.length,
    chartBars,
    weekday,
    errors: [salesResult.error, paymentResult.error, expenseResult.error, stockResult.error, latestResult.error, openSalesResult.error, allPaymentsResult.error].filter(Boolean),
  };
}

export async function getProductsData() {
  const supabase = await createClient();
  if (!supabase) return null;
  const [{ data: products, error: productsError }, { data: variants, error: variantsError }, { data: costs, error: costsError }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("product_variants").select("id,product_id,label,units_per_sale,price,markup_percent,target_margin_percent"),
    supabase.from("product_costs").select("variant_id,unit_cost,markup_price,margin_price"),
  ]);
  return { products: products ?? [], variants: variants ?? [], costs: costs ?? [], error: productsError || variantsError || costsError };
}

export async function getIngredientsData() {
  const supabase = await createClient();
  if (!supabase) return null;
  const [{ data: ingredients, error }, { data: movements }] = await Promise.all([
    supabase.from("ingredients").select("*").eq("active", true).order("name"),
    supabase.from("inventory_movements").select("id,ingredient_id,movement_type,quantity_change,unit_cost,note,created_at,ingredients(name,unit)").order("created_at", { ascending: false }).limit(12),
  ]);
  return { ingredients: ingredients ?? [], movements: movements ?? [], error };
}

export async function getSalesData() {
  const supabase = await createClient();
  if (!supabase) return null;
  const [{ data: sales, error }, { data: variants }, { data: products }] = await Promise.all([
    supabase.from("sales").select("*").order("sale_date", { ascending: false }),
    supabase.from("product_variants").select("id,product_id,label,price"),
    supabase.from("products").select("id,name"),
  ]);
  const ids = (sales ?? []).map((sale) => sale.id);
  const [{ data: payments }, { data: items }] = ids.length
    ? await Promise.all([
        supabase.from("payments").select("sale_id,amount,paid_at").in("sale_id", ids),
        supabase.from("sale_items").select("sale_id,quantity,unit_price,total_cost_snapshot,variant_id").in("sale_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  return { sales: sales ?? [], variants: variants ?? [], products: products ?? [], payments: payments ?? [], items: items ?? [], error };
}

export async function getExpensesData() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false }).limit(100);
  return { expenses: data ?? [], error };
}
