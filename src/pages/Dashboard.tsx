import { useEffect, useState } from "react";
import { Boxes, ClipboardCheck, PackageOpen, Ship, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ open: 0, ready: 0, containers: 0, voyages: 0 });
  useEffect(() => { (async () => {
    let openQuery = supabase.from("entries").select("id", { count: "exact", head: true }).eq("status", "intake_open");
    let readyQuery = supabase.from("entries").select("id", { count: "exact", head: true }).eq("status", "consolidation_ready");
    if (profile?.role === "warehouse_staff" && profile.warehouse) { openQuery = openQuery.eq("warehouse", profile.warehouse); readyQuery = readyQuery.eq("warehouse", profile.warehouse); }
    const [open, ready, containers, voyages] = await Promise.all([openQuery, readyQuery, supabase.from("containers").select("id", { count: "exact", head: true }).eq("status", "open"), supabase.from("voyages").select("id", { count: "exact", head: true }).in("status", ["scheduled", "departed", "in_transit"])]);
    setStats({ open: open.count || 0, ready: ready.count || 0, containers: containers.count || 0, voyages: voyages.count || 0 });
  })(); }, [profile]);
  const cards = [{ label: "Open intake entries", value: stats.open, icon: PackageOpen }, { label: "Ready to consolidate", value: stats.ready, icon: ClipboardCheck }, ...(profile?.role === "ops_admin" ? [{ label: "Open containers", value: stats.containers, icon: Boxes }, { label: "Active voyages", value: stats.voyages, icon: Ship }] : [])];
  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ed1c2a]">Daily operations</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Welcome, {profile?.full_name?.split(" ")[0] || "team"}.</h1><p className="mt-2 text-slate-500">Here is what needs attention across the cargo flow.</p></div><div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" />Systems operational</div></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="grid size-11 place-items-center rounded-2xl bg-red-50 text-[#ed1c2a]"><Icon className="size-5" /></div><TrendingUp className="size-4 text-slate-300" /></div><p className="mt-8 text-4xl font-black">{value}</p><p className="mt-2 text-sm font-semibold text-slate-500">{label}</p></div>)}</div><div className="mt-8 rounded-3xl bg-[#062542] p-7 text-white"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ed1c2a]">Operating principle</p><h2 className="mt-3 text-2xl font-black">Every movement leaves a milestone.</h2><p className="mt-3 max-w-2xl leading-7 text-white/60">Entry, container and voyage status changes are logged automatically, giving your operations team and customers one dependable history.</p></div></div>;
}
