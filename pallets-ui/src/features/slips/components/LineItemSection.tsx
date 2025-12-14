import React from "react";
import type { PalletType, SlipItem } from "../../../types/domain";

type Props = {
  item: SlipItem;
  setItem: (value: SlipItem) => void;
  palletTypes: PalletType[];
};

const LineItemSection: React.FC<Props> = ({
  item,
  setItem,
  palletTypes,
}) => {
  return (
    <fieldset style={{ marginBottom: 16 }}>
      <legend>Line Item</legend>

      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <label>
          Pallet Type:&nbsp;
          <select
            value={item.pallet_type_id}
            onChange={(e) =>
              setItem({
                ...item,
                pallet_type_id: e.target.value
                  ? Number(e.target.value)
                  : "",
              })
            }
          >
            <option value="">-- Select --</option>
            {palletTypes
              .slice()
              .sort((a, b) => {
                if (a.active !== b.active) return (b.active ? 1 : 0) - (a.active ? 1 : 0);
                return a.name.localeCompare(b.name);
              })
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.active ? "" : " (inactive)"}
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
              setItem({
                ...item,
                qty_ordered: Number(e.target.value) || 0,
              })
            }
          />
        </label>

        <label>
          Qty Shipped:&nbsp;
          <input
            type="text"
            value={item.qty_shipped}
            onChange={(e) =>
              setItem({
                ...item,
                qty_shipped: Number(e.target.value) || 0,
              })
            }
          />
        </label>
      </div>
    </fieldset>
  );
};

export default LineItemSection;
