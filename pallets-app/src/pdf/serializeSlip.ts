import type { SlipWithRelations } from "../types/slipApi";

/**
 * Serializes a Prisma slip record into an API-safe format.
 *
 * Prisma returns Date objects, which cannot be sent directly
 * over JSON. This function converts all Date fields to ISO strings
 * while preserving the original data shape.
 *
 * @param slip Prisma slip with relations loaded
 * @returns SlipWithRelations ready for API / PDF usage
 */
export const serializeSlip = (slip: any): SlipWithRelations => {
  return {
    // Spread base slip fields
    ...slip,

    // Convert top-level date fields
    date: slip.date.toISOString(),
    date_shipped: slip.date_shipped
      ? slip.date_shipped.toISOString()
      : null,

    created_at: slip.created_at.toISOString(),
    updated_at: slip.updated_at.toISOString(),

    // Shallow-copy items to preserve immutability
    // (No date fields currently exist on items)
    items: slip.items.map((item: any) => ({
      ...item,
    })),
  };
};
