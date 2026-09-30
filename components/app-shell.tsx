"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, CakeSlice, Boxes, ReceiptText, ChartNoAxesCombined, Menu, X, LogOut, ChevronDown, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: CakeSlice },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/vendas", label: "Vendas", icon: ChartNoAxesCombined },
  { href: "/despesas", label: "Despesas", icon: ReceiptText },
];

const pageNames: Record<string, string> = {
  "/": "Visão geral",
  "/produtos": "Produtos e receitas",
  "/estoque": "Estoque",
  "/vendas": "Vendas",
  "/despesas": "Despesas",
};

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-frame">
      <button className={`mobile-scrim ${menuOpen ? "visible" : ""}`} onClick={closeMenu} aria-label="Fechar menu" />
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <Link href="/" className="brand-lockup" onClick={closeMenu}>
          <Image src="/brand/maricota-logo-blue-small.png" alt="Maricota Doces Artesanais" width={76} height={76} className="brand-logo" loading="eager" />
          <span className="brand-word">gestão<span>confeitaria</span></span>
          <button className="mobile-close" type="button" onClick={(event) => { event.preventDefault(); closeMenu(); }} aria-label="Fechar menu"><X size={19} /></button>
        </Link>

        <div className="workspace-card">
          <div className="workspace-avatar">M</div>
          <div className="workspace-copy"><strong>Ateliê Maricota</strong><span>Unidade principal</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="nav-label">MENU</div>
        <nav className="main-nav" aria-label="Navegação principal">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={closeMenu} className={`nav-item ${active ? "nav-active" : ""}`} aria-current={active ? "page" : undefined}>
                <Icon size={18} strokeWidth={active ? 2.15 : 1.8} /><span>{label}</span>
                {href === "/estoque" && <span className="nav-dot" aria-label="Atenção ao estoque" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="season-card">
            <div className="season-card-icon"><Sparkles size={15} /></div>
            <div><span>Vitrine da estação</span><strong>Organize seus especiais</strong></div>
            <Link href="/produtos" onClick={closeMenu} aria-label="Ver produtos"><span>↗</span></Link>
          </div>
          <div className="profile-row">
            <div className="profile-avatar">{(userEmail?.[0] || "M").toUpperCase()}</div>
            <div className="profile-copy"><strong>Minha conta</strong><span>{userEmail || "Proprietária"}</span></div>
            <button className="icon-button logout-button" onClick={signOut} disabled={signingOut} title="Sair" aria-label="Sair"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Maricota</span><span className="crumb-separator">/</span><strong>{pageNames[pathname] || "Gestão"}</strong></div>
          <div className="topbar-right">
            <span className="today-label">Feito com carinho, todos os dias</span>
            <span className="topbar-flower">✳</span>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
