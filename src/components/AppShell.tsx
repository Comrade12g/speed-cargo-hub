import { NavLink, Outlet } from "react-router-dom";
import { Boxes, ClipboardPlus, Languages, LayoutDashboard, LogOut, Menu, Ship, Users, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/app", label: t.dashboard, icon: LayoutDashboard, end: true },
    { to: "/app/intake", label: t.intake, icon: ClipboardPlus },
    ...(profile?.role === "ops_admin" ? [
      { to: "/app/consolidation", label: t.consolidation, icon: Boxes },
      { to: "/app/voyages", label: t.voyages, icon: Ship },
      { to: "/app/staff", label: t.staff, icon: Users },
    ] : []),
  ];
  return <div className="min-h-screen bg-[#f3f7fb] text-[#062542]">
    <aside className={cn("fixed inset-y-0 left-0 z-40 w-72 bg-[#062542] p-5 text-white transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-center justify-between"><Brand light /><Button variant="ghost" size="icon" className="text-white lg:hidden" onClick={() => setOpen(false)}><X /></Button></div>
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-wider text-white/55">Signed in as</p><p className="mt-2 font-bold">{profile?.full_name || "Speed Cargo user"}</p><p className="mt-1 text-sm text-white/60">{profile?.role === "ops_admin" ? "Operations admin" : `${profile?.warehouse === "yiwu" ? "Yiwu" : "Guangzhou"} warehouse`}</p></div>
      <nav className="mt-7 space-y-2">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition", isActive ? "bg-[#ed1c2a] text-white shadow-lg shadow-red-950/20" : "text-white/70 hover:bg-white/10 hover:text-white")}><Icon className="size-5" />{label}</NavLink>)}</nav>
      <Button variant="ghost" className="absolute bottom-5 left-5 right-5 w-[calc(100%-2.5rem)] justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => supabase.auth.signOut()}><LogOut className="size-5" />{t.signOut}</Button>
    </aside>
    {open && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-[#062542]/45 lg:hidden" onClick={() => setOpen(false)} />}
    <div className="lg:pl-72">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b bg-white/95 px-4 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen(true)}><Menu /></Button><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#ed1c2a]">China → Ghana</p><p className="font-bold">Operations control centre</p></div></div><Button variant="outline" className="gap-2 rounded-full" onClick={() => setLanguage(language === "en" ? "zh" : "en")}><Languages className="size-4" />{language === "en" ? "中文" : "English"}</Button></header>
      <main className="mx-auto max-w-7xl p-4 sm:p-8"><Outlet /></main>
    </div>
  </div>;
}
