import { ArrowDownLeft, ArrowUpRight, Boxes, CircleAlert, Plus, ShoppingBasket } from "lucide-react";
import { PrivateShell } from "@/components/private-shell";
import { PageHeading } from "@/components/page-heading";
import { IngredientForm, InventoryMovementForm } from "@/components/forms";
import { getIngredientsData } from "@/lib/data";
import { currency, number, shortDate } from "@/lib/format";

const movementLabel: Record<string, string> = { purchase: "Compra", adjustment: "Ajuste", loss: "Perda", sale_consumption: "Consumo em venda", sale_reversal: "Estorno de venda" };
type InventoryMovement = {
  id: string;
  movement_type: string;
  quantity_change: number;
  note: string | null;
  created_at: string;
  ingredients: { name: string; unit: string } | { name: string; unit: string }[] | null;
};

export default async function InventoryPage() {
  const data = await getIngredientsData();
  if (!data) return <PrivateShell><div /></PrivateShell>;
  const stockValue = data.ingredients.reduce((sum, item) => sum + Number(item.current_stock) * Number(item.avg_unit_cost), 0);
  const lowStock = data.ingredients.filter((item) => Number(item.current_stock) <= Number(item.min_stock));
  return <PrivateShell>
    <PageHeading eyebrow="INSUMOS E MATERIAIS" title="Estoque" description="Entradas, perdas e consumo das receitas — tudo no mesmo lugar." action={<a href="#movimentacao" className="button button-primary"><Plus size={16} /> Movimentar estoque</a>} />
    <div className="summary-strip inventory-summary"><div><span className="summary-icon mint"><Boxes size={17} /></span><span><strong>{data.ingredients.length}</strong><small>itens ativos</small></span></div><div><span className="summary-icon blush"><CircleAlert size={17} /></span><span><strong>{lowStock.length}</strong><small>abaixo do mínimo</small></span></div><div><span className="summary-icon butter"><ShoppingBasket size={17} /></span><span><strong>{currency(stockValue)}</strong><small>valor aproximado em estoque</small></span></div></div>
    {data.error && <div className="notice-bar">Não foi possível carregar o estoque. Confira a migração e as permissões do Supabase.</div>}
    <div className="inventory-layout">
      <section className="panel inventory-table-panel"><div className="panel-heading"><div><div className="panel-kicker">SALDOS ATUAIS</div><h2>Itens do ateliê</h2></div><span className="soft-badge">Custo médio ponderado</span></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Item</th><th>Tipo</th><th>Saldo</th><th>Alerta</th><th>Custo / un.</th><th>Valor em estoque</th></tr></thead><tbody>
          {data.ingredients.length ? data.ingredients.map((item) => { const low = Number(item.current_stock) <= Number(item.min_stock); return <tr key={item.id}><td><strong className="table-primary">{item.name}</strong></td><td><span className="type-label">{item.category}</span></td><td><strong className={low ? "text-rose" : ""}>{number(item.current_stock, 3)} {item.unit}</strong></td><td>{low ? <span className="status-pill status-low">Repor</span> : <span className="status-pill status-ok">Em dia</span>}</td><td>{currency(item.avg_unit_cost)}</td><td>{currency(Number(item.current_stock) * Number(item.avg_unit_cost))}</td></tr>; }) : <tr><td colSpan={6} className="empty-table">Nenhum item cadastrado. Adicione o primeiro abaixo.</td></tr>}
        </tbody></table></div>
      </section>
      <aside className="panel movement-panel"><div className="panel-heading"><div><div className="panel-kicker">HISTÓRICO</div><h2>Últimas movimentações</h2></div></div>
        {data.movements.length ? <div className="movement-list">{(data.movements as InventoryMovement[]).map((movement) => { const item = Array.isArray(movement.ingredients) ? movement.ingredients[0] : movement.ingredients; const increase = Number(movement.quantity_change) > 0; return <div className="movement-row" key={movement.id}><span className={`movement-icon ${increase ? "movement-in" : "movement-out"}`}>{increase ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span className="movement-copy"><strong>{item?.name || "Item de estoque"}</strong><small>{movementLabel[movement.movement_type] || movement.movement_type} · {shortDate(movement.created_at)}</small>{movement.note && <small>{movement.note}</small>}</span><span className={increase ? "movement-positive" : "movement-negative"}>{increase ? "+" : ""}{number(movement.quantity_change, 3)} {item?.unit || ""}</span></div>; })}</div> : <div className="small-empty">Movimentações aparecem aqui quando você registra compras, ajustes ou vendas.</div>}
      </aside>
    </div>
    <div className="inventory-forms-grid">
      <section className="panel form-panel"><div className="panel-heading"><div><div className="panel-kicker">NOVO ITEM</div><h2>Cadastrar ingrediente ou material</h2></div></div><IngredientForm /></section>
      <section className="panel form-panel" id="movimentacao"><div className="panel-heading"><div><div className="panel-kicker">ENTRADA OU AJUSTE</div><h2>Registrar movimentação</h2></div></div><InventoryMovementForm ingredients={data.ingredients} /></section>
    </div>
  </PrivateShell>;
}
