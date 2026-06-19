// Inventory module shared types
export type Asset = {
  id: string;
  name: string;
  category: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number;
  currentValue: number;
  condition: string;
  location: string | null;
  assignedTo: string | null;
  status: string;
  notes: string | null;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  unitCost: number;
  lastRestock: string | null;
};

export type InventoryData = {
  assets: Asset[];
  items: InventoryItem[];
  kpis: {
    assetValue: number;
    assetCount: number;
    lowStock: number;
    underRepair: number;
    itemCount: number;
  };
};

export const CONDITION_TINT: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  good: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  fair: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  poor: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  damaged: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export const ASSET_STATUS_TINT: Record<string, string> = {
  in_use: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  stored: "bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",
  under_repair: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  disposed: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};
