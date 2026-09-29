import Link from "next/link";
import { ArrowUpRight, Check, Database, KeyRound, Sparkles } from "lucide-react";

export function SetupNotice() {
  return (
    <main className="setup-screen">
      <div className="setup-glow setup-glow-one" /><div className="setup-glow setup-glow-two" />
      <div className="setup-content">
        <Link className="brand-lockup setup-brand" href="/">
          <span className="brand-mark"><Sparkles size={20} /></span><span className="brand-word">maricota<span>confeitaria</span></span>
        </Link>
        <div className="setup-eyebrow"><span /> SEU CANTINHO DE GESTÃO</div>
        <h1>Um começo doce<br /><em>para organizar tudo.</em></h1>
        <p className="setup-lede">Conecte seu banco de dados para começar a cuidar do estoque, das receitas e das vendas em um só lugar.</p>
        <div className="setup-steps">
          <div className="setup-step"><span className="step-icon"><Database size={19} /></span><div><strong>1. Crie o projeto Supabase</strong><span>Escolha a região São Paulo para o banco.</span></div><Check className="step-check" size={17} /></div>
          <div className="setup-step"><span className="step-icon"><KeyRound size={19} /></span><div><strong>2. Configure as chaves</strong><span>Preencha as variáveis no ambiente local e na Vercel.</span></div><Check className="step-check" size={17} /></div>
        </div>
        <div className="setup-help"><span>O passo a passo completo está no</span> <a href="https://supabase.com/docs/guides/auth/server-side/nextjs" target="_blank" rel="noreferrer">guia de configuração <ArrowUpRight size={13} /></a></div>
      </div>
      <div className="setup-preview" aria-hidden="true">
        <div className="preview-paper">
          <div className="preview-top"><div className="preview-badge">✿</div><span>PAINEL MARICOTA</span><div className="preview-menu"><i /><i /><i /></div></div>
          <div className="preview-title">Bom dia, Maricota <span>☀</span></div>
          <div className="preview-subtitle">Aqui está o resumo do seu ateliê.</div>
          <div className="preview-stat-row"><div className="preview-stat"><span>VENDAS NO MÊS</span><strong>R$ 8.420</strong><small>↗ 12% neste mês</small></div><div className="preview-stat blush"><span>A RECEBER</span><strong>R$ 1.280</strong><small>4 pagamentos pendentes</small></div></div>
          <div className="preview-chart-label">Ritmo das encomendas</div><div className="preview-bars">{[36, 52, 43, 68, 55, 82, 63, 91, 70, 76, 100, 79].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
          <div className="preview-footer"><span><i className="preview-legend" /> vendas por semana</span><span>últimos 30 dias</span></div>
        </div>
        <div className="floating-note note-a"><span>✿</span> Feito à mão, com carinho</div><div className="floating-note note-b">🍓 <strong>Estoque em dia</strong></div>
      </div>
    </main>
  );
}
