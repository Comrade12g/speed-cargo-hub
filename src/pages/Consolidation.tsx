import { FormEvent, useEffect, useMemo, useState } from "react";
import { Boxes, Filter, Plus, ShipWheel } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Container, Entry, Warehouse } from "@/types";

export default function Consolidation() {
  const [warehouse, setWarehouse] = useState<Warehouse>("yiwu");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [containerId, setContainerId] = useState("");
  const [seal, setSeal] = useState("");
  const [lane, setLane] = useState("Tema, Ghana");
  const selectedEntries = useMemo(() => entries.filter((entry) => selected.includes(entry.id)), [entries, selected]);
  const selectionLane = selectedEntries[0]?.destination_lane;
  const load = async () => {
    const [{ data: entryRows }, { data: containerRows }] = await Promise.all([supabase.from("entries").select("*").eq("status", "consolidation_ready").eq("warehouse", warehouse).order("entry_date"), supabase.from("containers").select("*").eq("warehouse", warehouse).order("created_at", { ascending: false })]);
    setEntries((entryRows || []) as Entry[]); setContainers((containerRows || []) as Container[]); setSelected([]); setContainerId("");
  };
  useEffect(() => { load(); }, [warehouse]);
  const toggle = (entry: Entry) => {
    if (selected.length && selectionLane !== entry.destination_lane) return toast.error("Select entries from the same destination lane.");
    setSelected((current) => current.includes(entry.id) ? current.filter((id) => id !== entry.id) : [...current, entry.id]);
  };
  const createContainer = async (event: FormEvent) => { event.preventDefault(); const { data, error } = await supabase.from("containers").insert({ warehouse, destination_lane: lane, seal_number: seal }).select().single(); if (error) toast.error(error.message); else { toast.success("Container created"); setSeal(""); await load(); setContainerId(data.id); } };
  const assign = async () => { if (!selected.length || !containerId) return toast.error("Choose entries and an open container."); const container = containers.find((row) => row.id === containerId); if (!container || container.destination_lane !== selectionLane) return toast.error("Container lane must match selected entries."); const { error } = await supabase.rpc("assign_entries_to_container", { target_container: containerId, target_entries: selected }); if (error) toast.error(error.message); else { toast.success(`${selected.length} entries consolidated`); load(); } };
  const updateStatus = async (id: string, status: Container["status"]) => { const { error } = await supabase.from("containers").update({ status }).eq("id", id); if (error) toast.error(error.message); else load(); };
  const openMatching = containers.filter((row) => row.status === "open" && (!selectionLane || row.destination_lane === selectionLane));

  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ed1c2a]">Operations admin</p><h1 className="mt-2 text-3xl font-black">Container consolidation</h1><p className="mt-2 text-slate-500">Group ready entries by warehouse and destination lane.</p></div><Select value={warehouse} onValueChange={(v) => setWarehouse(v as Warehouse)}><SelectTrigger className="h-11 w-52 rounded-xl bg-white"><Filter className="mr-2 size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yiwu">Yiwu 义乌</SelectItem><SelectItem value="guangzhou">Guangzhou 广州</SelectItem></SelectContent></Select></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><section className="overflow-hidden rounded-3xl border bg-white"><div className="flex items-center justify-between border-b p-5"><h2 className="font-black">Ready entries</h2><Badge className="rounded-full bg-[#062542]">{entries.length}</Badge></div><div className="divide-y">{entries.length ? entries.map((entry) => <button key={entry.id} onClick={() => toggle(entry)} className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50"><Checkbox checked={selected.includes(entry.id)} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-mono font-black">{entry.entry_number}</p>{entry.needs_review && <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Needs review</Badge>}</div><p className="mt-1 truncate text-sm text-slate-500">{entry.destination_lane} · Received {new Date(entry.entry_date).toLocaleDateString()}</p></div></button>) : <div className="p-12 text-center text-sm text-slate-500">No entries are waiting for consolidation.</div>}</div></section>
      <div className="space-y-6"><section className="rounded-3xl bg-[#062542] p-6 text-white"><Boxes className="text-[#ed1c2a]" /><h2 className="mt-4 text-xl font-black">Assign selected</h2><p className="mt-2 text-sm text-white/55">{selected.length} entries · {selectionLane || "Select a lane"}</p><Select value={containerId} onValueChange={setContainerId}><SelectTrigger className="mt-5 h-12 rounded-xl border-white/15 bg-white/10 text-white"><SelectValue placeholder="Choose open container" /></SelectTrigger><SelectContent>{openMatching.map((container) => <SelectItem key={container.id} value={container.id}>{container.seal_number} · {container.destination_lane}</SelectItem>)}</SelectContent></Select><Button onClick={assign} className="mt-4 h-12 w-full rounded-xl bg-[#ed1c2a] font-black hover:bg-[#c91521]">Assign to container</Button></section>
        <form onSubmit={createContainer} className="rounded-3xl border bg-white p-6"><div className="flex items-center gap-3"><Plus className="text-[#ed1c2a]" /><h2 className="font-black">New container</h2></div><div className="mt-5"><Label>Seal number</Label><Input required value={seal} onChange={(e) => setSeal(e.target.value.toUpperCase())} placeholder="SCG-2026-001" className="mt-2 h-11 rounded-xl" /></div><div className="mt-4"><Label>Destination lane</Label><Input required value={lane} onChange={(e) => setLane(e.target.value)} className="mt-2 h-11 rounded-xl" /></div><Button className="mt-5 w-full rounded-xl" variant="outline">Create open container</Button></form>
      </div></div>
    <section className="mt-7"><h2 className="text-xl font-black">Container register</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{containers.map((container) => <div key={container.id} className="rounded-2xl border bg-white p-5"><div className="flex items-start justify-between"><div className="grid size-10 place-items-center rounded-xl bg-red-50 text-[#ed1c2a]"><ShipWheel /></div><Badge variant="outline" className="capitalize">{container.status.replace("_", " ")}</Badge></div><p className="mt-5 font-mono text-lg font-black">{container.seal_number}</p><p className="mt-1 text-sm text-slate-500">{container.destination_lane}</p><Select value={container.status} onValueChange={(v) => updateStatus(container.id, v as Container["status"])}><SelectTrigger className="mt-4 h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{["open","sealed","departed","arrived_port","customs","deconsolidated"].map((status) => <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>)}</div></section>
  </div>;
}
