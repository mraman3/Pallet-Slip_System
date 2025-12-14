// src/types/domain.ts

export type Client = {
  id: number;
  name: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  active: boolean;
};

export type ClientAddress = {
  id: number;
  client_id: number;
  location_name: string | null;
  address: string;
  city: string;
  province: string;
  postal: string;
  active: boolean;
};

export type Clerk = {
  id: number;
  name: string;
  active: boolean;
};

export type PalletType = {
  id: number;
  name: string;
  active: boolean;

};

export type SlipItem = {
  id?: number;
  pallet_type_id: number | "";
  qty_ordered: string;
  qty_shipped: string;
};

// ---- Slip ----
export type Slip = {
  id: number;
  slip_number: string;

  client_id: number;
  ship_to_address_id: number;

  clerk_id: number;

  date: string;              // DateTime -> ISO string
  date_shipped: string | null;

  customer_order: string;
  shipped_via: string;

  comments_line1?: string | null;
  comments_line2?: string | null;
};