import { ArrowUpRight, CalendarDays, CakeSlice, Plus, Sparkles } from "lucide-react";
import { PrivateShell } from "@/components/private-shell";
import { PageHeading } from "@/components/page-heading";
import { ProductForm } from "@/components/forms";
import { getIngredientsData, getProductsData } from "@/lib/data";
import { currency, shortDate } from "@/lib/format";

export default async function ProductsPage() {
  const [data, inventory] = await Promise.all([getProductsData(), getIngredientsData()]);
  if (!data || !inventory) return <PrivateShell><div /></PrivateShell>;
  const variantsByProduct = new Map<string, typeof data.variants>();
  data.variants.forEach((variant) => variantsByProduct.set(variant.product_id, [...(variantsByProduct.get(variant.product_id) ?? []), variant]));
  const costByVariant = new Map(data.costs.map((cost) => [cost.variant_id, cost]));
  return <PrivateShell>
    <PageHeading eyebrow="RECEITAS E PREÇOS" title="Seus produtos" description="Cada criação tem uma história — e uma conta que fecha." action={<a href="#novo-produto" className="button button-primary"><Plus size={16} /> Novo produto</a>} />
    <div className="summary-strip"><div><span className="summary-icon blush"><CakeSlice size={17} /></span><span><strong>{data.products.length}</strong><small>produtos cadastrados</small></span></div><div><span className="summary-icon butter"><CalendarDays size={17} /></span><span><strong>{data.products.filter((product) => product.occasion).length}</strong><small>especiais sazonais</small></span></div><div><span className="summary-icon mint"><Sparkles size={17} /></span><span><strong>{inventory.ingredients.length}</strong><small>itens de receita disponíveis</small></span></div></div>
    {data.error && <div className="notice-bar">Não foi possível carregar a lista de produtos. Confira a migração e as permissões do Supabase.</div>}
    <section className="product-grid">
      {data.products.length ? data.products.map((product) => {
        const variants = variantsByProduct.get(product.id) ?? [];
        const variant = variants[0];
        const cost = variant ? costByVariant.get(variant.id) : undefined;
        const hasWindow = product.available_from || product.available_until;
        return <article className="product-card panel" key={product.id}>
          <div className="product-art"><span className="product-art-stamp">M</span><span className="product-art-spark">✳</span><CakeSlice size={30} strokeWidth={1.2} />{product.occasion && <span className="occasion-chip">{product.occasion}</span>}</div>
          <div className="product-card-content">
            <div className="product-meta"><span>{product.category}</span><span className={`product-state ${product.active ? "active" : "inactive"}`}>{product.active ? "Ativo" : "Inativo"}</span></div>
            <h2>{product.name}</h2>
            <div className="product-variant-line"><span>{variant?.label || "Sem formato cadastrado"}</span>{variant && <span>{currency(variant.price)}</span>}</div>
            {hasWindow && <div className="availability-line"><CalendarDays size={13} /> {shortDate(product.available_from)} – {shortDate(product.available_until)}</div>}
            <div className="product-cost-grid">
              <div><span>Custo estimado</span><strong>{currency(cost?.unit_cost)}</strong></div>
              <div><span>Sugestão por markup</span><strong>{currency(cost?.markup_price)}</strong></div>
              <div><span>Por margem alvo</span><strong>{currency(cost?.margin_price)}</strong></div>
            </div>
            <div className="product-card-foot"><span>Margem alvo {variant?.target_margin_percent ?? 0}% · markup {variant?.markup_percent ?? 0}%</span><ArrowUpRight size={14} /></div>
          </div>
        </article>;
      }) : <div className="empty-panel panel"><div className="empty-illustration"><CakeSlice size={24} /></div><strong>Seu catálogo começa com uma receita</strong><span>Cadastre o primeiro produto e calcule seu custo por formato de venda.</span></div>}
    </section>
    <section className="panel form-panel" id="novo-produto">
      <div className="panel-heading"><div><div className="panel-kicker">NOVO NO CATÁLOGO</div><h2>Criar produto e receita</h2></div><span className="soft-badge">Sugestões por custo</span></div>
      <ProductForm ingredients={inventory.ingredients} />
    </section>
  </PrivateShell>;
}
