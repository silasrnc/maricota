import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return (
    <main className="login-screen">
      <div className="login-brand-panel">
        <Link className="brand-lockup login-brand" href="/">
          <Image src="/brand/maricota-logo.png" alt="Maricota Doces Artesanais" width={66} height={66} className="brand-logo" loading="eager" />
          <span className="brand-word">gestão<span>confeitaria</span></span>
        </Link>
        <div className="login-quote"><span className="quote-mark">“</span><p>Pequenos detalhes,<br />grandes momentos.</p><span className="quote-caption">UM DIA MAIS DOCE COMEÇA AQUI</span></div>
        <div className="login-ornament login-ornament-one">✿</div><div className="login-ornament login-ornament-two">✳</div>
        <div className="login-brand-bottom"><Heart size={13} fill="currentColor" /> feito com carinho</div>
      </div>
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-overline">BEM-VINDA DE VOLTA</div>
          <h1>Entre no seu<br /><em>cantinho.</em></h1>
          <p className="login-intro">Acesse seu painel para acompanhar o que acontece no ateliê.</p>
          {configured ? <LoginForm /> : <div className="config-inline"><strong>Falta conectar o Supabase</strong><span>Configure as variáveis do projeto e aplique a migração. O passo a passo está no README.</span></div>}
        </div>
        <div className="login-copyright">© 2026 Maricota Confeitaria · Todos os dias, um novo sabor.</div>
      </div>
    </main>
  );
}
