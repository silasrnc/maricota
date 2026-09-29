import Link from "next/link";
import { ArrowRight, ClipboardList, Plus, WalletCards } from "lucide-react";
import { PrivateShell } from "@/components/private-shell";
import { PageHeading } from "@/components/page-heading";
import { CancelSaleButton, PaymentForm, SaleForm } from "@/components/forms";
import { getProductsData, getSalesData } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";

export default async function SalesPage() {
  const [data, productData] = await Promise.all([getSalesData(), getProductsData()]);
  if (!data || !productData) return <PrivateShell><div /></PrivateShell>;
  const activeSales = data.sales.filter((sale) => sale.status === "confirmed");
  const paidBySale = new Map<string, number>();
  data.payments.forEach((payment) => paidBySale.set(payment.sale_id, (paidBySale.get(payment.sale_id) ?? 0) + Number(payment.amount)));
  const receivable = activeSales.reduce((sum, sale) => sum + Math.max(0, Number(sale.total) - (paidBySale.get(sale.id) ?? 0)), 0);
  const salesTotal = activeSales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const variantMap = new Map(data.variants.map((variant) => [variant.id, variant]));
  const productMap = new Map(data.products.map((product) => [product.id, product.name]));
  const variantsForForm = data.variants.map((variant) => ({ ...variant, product_name: productMap.get(variant.product_id) || "Produto" }));
  const itemMap = new Map<string, typeof data.items>();
  data.items.forEach((item) => itemMap.set(item.sale_id, [...(itemMap.get(item.sale_id) ?? []), item]));
  return <PrivateShell>
    <PageHeading eyebrow="ENCOMENDAS E RECEBIMENTOS" title="Vendas" description="Acompanhe pedidos confirmados, entradas e saldos pendentes." action={<a href="#nova-venda" className="button button-primary"><Plus size={16} /> Nova venda</a>} />
    <div className="summary-strip"><div><span className="summary-icon blush"><ClipboardList size={17} /></span><span><strong>{activeSales.length}</strong><small>vendas em aberto e concluídas</small></span></div><div><span className="summary-icon butter"><WalletCards size={17} /></span><span><strong>{currency(salesTotal)}</strong><small>total das vendas ativas</small></span></div><div><span className="summary-icon mint"><ArrowRight size={17} /></span><span><strong>{currency(receivable)}</strong><small>saldo a receber</small></span></div></div>
    {data.error && <div className="notice-bar">Não foi possível carregar as vendas. Confira a migração e as permissões do Supabase.</div>}
    <section className="panel sales-list-panel"><div className="panel-heading"><div><div className="panel-kicker">REGISTRO DE VENDAS</div><h2>Encomendas recentes</h2></div><span className="soft-badge">Estoque baixado na confirmação</span></div>
      <div className="sales-cards">{data.sales.length ? data.sales.map((sale) => {
        const paid = paidBySale.get(sale.id) ?? 0;
        const remaining = Math.max(0, Number(sale.total) - paid);
        const lines = itemMap.get(sale.id) ?? [];
        return <article className={`sale-card ${sale.status === "cancelled" ? "sale-cancelled" : ""}`} key={sale.id}>
          <div className="sale-card-main"><div className="sale-customer-avatar">{(sale.customer_name || "B").trim()[0].toUpperCase()}</div><div className="sale-customer"><strong>{sale.customer_name || "Venda balcão"}</strong><span>{sale.customer_contact || "Sem contato cadastrado"}</span><small>Registrada em {shortDate(sale.sale_date)}{sale.due_date ? ` · combinada para ${shortDate(sale.due_date)}` : ""}</small></div><div className="sale-total-cell"><span>Total</span><strong>{currency(sale.total)}</strong></div><div className="sale-balance"><span>{sale.status === "cancelled" ? "Situação" : "A receber"}</span>{sale.status === "cancelled" ? <span className="status-pill status-cancelled">Cancelada</span> : remaining > 0 ? <strong className="text-rose">{currency(remaining)}</strong> : <span className="status-pill status-paid">Quitada</span>}</div>{sale.status === "confirmed" && <CancelSaleButton saleId={sale.id} />}</div>
          <div className="sale-detail-row"><div className="sale-items-summary">{lines.map((line, index) => { const variant = variantMap.get(line.variant_id); return <span key={`${sale.id}-${index}`}>{productMap.get(variant?.product_id || "") || "Produto"} · {variant?.label || "Formato"} × {line.quantity}</span>; })}</div><div className="payment-summary"><span>Recebido {currency(paid)}</span><span>·</span><span>{sale.status === "cancelled" ? "estoque estornado; eventual reembolso não registrado" : `${lines.length} ${lines.length === 1 ? "item" : "itens"}`}</span></div></div>
          {sale.status === "confirmed" && remaining > 0 && <PaymentForm saleId={sale.id} remaining={remaining} />}
        </article>;
      }) : <div className="empty-state"><div className="empty-illustration"><ClipboardList size={23} /></div><strong>Suas vendas vão aparecer aqui</strong><span>Registre a primeira encomenda para acompanhar o valor recebido e o saldo pendente.</span></div>}</div>
    </section>
    <section className="panel form-panel" id="nova-venda"><div className="panel-heading"><div><div className="panel-kicker">NOVA ENCOMENDA</div><h2>Registrar venda</h2></div></div><SaleForm variants={variantsForForm} /></section>
  </PrivateShell>;
}
