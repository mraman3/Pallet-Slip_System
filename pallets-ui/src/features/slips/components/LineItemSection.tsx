import React from "react";
import type { PalletType } from "../../../types/domain";

type UiSlipItem = {
  pallet_type_id: number | "";
  qty_ordered: string;
  qty_shipped: string;
};

type Props = {
  items: UiSlipItem[];
  palletTypes: PalletType[];
  onChange: <K extends keyof UiSlipItem>(
    index: number,
    key: K,
    value: UiSlipItem[K]
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const LineItemSection: React.FC<Props> = ({
  items,
  palletTypes,
  onChange,
  onAdd,
  onRemove,
}) => {
  return (
    <fieldset style={{ marginBottom: 16 }}>
      <legend>Line Items</legend>

      {items.map((item, index) => (
        <div
          key={index}
          style={{ display: "flex", gap: 16, marginBottom: 8 }}
        >
          <label>
            Pallet Type:&nbsp;
            <select
              value={item.pallet_type_id}
              onChange={(e) =>
                onChange(
                  index,
                  "pallet_type_id",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">-- Select --</option>
              {palletTypes
                .slice()
                .sort((a, b) => {
                  if (a.active !== b.active)
                    return (b.active ? 1 : 0) - (a.active ? 1 : 0);
                  return a.name.localeCompare(b.name);
                })
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.active ? "" : " (inactive)"}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Qty Ordered:&nbsp;
            <input
              type="text"
              value={item.qty_ordered}
              onChange={(e) =>
                onChange(index, "qty_ordered", e.target.value)
              }
            />
          </label>

          <label>
            Qty Shipped:&nbsp;
            <input
              type="text"
              value={item.qty_shipped}
              onChange={(e) =>
                onChange(index, "qty_shipped", e.target.value)
              }
            />
          </label>

          <button
            type="button"
            onClick={() => onRemove(index)}
            style={{ alignSelf: "flex-end" }}
          >
            ✕
          </button>
        </div>
      ))}

      <button type="button" onClick={onAdd}>
        + Add Pallet Type
      </button>
    </fieldset>
  );
};

export default LineItemSection;