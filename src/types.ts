export type Warehouse = "yiwu" | "guangzhou";
export type Role = "warehouse_staff" | "ops_admin";
export type Profile = { id: string; full_name: string; role: Role; warehouse: Warehouse | null };
export type EntryStatus = "intake_open" | "consolidation_ready" | "consolidated" | "in_transit" | "arrived" | "cleared" | "ready_for_collection" | "collected" | "exception";
export type Entry = { id: string; entry_number: string; warehouse: Warehouse; entry_date: string; supplier_tracking_number: string | null; destination_lane: string; status: EntryStatus; needs_review: boolean; container_id: string | null; created_at: string };
export type LineItem = { id: string; entry_id: string; description_en: string; description_cn: string; material: string; ctn_count: number; length_cm: number; width_cm: number; height_cm: number; weight_per_ctn_kg: number; photo_url: string | null; cbm_per_ctn: number; total_cbm: number; total_kg: number };
export type Container = { id: string; warehouse: Warehouse; destination_lane: string; seal_number: string; status: "open" | "sealed" | "departed" | "arrived_port" | "customs" | "deconsolidated"; voyage_id: string | null; created_at: string };
export type Voyage = { id: string; vessel_name: string; port_of_loading: string; port_of_discharge: string; etd: string; atd: string | null; eta: string; ata: string | null; status: "scheduled" | "departed" | "in_transit" | "arrived"; created_at: string };
