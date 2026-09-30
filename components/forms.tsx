"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, LoaderCircle, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { currency, number, todayInSaoPaulo } from "@/lib/format";

type Ingredient = { id: string; name: string; category: string; unit: string; current_stock?: number; min_stock?: number; avg_unit_cost?: number };
type Variant = { id: string; label: string; price: number; product_name: string; product_id: string };

function Feedback({ value }: { value: { kind: "error" | "success"; text: string } | null }) {
  if (!value) return null;
  return <div className={`form-feedback ${value.kind}`} role={value.kind === "error" ? "alert" : "status"}>{value.kind === "error" ? <AlertCircle size={15} /> : <Check size={15} />}{value.text}</div>;
}

function FormActions({ busy, label }: { busy: boolean; label: string }) {
  return <button className="button button-primary" disabled={busy} type="submit">{busy ? <LoaderCircle size={16} className="spin" /> : <Plus size={16} />}{busy ? "Salvando..." : label}</button>;
}

export function IngredientForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("ingredients").insert({
        name: String(form.get("name")).trim(), category: form.get("category"), unit: form.get("unit"),
        min_stock: Number(form.get("min_stock") || 0), current_stock: 0, avg_unit_cost: 0,
      });
      if (error) throw error;
      formElement.reset();
      setFeedback({ kind: "success", text: "Item cadastrado. Registre uma compra para atualizar o saldo." });
      router.refresh();
    } catch (err) { setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Não foi possível salvar." }); }
    finally { setBusy(false); }
  }

  return <form className="form-grid" onSubmit={submit}>
    <label className="field field-wide">Nome do item<input name="name" placeholder="Ex.: Chocolate meio amargo" required maxLength={100} /></label>
    <label className="field">Tipo<select name="category" defaultValue="ingrediente"><option value="ingrediente">Ingrediente</option><option value="embalagem">Embalagem</option><option value="tecido">Tecido</option><option value="material">Outro material</option></select></label>
    <label className="field">Unidade de controle<select name="unit" defaultValue="g"><option value="g">Grama (g)</option><option value="kg">Quilograma (kg)</option><option value="ml">Mililitro (ml)</option><option value="l">Litro (l)</option><option value="un">Unidade (un)</option></select></label>
    <label className="field field-wide">Alerta de estoque baixo<input name="min_stock" type="number" min="0" step="0.001" defaultValue="0" /><small>Use a mesma unidade de controle.</small></label>
    <div className="field-wide form-footer"><Feedback value={feedback} /><FormActions busy={busy} label="Cadastrar item" /></div>
  </form>;
}

export function InventoryMovementForm({ ingredients }: { ingredients: Ingredient[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [movementType, setMovementType] = useState("purchase");
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const kind = String(form.get("movement_type"));
    const quantity = Number(form.get("quantity") || 0);
    try {
      const supabase = createClient();
      const { error } = kind === "purchase"
        ? await supabase.rpc("record_stock_purchase", { p_ingredient_id: String(form.get("ingredient_id")), p_quantity: quantity, p_unit_cost: Number(form.get("unit_cost")), p_note: String(form.get("note") || "Compra") })
        : await supabase.rpc("adjust_stock", { p_ingredient_id: String(form.get("ingredient_id")), p_quantity_change: kind === "loss" ? -quantity : Number(form.get("quantity_change")), p_note: String(form.get("note") || (kind === "loss" ? "Perda" : "Ajuste manual")), p_movement_type: kind });
      if (error) throw error;
      formElement.reset();
      setMovementType("purchase");
      setFeedback({ kind: "success", text: kind === "purchase" ? "Compra registrada e custo médio atualizado." : "Movimentação registrada." });
      router.refresh();
    } catch (err) { setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Não foi possível registrar." }); }
    finally { setBusy(false); }
  }
  if (!ingredients.length) return <div className="inline-empty">Cadastre um item de estoque antes de registrar movimentações.</div>;
  return <form className="form-grid" onSubmit={submit}>
    <label className="field field-wide">Item<select name="ingredient_id" required defaultValue=""><option value="" disabled>Selecione um item</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}</select></label>
    <label className="field">Movimentação<select name="movement_type" value={movementType} onChange={(event) => setMovementType(event.target.value)}><option value="purchase">Compra / entrada</option><option value="adjustment">Ajuste de saldo</option><option value="loss">Perda / descarte</option></select></label>
    {movementType === "adjustment" ? <label className="field">Variação do saldo<input name="quantity_change" type="number" step="0.001" defaultValue="1" required /><small>Use valor negativo para reduzir.</small></label> : <label className="field">Quantidade<input name="quantity" type="number" min="0.001" step="0.001" required defaultValue="1" /></label>}
    {movementType === "purchase" && <label className="field">Custo por unidade<input name="unit_cost" type="number" min="0" step="0.0001" defaultValue="0" required /><small>Atualiza o custo médio; com custo informado, lança a compra em Despesas.</small></label>}
    <label className="field field-wide">Observação<input name="note" placeholder="Fornecedor, motivo ou referência" maxLength={180} /></label>
    <div className="field-wide form-footer"><Feedback value={feedback} /><FormActions busy={busy} label="Registrar movimentação" /></div>
  </form>;
}

export function ProductForm({ ingredients }: { ingredients: Ingredient[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [recipe, setRecipe] = useState([{ ingredient_id: "", quantity: "" }]);
  const [extraUnitCost, setExtraUnitCost] = useState("0");
  const [markupPercent, setMarkupPercent] = useState("50");
  const [targetMarginPercent, setTargetMarginPercent] = useState("35");
  const recipeCost = useMemo(() => recipe.reduce((sum, row) => {
    const item = ingredients.find((entry) => entry.id === row.ingredient_id);
    return sum + (item ? Number(row.quantity || 0) * Number(item.avg_unit_cost || 0) : 0);
  }, 0), [ingredients, recipe]);
  const totalUnitCost = recipeCost + Number(extraUnitCost || 0);
  const markupPrice = totalUnitCost * (1 + Number(markupPercent || 0) / 100);
  const marginPrice = Number(targetMarginPercent) < 100 ? totalUnitCost / (1 - Number(targetMarginPercent || 0) / 100) : null;

  function updateRow(index: number, key: "ingredient_id" | "quantity", value: string) {
    setRecipe((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const recipeItems = recipe.filter((row) => row.ingredient_id && Number(row.quantity) > 0).map((row) => ({ ingredient_id: row.ingredient_id, quantity: Number(row.quantity) }));
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_product", {
        p_name: String(form.get("name")), p_category: String(form.get("category") || "Geral"), p_occasion: String(form.get("occasion") || ""),
        p_available_from: String(form.get("available_from") || "") || null, p_available_until: String(form.get("available_until") || "") || null,
        p_variant_label: String(form.get("variant_label") || "Unidade"), p_units_per_sale: Number(form.get("units_per_sale") || 1),
        p_price: Number(form.get("price") || 0), p_extra_unit_cost: Number(form.get("extra_unit_cost") || 0),
        p_markup_percent: Number(form.get("markup_percent") || 0), p_target_margin_percent: Number(form.get("target_margin_percent") || 0), p_recipe: recipeItems,
      });
      if (error) throw error;
      formElement.reset(); setRecipe([{ ingredient_id: "", quantity: "" }]); setExtraUnitCost("0"); setMarkupPercent("50"); setTargetMarginPercent("35");
      setFeedback({ kind: "success", text: "Produto e composição cadastrados." }); router.refresh();
    } catch (err) { setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Não foi possível cadastrar o produto." }); }
    finally { setBusy(false); }
  }

  return <form className="form-grid" onSubmit={submit}>
    <label className="field field-wide">Nome do produto<input name="name" placeholder="Ex.: Caixa de brigadeiros" required maxLength={120} /></label>
    <label className="field">Categoria<input name="category" placeholder="Bolos, presentes..." defaultValue="Geral" /></label>
    <label className="field">Data comemorativa<input name="occasion" placeholder="Dia das Mães, Natal..." /></label>
    <label className="field">Disponível a partir de<input name="available_from" type="date" /></label>
    <label className="field">Disponível até<input name="available_until" type="date" /></label>
    <div className="field field-wide section-divider"><span>Apresentação de venda</span></div>
    <label className="field">Formato<input name="variant_label" defaultValue="Unidade" placeholder="Caixa com 6" required /></label>
    <label className="field">Quantidade no formato<input name="units_per_sale" type="number" min="0.001" step="0.001" defaultValue="1" required /><small>Ex.: 6 brigadeiros por caixa.</small></label>
    <label className="field">Preço de venda<input name="price" type="number" min="0" step="0.01" defaultValue="0" required /></label>
    <label className="field">Custo direto adicional<input name="extra_unit_cost" type="number" min="0" step="0.01" value={extraUnitCost} onChange={(event) => setExtraUnitCost(event.target.value)} /><small>Custos por unidade além da receita.</small></label>
    <label className="field">Markup alvo (%)<input name="markup_percent" type="number" min="0" step="0.1" value={markupPercent} onChange={(event) => setMarkupPercent(event.target.value)} required /></label>
    <label className="field">Margem alvo (%)<input name="target_margin_percent" type="number" min="0" max="99.9" step="0.1" value={targetMarginPercent} onChange={(event) => setTargetMarginPercent(event.target.value)} required /></label>
    <div className="field field-wide section-divider"><span>Receita e materiais por formato</span><small>As quantidades usam a unidade cadastrada para cada item.</small></div>
    {ingredients.length ? recipe.map((row, index) => <div className="recipe-row field-wide" key={index}>
      <select aria-label="Item da receita" value={row.ingredient_id} onChange={(event) => updateRow(index, "ingredient_id", event.target.value)}>
        <option value="">Selecione ingrediente ou material</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}
      </select>
      <input aria-label="Quantidade na receita" type="number" min="0.001" step="0.001" placeholder="Quantidade" value={row.quantity} onChange={(event) => updateRow(index, "quantity", event.target.value)} />
      <button
        type="button"
        className="icon-button subtle-button"
        onClick={() => setRecipe((current) => current.length > 1
          ? current.filter((_, rowIndex) => rowIndex !== index)
          : [{ ingredient_id: "", quantity: "" }])}
        aria-label="Remover item"
      ><Trash2 size={16} /></button>
    </div>) : <div className="field-wide inline-empty">Cadastre ingredientes ou materiais no estoque para montar a receita. Você ainda pode informar um custo direto adicional.</div>}
    {ingredients.length > 0 && <button className="link-button field-wide recipe-add" type="button" onClick={() => setRecipe((current) => [...current, { ingredient_id: "", quantity: "" }])}><Plus size={15} /> Adicionar item à receita</button>}
    <div className="field-wide cost-preview"><span>Custo atual estimado por formato</span><strong>{currency(totalUnitCost)}</strong><div className="price-suggestions"><div><span>Preço por markup · {markupPercent}%</span><strong>{currency(markupPrice)}</strong></div><div><span>Preço por margem · {targetMarginPercent}%</span><strong>{marginPrice === null ? "—" : currency(marginPrice)}</strong></div></div><small>O custo da receita acompanha o custo médio dos itens em estoque.</small></div>
    <div className="field-wide form-footer"><Feedback value={feedback} /><FormActions busy={busy} label="Salvar produto" /></div>
  </form>;
}

export function SaleForm({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [lines, setLines] = useState([{ variant_id: "", quantity: "1" }]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const total = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * (prices[line.variant_id] ?? 0), 0);

  function selectVariant(index: number, variantId: string) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, variant_id: variantId } : line));
    const variant = variants.find((item) => item.id === variantId);
    if (variant) setPrices((current) => ({ ...current, [variantId]: Number(variant.price) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const initial = Number(form.get("initial_payment") || 0);
    if (initial < total && !String(form.get("customer_name") || "").trim()) {
      setFeedback({ kind: "error", text: "Informe o nome da pessoa para acompanhar o saldo pendente." }); setBusy(false); return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_sale", {
        p_customer_name: String(form.get("customer_name") || ""), p_customer_contact: String(form.get("customer_contact") || ""),
        p_due_date: String(form.get("due_date") || "") || null,
        p_items: lines.filter((line) => line.variant_id && Number(line.quantity) > 0).map((line) => ({ variant_id: line.variant_id, quantity: Number(line.quantity) })),
        p_initial_payment: initial, p_payment_method: String(form.get("payment_method") || "pix"),
      });
      if (error) throw error;
      formElement.reset(); setLines([{ variant_id: "", quantity: "1" }]); setPrices({});
      setFeedback({ kind: "success", text: "Venda registrada e estoque atualizado." }); router.refresh();
    } catch (err) { setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Não foi possível registrar a venda." }); }
    finally { setBusy(false); }
  }
  if (!variants.length) return <div className="inline-empty">Cadastre um produto antes de registrar vendas.</div>;
  return <form className="form-grid" onSubmit={submit}>
    <label className="field">Cliente<input name="customer_name" placeholder="Nome da pessoa" /></label>
    <label className="field">Contato<input name="customer_contact" placeholder="Telefone ou observação" /></label>
    <label className="field">Data combinada<input name="due_date" type="date" /></label>
    <div className="field field-wide section-divider"><span>Itens da venda</span><small>A receita será consumida ao confirmar, mesmo com pagamento parcial.</small></div>
    {lines.map((line, index) => <div className="sale-line field-wide" key={index}>
      <select aria-label="Produto" value={line.variant_id} required onChange={(event) => selectVariant(index, event.target.value)}>
        <option value="">Selecione um produto</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.product_name} · {variant.label} ({currency(variant.price)})</option>)}
      </select>
      <input aria-label="Quantidade" type="number" min="0.001" step="0.001" value={line.quantity} onChange={(event) => setLines((current) => current.map((item, lineIndex) => lineIndex === index ? { ...item, quantity: event.target.value } : item))} />
      <button type="button" className="icon-button subtle-button" onClick={() => setLines((current) => current.length > 1 ? current.filter((_, lineIndex) => lineIndex !== index) : [{ variant_id: "", quantity: "1" }])} aria-label="Remover item"><Trash2 size={16} /></button>
    </div>)}
    <button className="link-button field-wide recipe-add" type="button" onClick={() => setLines((current) => [...current, { variant_id: "", quantity: "1" }])}><Plus size={15} /> Adicionar item</button>
    <div className="sale-total field-wide"><span>Total da venda</span><strong>{currency(total)}</strong></div>
    <label className="field">Entrada recebida<input name="initial_payment" type="number" min="0" step="0.01" defaultValue="0" /></label>
    <label className="field">Forma de pagamento<select name="payment_method" defaultValue="pix"><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option><option value="transferencia">Transferência</option><option value="outro">Outro</option></select></label>
    <div className="field-wide form-footer"><Feedback value={feedback} /><FormActions busy={busy} label="Confirmar venda" /></div>
  </form>;
}

export function PaymentForm({ saleId, remaining }: { saleId: string; remaining: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const { error } = await createClient().rpc("record_sale_payment", { p_sale_id: saleId, p_amount: Number(form.get("amount")), p_method: String(form.get("method")) });
      if (error) throw error;
      formElement.reset(); setFeedback({ kind: "success", text: "Pagamento registrado." }); router.refresh();
    } catch (err) { setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Não foi possível registrar." }); }
    finally { setBusy(false); }
  }
  return <form className="payment-form" onSubmit={submit}>
    <input aria-label="Valor do pagamento" name="amount" type="number" min="0.01" max={remaining.toFixed(2)} step="0.01" placeholder="Valor recebido" required />
    <select aria-label="Forma de pagamento" name="method" defaultValue="pix"><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option><option value="transferencia">Transferência</option><option value="outro">Outro</option></select>
    <button className="button button-compact" type="submit" disabled={busy}>{busy ? <LoaderCircle size={14} className="spin" /> : <Plus size={14} />} Receber</button>
    {feedback && <span className={`compact-feedback ${feedback.kind}`}>{feedback.text}</span>}
  </form>;
}

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function cancel() {
    if (!window.confirm("Cancelar esta venda e devolver os itens ao estoque? Pagamentos registrados não são estornados pelo sistema.")) return;
    setBusy(true); setMessage("");
    const { error } = await createClient().rpc("cancel_sale", { p_sale_id: saleId });
    if (error) setMessage(error.message); else { setMessage("Venda cancelada."); router.refresh(); }
    setBusy(false);
  }
  return <div className="cancel-cell"><button className="text-button danger-text" type="button" onClick={cancel} disabled={busy}>{busy ? "Cancelando..." : "Cancelar"}</button>{message && <small>{message}</small>}</div>;
}

export function ExpenseForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const { error } = await createClient().from("expenses").insert({ description: String(form.get("description")).trim(), category: form.get("category"), amount: Number(form.get("amount")), expense_date: form.get("expense_date"), note: String(form.get("note") || "") || null });
      if (error) throw error;
      formElement.reset(); setFeedback({ kind: "success", text: "Despesa registrada." }); router.refresh();
    } catch (err) { setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Não foi possível registrar." }); }
    finally { setBusy(false); }
  }
  return <form className="form-grid" onSubmit={submit}>
    <label className="field field-wide">Descrição<input name="description" placeholder="Ex.: Conta de energia" required maxLength={140} /></label>
    <label className="field">Categoria<select name="category" defaultValue="Contas"><option>Contas</option><option>Aluguel</option><option>Transporte</option><option>Marketing</option><option>Equipamentos</option><option>Serviços</option><option>Outros</option></select></label>
    <label className="field">Valor<input name="amount" type="number" min="0.01" step="0.01" required /></label>
    <label className="field">Data<input name="expense_date" type="date" defaultValue={todayInSaoPaulo()} required /></label>
    <label className="field">Observação<input name="note" placeholder="Opcional" maxLength={180} /></label>
    <div className="field-wide form-footer"><Feedback value={feedback} /><FormActions busy={busy} label="Registrar despesa" /></div>
  </form>;
}
