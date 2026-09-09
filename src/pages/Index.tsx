import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, MapPin, PackageCheck, Search, Ship } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TrackingResult = { entry_number: string; current_status: string; eta: string | null; timeline: { status: string; timestamp: string; notes?: string; entity_type: string }[] };

export default function Index() {
  const [entryNumber, setEntryNumber] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const track = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setResult(null);
    const code = entryNumber.trim().toUpperCase();
    if (!/^(GHY\d{3,}|GZG\d{3,}|HTG-\d+)$/.test(code)) { setError("Enter a valid GHY, GZG or HTG tracking number."); return; }
    setLoading(true);
    try {
      let response = await fetch(`/api/track/${encodeURIComponent(code)}`);
      if (!response.headers.get("content-type")?.includes("application/json")) {
        response = await fetch(`https://vtmltgqdegrhhoxtegkt.supabase.co/functions/v1/track?entry_number=${encodeURIComponent(code)}`);
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tracking is temporarily unavailable.");
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Tracking is temporarily unavailable."); }
    finally { setLoading(false); }
  };
  return <div className="min-h-screen bg-[#f6f9fc] text-[#062542]">
    <header className="border-b-2 border-[#ed1c2a] bg-[#062542] text-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Brand light /><div className="flex items-center gap-4"><span className="hidden text-sm text-white/60 sm:inline">China to Ghana logistics</span><Link to="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10">Team login</Link></div></div></header>
    <main>
      <section className="relative overflow-hidden border-b bg-white"><div className="absolute right-0 top-0 h-full w-1/3 bg-[#eaf2f8] [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" /><div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#ed1c2a]">Live cargo check</p><h1 className="mt-4 max-w-3xl text-5xl font-black leading-[.95] tracking-tight sm:text-7xl">Your cargo,<br />clearly tracked.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Follow each milestone from our China warehouse through consolidation, ocean transit, customs and collection in Ghana.</p><form onSubmit={track} className="mt-9 rounded-2xl border bg-white p-3 shadow-xl shadow-[#062542]/10 sm:flex"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><Input value={entryNumber} onChange={(e) => setEntryNumber(e.target.value)} placeholder="e.g. GHY001" className="h-14 border-0 pl-12 text-base shadow-none focus-visible:ring-0" /></div><Button disabled={loading} className="h-14 w-full rounded-xl bg-[#ed1c2a] px-8 font-black hover:bg-[#c91521] sm:w-auto">{loading ? <LoaderCircle className="animate-spin" /> : <>Track cargo <ArrowRight className="ml-2 size-4" /></>}</Button></form>{error && <p className="mt-3 text-sm font-semibold text-[#c91521]">{error}</p>}</div><div className="hidden items-center justify-center md:flex"><div className="relative grid size-80 place-items-center rounded-full border-[28px] border-[#dbe8f1]"><Ship className="size-32 text-[#ed1c2a]" /><div className="absolute -bottom-3 right-0 rounded-2xl bg-[#062542] px-5 py-4 text-white shadow-xl"><p className="text-xs uppercase text-white/50">Route</p><p className="font-black">China → Tema</p></div></div></div></div></section>
      {result ? <section className="mx-auto max-w-5xl px-5 py-12"><div className="overflow-hidden rounded-3xl border bg-white shadow-xl shadow-[#062542]/8"><div className="flex flex-col justify-between gap-4 bg-[#062542] p-7 text-white sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-widest text-[#ed1c2a]">Shipment {result.entry_number}</p><h2 className="mt-2 text-3xl font-black capitalize">{result.current_status}</h2></div>{result.eta && <div className="rounded-xl bg-white/10 px-5 py-3"><p className="text-xs text-white/50">Estimated arrival</p><p className="font-bold">{new Date(result.eta).toLocaleDateString()}</p></div>}</div><div className="p-7"><h3 className="font-black">Shipment timeline</h3><div className="mt-6 space-y-0">{result.timeline.length ? result.timeline.map((item, index) => <div key={`${item.timestamp}-${index}`} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-[#ed1c2a]"><CheckCircle2 className="size-5" /></div>{index < result.timeline.length - 1 && <div className="absolute bottom-0 left-5 top-10 w-px bg-slate-200" />}<div><p className="font-bold">{item.status}</p><p className="mt-1 text-sm text-slate-500">{new Date(item.timestamp).toLocaleString()} · {item.entity_type}</p>{item.notes && <p className="mt-2 text-sm text-slate-600">{item.notes}</p>}</div></div>) : <p className="text-sm text-slate-500">Your shipment has been received. Milestones will appear here as it progresses.</p>}</div></div></div></section> : <section className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-6"><PackageCheck className="text-[#ed1c2a]" /><h3 className="mt-5 font-black">Warehouse received</h3><p className="mt-2 text-sm leading-6 text-slate-500">Cargo is checked, measured and photographed at intake.</p></div><div className="rounded-2xl border bg-white p-6"><Ship className="text-[#ed1c2a]" /><h3 className="mt-5 font-black">Ocean milestones</h3><p className="mt-2 text-sm leading-6 text-slate-500">See consolidation, departure and estimated arrival updates.</p></div><div className="rounded-2xl border bg-white p-6"><MapPin className="text-[#ed1c2a]" /><h3 className="mt-5 font-black">Ghana collection</h3><p className="mt-2 text-sm leading-6 text-slate-500">Know when customs clears and your goods are ready.</p></div></section>}
    </main><footer className="bg-[#062542] px-5 py-8 text-center text-sm text-white/55">© 2026 Speed Cargo Ghana · Milestone tracking, not live GPS</footer>
  </div>;
}
