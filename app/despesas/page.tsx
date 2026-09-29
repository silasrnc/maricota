import { ArrowDownRight, Plus, ReceiptText, WalletCards } from "lucide-react";
import { PrivateShell } from "@/components/private-shell";
import { PageHeading } from "@/components/page-heading";
import { ExpenseForm } from "@/components/forms";
import { getExpensesData } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";

export default async function ExpensesPage() {
  const data = await getExpensesData();
  if (!data) return <PrivateShell><div /></PrivateShell>;
  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date());
  const thisMonth = data.expenses.filter((expense) => String(expense.expense_date).startsWith(month));
  const monthlyTotal = thisMonth.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const allTotal = data.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const byCategory = new Map<string, number>();
  thisMonth.forEach((expense) => byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + Number(expense.amount)));
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  return <PrivateShell>
    <PageHeading eyebrow="CUIDADO COM AS CONTAS" title="Despesas" description="Uma visão clara dos custos que mantêm o ateliê funcionando." action={<a href="#nova-despesa" className="button button-primary"><Plus size={16} /> Nova despesa</a>} />
    <div className="summary-strip"><div><span className="summary-icon blush"><ArrowDownRight size={17} /></span><span><strong>{currency(monthlyTotal)}</strong><small>despesas neste mês</small></span></div><div><span className="summary-icon butter"><ReceiptText size={17} /></span><span><strong>{thisMonth.length}</strong><small>lançamentos neste mês</small></span></div><div><span className="summary-icon mint"><WalletCards size={17} /></span><span><strong>{currency(allTotal)}</strong><small>nos últimos 100 lançamentos</small></span></div></div>
    {data.error && <div className="notice-bar">Não foi possível carregar as despesas. Confira a migração e as permissões do Supabase.</div>}
    <div className="expenses-layout">
      <section className="panel expense-list-panel"><div className="panel-heading"><div><div className="panel-kicker">LANÇAMENTOS</div><h2>Despesas recentes</h2></div><span className="soft-badge">Mais recentes primeiro</span></div>
        <div className="expense-list">{data.expenses.length ? data.expenses.map((expense, index) => <div className="expense-row" key={expense.id}><span className={`expense-icon expense-color-${index % 4}`}><ReceiptText size={16} /></span><div className="expense-copy"><strong>{expense.description}</strong><span>{expense.category}{expense.note ? ` · ${expense.note}` : ""}</span></div><span className="expense-date">{shortDate(expense.expense_date)}</span><strong className="expense-amount">{currency(expense.amount)}</strong></div>) : <div className="empty-state"><div className="empty-illustration"><ReceiptText size={23} /></div><strong>Nenhuma despesa lançada</strong><span>Adicione uma conta para começar a acompanhar os custos do ateliê.</span></div>}</div>
      </section>
      <aside className="panel category-panel"><div className="panel-kicker">NESTE MÊS</div><h2>Onde estamos investindo</h2>
        {categories.length ? <div className="category-list">{categories.map(([category, amount], index) => <div className="category-row" key={category}><div><span className={`category-mark category-mark-${index}`} /><strong>{category}</strong><span>{currency(amount)}</span></div><div className="category-track"><i style={{ width: `${monthlyTotal ? Math.max(3, amount / Math.max(...categories.map((item) => item[1])) * 100) : 0}%` }} /></div></div>)}</div> : <div className="small-empty">Suas categorias aparecem depois do primeiro lançamento.</div>}
        <div className="category-note"><span>✿</span><p>Separar as despesas ajuda a entender o resultado do mês.</p></div>
      </aside>
    </div>
    <section className="panel form-panel" id="nova-despesa"><div className="panel-heading"><div><div className="panel-kicker">NOVO LANÇAMENTO</div><h2>Registrar despesa</h2></div></div><ExpenseForm /></section>
  </PrivateShell>;
}
