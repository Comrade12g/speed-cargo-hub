import { FormEvent, useEffect, useState } from "react";
import { Edit3, KeyRound, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Role, Warehouse } from "@/types";

type StaffUser = { id: string; email: string; full_name: string; role: Role; warehouse: Warehouse | null; created_at: string };
const blank = { email: "", password: "", full_name: "", role: "warehouse_staff" as Role, warehouse: "yiwu" as Warehouse };
const endpoint = "https://vtmltgqdegrhhoxtegkt.supabase.co/functions/v1/admin-users";

export default function Staff() {
  const { session } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const request = async (method: string, body?: object, query = "") => {
    const response = await fetch(endpoint + query, { method, headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json", apikey: "sb_publishable_KB-lDtkSoC2NAyHfn1eqBQ_pPSab2fX" }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "Account request failed"); return data;
  };
  const load = async () => { try { setUsers(await request("GET")); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load accounts"); } };
  useEffect(() => { if (session) load(); }, [session]);
  const save = async (event: FormEvent) => { event.preventDefault(); try { if (editing) await request("PATCH", { ...form, id: editing }); else await request("POST", form); toast.success(editing ? "Account updated" : "Account created"); setEditing(null); setForm(blank); load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save account"); } };
  const edit = (user: StaffUser) => { setEditing(user.id); setForm({ email: user.email, password: "", full_name: user.full_name, role: user.role, warehouse: user.warehouse || "yiwu" }); };
  const remove = async (id: string) => { try { await request("DELETE", undefined, `?id=${id}`); toast.success("Account removed"); load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove account"); } };

  return <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ed1c2a]">Access control</p><h1 className="mt-2 text-3xl font-black">Staff accounts</h1><p className="mt-2 text-slate-500">Create accounts and permanently scope warehouse staff to one China branch.</p>
    <form onSubmit={save} className="mt-8 rounded-3xl border bg-white p-6"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-red-50 text-[#ed1c2a]">{editing ? <Edit3 /> : <Plus />}</div><h2 className="font-black">{editing ? "Edit account" : "Create account"}</h2></div><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-5"><div><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-2 h-11 rounded-xl" /></div><div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 h-11 rounded-xl" /></div><div><Label>{editing ? "New password (optional)" : "Temporary password"}</Label><Input required={!editing} minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 h-11 rounded-xl" /></div><div><Label>Role</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}><SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="warehouse_staff">Warehouse staff</SelectItem><SelectItem value="ops_admin">Ops admin</SelectItem></SelectContent></Select></div><div><Label>Assigned warehouse</Label><Select disabled={form.role === "ops_admin"} value={form.warehouse} onValueChange={(v) => setForm({ ...form, warehouse: v as Warehouse })}><SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yiwu">Yiwu 义乌</SelectItem><SelectItem value="guangzhou">Guangzhou 广州</SelectItem></SelectContent></Select></div></div><div className="mt-5 flex gap-3"><Button className="rounded-xl bg-[#ed1c2a] font-black hover:bg-[#c91521]">{editing ? "Save account" : "Create account"}</Button>{editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}</div></form>
    <div className="mt-7 overflow-hidden rounded-3xl border bg-white"><div className="border-b p-5"><h2 className="font-black">Team directory</h2></div><div className="divide-y">{users.map((user) => <div key={user.id} className="grid gap-4 p-5 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-full bg-[#eef4f9] text-[#062542]"><UserCog className="size-5" /></div><div><p className="font-bold">{user.full_name || "Unnamed account"}</p><p className="text-sm text-slate-500">{user.email}</p></div></div><Badge variant="outline" className="w-fit capitalize">{user.role.replace("_", " ")}</Badge><p className="text-sm font-semibold capitalize text-slate-500">{user.warehouse || "All warehouses"}</p><div className="flex gap-2"><Button size="icon" variant="outline" onClick={() => edit(user)}><Edit3 className="size-4" /></Button><Button size="icon" variant="outline" className="text-[#ed1c2a]" onClick={() => remove(user.id)}><Trash2 className="size-4" /></Button></div></div>)}</div></div><div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950"><KeyRound className="mt-0.5 size-5 shrink-0" /><p>Warehouse assignment is controlled by administrators and is never selected by staff during intake.</p></div>
  </div>;
}
