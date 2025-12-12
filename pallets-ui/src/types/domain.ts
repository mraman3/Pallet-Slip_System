// src/types/domain.ts

export type Client = {
  id: number;
  name: string;
  address: string;
  city: string;
  province: string;
  postal: string;
};

export type ClientAddress = {
  id: number;
  client_id: number;
  location_name: string | null;
  address: string;
  city: string;
  province: string;
  postal: string;
};

export type Clerk = {
  id: number;
  name: string;
};

export type PalletType = {
  id: number;
  name: string;
};

export type SlipItemInput = {
  pallet_type_id: number | "";
  qty_ordered: string;
  qty_shipped: string;
};
