import { FormEvent, useEffect, useMemo, useState } from "react";
import { Camera, Check, Edit3, LoaderCircle, PackagePlus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Entry, LineItem, Warehouse } from "@/types";

const emptyItem = { description_en: "", description_cn: "", material: "", ctn_count: "1", length_cm: "", width_cm: "", height_cm: "", weight_per_ctn_kg: "" };

export default function Intake() {
  const { profile, session } = useAuth();
  const [warehouse, setWarehouse] = useState<Warehouse>(profile?.warehouse || "yiwu");
  const [code, setCode] = useState("");
  const [supplierTracking, setSupplierTracking] = useState("");
  const [lane, setLane] = useState("Tema, Ghana");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [item, setItem] = useState(emptyItem);
  const [photo, setPhoto] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");

  useEffect(() => { if (profile?.warehouse) setWarehouse(profile.warehouse); }, [profile]);
  const totals = useMemo(() => items.reduce((sum, row) => ({ cbm: sum.cbm + Number(row.total_cbm), kg: sum.kg + Number(row.total_kg), cartons: sum.cartons + row.ctn_count }), { cbm: 0, kg: 0, cartons: 0 }), [items]);
  const validCode = (value: string) => value.startsWith("HTG-") ? /^HTG-\d+$/.test(value) : warehouse === "yiwu" ? /^GHY\d{3,}$/.test(value) : /^GZG\d{3,}$/.test(value);

  const loadItems = async (entryId: string) => {
    const { data } = await supabase.from("line_items").select("*").eq("entry_id", entryId).order("created_at");
    setItems((data || []) as LineItem[]);
  };

  const startEntry = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!validCode(normalized)) { setCodeError(warehouse === "yiwu" ? "Use GHY followed by at least 3 digits, or HTG- followed by digits." : "Use GZG followed by at least 3 digits, or HTG- followed by digits."); return; }
    setCodeError(""); setLoading(true);
    const { data: existing } = await supabase.from("entries").select("*").eq("entry_number", normalized).maybeSingle();
    if (existing) {
      if (existing.warehouse !== warehouse && profile?.role !== "ops_admin") toast.error("This entry belongs to another warehouse.");
      else { setEntry(existing as Entry); setSupplierTracking(existing.supplier_tracking_number || ""); setLane(existing.destination_lane); await loadItems(existing.id); toast.success("Entry resumed"); }
      setLoading(false); return;
    }
    const { data, error } = await supabase.from("entries").insert({ entry_number: normalized, warehouse, supplier_tracking_number: supplierTracking || null, destination_lane: lane, needs_review: normalized.startsWith("HTG-"), created_by: session?.user.id }).select().single();
    if (error) toast.error(error.message); else { setEntry(data as Entry); setItems([]); toast.success("Entry opened"); }
    setLoading(false);
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault(); if (!entry || !session) return;
    setLoading(true);
    let photoUrl: string | null = editingId ? items.find((row) => row.id === editingId)?.photo_url || null : null;
    if (photo) {
      const path = `${session.user.id}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const { error } = await supabase.storage.from("cargo-photos").upload(path, photo);
      if (error) { toast.error(error.message); setLoading(false); return; }
      photoUrl = path;
    }
    const payload = { entry_id: entry.id, description_en: item.description_en, description_cn: item.description_cn, material: item.material, ctn_count: Number(item.ctn_count), length_cm: Number(item.length_cm), width_cm: Number(item.width_cm), height_cm: Number(item.height_cm), weight_per_ctn_kg: Number(item.weight_per_ctn_kg), photo_url: photoUrl };
    const query = editingId ? supabase.from("line_items").update(payload).eq("id", editingId) : supabase.from("line_items").insert(payload);
    const { error } = await query;
    if (error) toast.error(error.message); else { toast.success(editingId ? "Line item updated" : "Line item added"); setItem(emptyItem); setPhoto(null); setEditingId(null); await loadItems(entry.id); }
    setLoading(false);
  };

  const editItem = (row: LineItem) => { setEditingId(row.id); setItem({ description_en: row.description_en, description_cn: row.description_cn, material: row.material, ctn_count: String(row.ctn_count), length_cm: String(row.length_cm), width_cm: String(row.width_cm), height_cm: String(row.height_cm), weight_per_ctn_kg: String(row.weight_per_ctn_kg) }); window.scrollTo({ top: 500, behavior: "smooth" }); };
  const deleteItem = async (id: string) => { if (!entry) return; const { error } = await supabase.from("line_items").delete().eq("id", id); if (error) toast.error(error.message); else loadItems(entry.id); };
  const finishEntry = async () => { if (!entry || items.length === 0) return toast.error("Add at least one line item first."); const { error } = await supabase.from("entries").update({ status: "consolidation_ready", supplier_tracking_number: supplierTracking || null, destination_lane: lane }).eq("id", entry.id); if (error) toast.error(error.message); else { toast.success("Entry sent for consolidation"); setEntry(null); setItems([]); setCode(""); } };

  return <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ed1c2a]">Warehouse workflow</p><h1 className="mt-2 text-3xl font-black">Receive cargo</h1><p className="mt-2 text-slate-500">Start or resume an entry, then add one carton line at a time.</p>
    {!entry ? <form onSubmit={startEntry} className="mt-8 rounded-3xl border bg-white p-6 shadow-sm"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"><div><Label>Warehouse</Label>{profile?.role === "ops_admin" ? <Select value={warehouse} onValueChange={(v) => setWarehouse(v as Warehouse)}><SelectTrigger className="mt-2 h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yiwu">Yiwu 义乌</SelectItem><SelectItem value="guangzhou">Guangzhou 广州</SelectItem></SelectContent></Select> : <div className="mt-2 flex h-12 items-center rounded-xl bg-[#eef4f9] px-4 font-bold capitalize">{warehouse}</div>}</div><div><Label>Entry number / 入仓号</Label><div className="relative mt-2"><Search className="absolute left-3 top-3.5 size-5 text-slate-400" /><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={warehouse === "yiwu" ? "GHY001" : "GZG001"} className="h-12 rounded-xl pl-11 font-mono uppercase" /></div>{codeError && <p className="mt-2 text-xs font-semibold text-[#c91521]">{codeError}</p>}</div><div><Label>Supplier tracking no.</Label><Input value={supplierTracking} onChange={(e) => setSupplierTracking(e.target.value)} placeholder="Optional" className="mt-2 h-12 rounded-xl" /></div><div><Label>Destination lane</Label><Input value={lane} onChange={(e) => setLane(e.target.value)} className="mt-2 h-12 rounded-xl" /></div></div><Button disabled={loading} className="mt-6 h-12 rounded-xl bg-[#ed1c2a] px-7 font-black hover:bg-[#c91521]">{loading ? <LoaderCircle className="animate-spin" /> : "Start or resume entry"}</Button></form> : <>
      <div className="mt-7 flex flex-col justify-between gap-4 rounded-3xl bg-[#062542] p-6 text-white sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><h2 className="font-mono text-2xl font-black">{entry.entry_number}</h2>{entry.needs_review && profile?.role === "ops_admin" && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950">Unregistered · needs review</span>}</div><p className="mt-2 text-sm text-white/55">{entry.warehouse.toUpperCase()} · {entry.destination_lane}</p></div><Button variant="outline" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => { setEntry(null); setItems([]); }}>Switch entry</Button></div>
      {entry.status === "intake_open" ? <form onSubmit={saveItem} className="mt-6 rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-red-50 text-[#ed1c2a]"><PackagePlus /></div><div><h2 className="font-black">{editingId ? "Edit line item" : "Add line item"}</h2><p className="text-xs text-slate-500">货物明细</p></div></div><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4"><Field label="Description (English)" value={item.description_en} onChange={(v) => setItem({ ...item, description_en: v })} required /><Field label="品名（中文）" value={item.description_cn} onChange={(v) => setItem({ ...item, description_cn: v })} /><Field label="Material / 材质" value={item.material} onChange={(v) => setItem({ ...item, material: v })} required /><Field label="Cartons / 件数" value={item.ctn_count} onChange={(v) => setItem({ ...item, ctn_count: v })} type="number" required /><Field label="Length cm / 长" value={item.length_cm} onChange={(v) => setItem({ ...item, length_cm: v })} type="number" required /><Field label="Width cm / 宽" value={item.width_cm} onChange={(v) => setItem({ ...item, width_cm: v })} type="number" required /><Field label="Height cm / 高" value={item.height_cm} onChange={(v) => setItem({ ...item, height_cm: v })} type="number" required /><Field label="Weight/carton kg / 单件重量" value={item.weight_per_ctn_kg} onChange={(v) => setItem({ ...item, weight_per_ctn_kg: v })} type="number" required /></div><div className="mt-5 flex flex-wrap items-center gap-3"><label className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold hover:bg-slate-50"><Camera className="size-4" />{photo ? photo.name : "Add photo / 上传照片"}<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></label><Button disabled={loading} className="h-12 rounded-xl bg-[#ed1c2a] px-6 font-black hover:bg-[#c91521]">{editingId ? "Save changes" : "Add line item"}</Button>{editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setItem(emptyItem); }}>Cancel</Button>}</div></form> : <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-900">This entry is locked because intake has been finished.</div>}
      <div className="mt-6 overflow-hidden rounded-3xl border bg-white"><div className="flex items-center justify-between border-b p-5"><h2 className="font-black">Line items ({items.length})</h2><p className="text-sm font-bold text-slate-500">{totals.cartons} ctn · {totals.cbm.toFixed(3)} CBM · {totals.kg.toFixed(1)} kg</p></div><div className="divide-y">{items.length ? items.map((row) => <div key={row.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"><div><p className="font-bold">{row.description_en}</p><p className="text-sm text-slate-500">{row.description_cn || "—"} · {row.material}</p></div><p className="text-sm"><b>{row.ctn_count}</b> cartons<br /><span className="text-slate-500">{row.length_cm} × {row.width_cm} × {row.height_cm} cm</span></p><p className="text-sm"><b>{Number(row.total_cbm).toFixed(3)} CBM</b><br /><span className="text-slate-500">{Number(row.total_kg).toFixed(1)} kg</span></p>{entry.status === "intake_open" && <div className="flex gap-2"><Button size="icon" variant="outline" onClick={() => editItem(row)}><Edit3 className="size-4" /></Button><Button size="icon" variant="outline" className="text-[#ed1c2a]" onClick={() => deleteItem(row.id)}><Trash2 className="size-4" /></Button></div>}</div>) : <div className="p-10 text-center text-sm text-slate-500">No items added yet.</div>}</div></div>
      {entry.status === "intake_open" && <div className="mt-6 flex justify-end"><Button onClick={finishEntry} className="h-13 rounded-xl bg-[#062542] px-7 py-6 font-black hover:bg-[#0a375d]"><Check className="mr-2 size-5" />Finish entry / 完成入库</Button></div>}
    </>}
  </div>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <div><Label>{label}</Label><Input value={value} onChange={(e) => onChange(e.target.value)} type={type} min={type === "number" ? "0.01" : undefined} step={type === "number" ? "0.01" : undefined} required={required} className="mt-2 h-12 rounded-xl" /></div>; }
