import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, CakeSlice, CircleDollarSign, ClipboardList, Plus, ReceiptText, Sparkles, WalletCards } from "lucide-react";
import { PrivateShell } from "@/components/private-shell";
import { PageHeading } from "@/components/page-heading";
import { getDashboardData } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return <PrivateShell><div /></PrivateShell>;
  const totalStockValue = data.lowStock.reduce((sum, item) => sum + Number(item.current_stock) * Number(item.avg_unit_cost), 0);
  return <PrivateShell>
    <PageHeading eyebrow={`${data.weekday.toUpperCase()} · SEU ATELIÊ`} title={<>Bom dia, Maricota <span className="heading-sun">☀</span></>} description="Um olhar carinhoso para o que está acontecendo por aqui." action={<Link href="/vendas" className="button button-primary"><Plus size={16} /> Nova venda</Link>} />

    {data.errors.length > 0 && <div className="notice-bar"><span>Não conseguimos carregar alguns indicadores. Confira se a migração do Supabase foi aplicada.</span></div>}
    <section className="metric-grid" aria-label="Indicadores do mês">
      <article className="metric-card metric-featured"><div className="metric-top"><span>Vendas no mês</span><span className="metric-icon"><CircleDollarSign size={17} /></span></div><strong>{currency(data.revenue)}</strong><div className="metric-foot"><span><span className="trend-up"><ArrowUpRight size={13} /> mês atual</span></span><span>{data.salesCount} vendas</span></div><div className="metric-sparkline">{data.chartBars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></article>
      <article className="metric-card"><div className="metric-top"><span>Recebido no mês</span><span className="metric-icon mint"><WalletCards size={17} /></span></div><strong>{currency(data.received)}</strong><div className="metric-foot"><span>Pagamentos confirmados</span><span className="metric-note">em caixa</span></div></article>
      <article className="metric-card"><div className="metric-top"><span>A receber</span><span className="metric-icon peach"><ClipboardList size={17} /></span></div><strong>{currency(data.receivables)}</strong><div className="metric-foot"><span>Vendas com saldo</span><Link href="/vendas">Ver vendas <ArrowRight size={12} /></Link></div></article>
      <article className="metric-card"><div className="metric-top"><span>Resultado estimado</span><span className="metric-icon lilac"><Sparkles size={17} /></span></div><strong>{currency(data.estimatedResult)}</strong><div className="metric-foot"><span>Após custos e despesas</span><span className="metric-note">mês atual</span></div></article>
    </section>

    <section className="dashboard-grid">
      <article className="panel sales-panel">
        <div className="panel-heading"><div><div className="panel-kicker">ACOMPANHAMENTO</div><h2>O movimento do mês</h2></div><span className="period-chip">Este mês <ArrowDownRight size={13} /></span></div>
        <div className="chart-summary"><strong>{currency(data.revenue)}</strong><span>em vendas registradas</span></div>
        <div className="chart-area"><div className="chart-y-axis"><span>pico do mês</span><span>médio</span><span>R$ 0</span></div><div className="chart-lines"><i /><i /><i /><div className="bar-chart">{data.chartBars.map((height, index) => <div className="bar-column" key={index}><i className={index === data.chartBars.length - 1 ? "bar-current" : ""} style={{ height: `${height}%` }} /></div>)}</div></div></div>
        <div className="chart-x-axis"><span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>Hoje</span></div>
        <div className="chart-foot"><span><i className="legend-dot" /> vendas confirmadas</span><span>Os valores são calculados pela data da venda</span></div>
      </article>

      <article className="panel stock-panel">
        <div className="panel-heading"><div><div className="panel-kicker">CUIDADO COM O ESTOQUE</div><h2>Precisa de atenção</h2></div><Link className="panel-link" href="/estoque">Ver estoque <ArrowRight size={14} /></Link></div>
        {data.lowStock.length ? <div className="stock-alert-list">{data.lowStock.slice(0, 5).map((item) => <div className="stock-alert" key={item.id}><span className="stock-alert-icon"><Boxes size={16} /></span><div className="stock-alert-copy"><strong>{item.name}</strong><span>{Number(item.current_stock) <= 0 ? "Sem saldo" : "Estoque baixo"}</span></div><span className={`stock-amount ${Number(item.current_stock) <= 0 ? "stock-empty" : ""}`}>{item.current_stock} <small>{item.unit}</small></span></div>)}</div> : <div className="calm-stock"><span className="calm-stock-art">✿</span><strong>Estoque tranquilo</strong><span>Nenhum item atingiu o alerta mínimo.</span></div>}
        <div className="stock-panel-foot"><span>Valor estimado dos itens em alerta</span><strong>{currency(totalStockValue)}</strong></div>
      </article>
    </section>

    <section className="dashboard-grid lower-grid">
      <article className="panel recent-panel">
        <div className="panel-heading"><div><div className="panel-kicker">ÚLTIMAS ENCOMENDAS</div><h2>Vendas recentes</h2></div><Link className="panel-link" href="/vendas">Todas as vendas <ArrowRight size={14} /></Link></div>
        {data.latestSales.length ? <div className="recent-list">{data.latestSales.map((sale, index) => <div className="recent-row" key={sale.id}><div className={`customer-avatar avatar-${index % 4}`}>{(sale.customer_name || "M").trim().slice(0, 1).toUpperCase()}</div><div className="recent-copy"><strong>{sale.customer_name || "Venda balcão"}</strong><span>{shortDate(sale.sale_date)}</span></div><div className="recent-amount"><strong>{currency(sale.total)}</strong><span className="status-pill status-paid">Confirmada</span></div></div>)}</div> : <div className="empty-state"><div className="empty-illustration"><CakeSlice size={24} /></div><strong>O próximo pedido começa por você</strong><span>Registre uma venda para ver o movimento do ateliê.</span><Link className="link-button" href="/vendas"><Plus size={15} /> Registrar primeira venda</Link></div>}
      </article>
      <article className="panel quick-panel">
        <div className="panel-kicker">ATALHOS DO DIA</div><h2>O que vamos fazer?</h2>
        <div className="quick-actions">
          <Link href="/produtos"><span className="quick-icon quick-pink"><CakeSlice size={17} /></span><span><strong>Cadastrar produto</strong><small>Receita, formato e preço</small></span><ArrowRight size={15} /></Link>
          <Link href="/estoque"><span className="quick-icon quick-green"><Boxes size={17} /></span><span><strong>Atualizar estoque</strong><small>Entradas e ajustes</small></span><ArrowRight size={15} /></Link>
          <Link href="/despesas"><span className="quick-icon quick-gold"><ReceiptText size={17} /></span><span><strong>Registrar despesa</strong><small>Contas e custos do ateliê</small></span><ArrowRight size={15} /></Link>
        </div>
        <div className="quick-note"><span>✳</span><p>“A doçura está nos detalhes.”</p><small>LEMBRETE DA MARICOTA</small></div>
      </article>
    </section>
    <footer className="page-footer"><span>Maricota · Gestão com carinho</span><span>Todos os valores em reais (R$)</span></footer>
  </PrivateShell>;
}
