// src/types/slipApi.ts

export type SlipItemApi = {
  id: number;
  slip_id: number;
  pallet_type_id: number;
  qty_ordered: string;
  qty_shipped: string;
  pallet_type?: {
    id: number;
    name: string;
  };
};

export type SlipWithRelations = {
  id: number;
  slip_number: string;
  client_id: number;
  ship_to_address_id: number;
  clerk_id: number;

  date: string; // ISO
  customer_order: string;
  date_shipped: string | null; // ISO or null
  shipped_via: "BPI" | "P/U";

  comments_line1: string | null;
  comments_line2: string | null;

  // relations (optional but returned from API)
  client?: any;
  ship_to_address?: any;
  clerk?: any;

  items: SlipItemApi[];
};
