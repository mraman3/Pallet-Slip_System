import React from "react";
import type { PalletType, SlipItemInput } from "../../../types/domain";

type Props = {
  item: SlipItemInput;
  setItem: (value: SlipItemInput) => void;
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
            {palletTypes.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.name}
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
                qty_ordered: e.target.value,
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
                qty_shipped: e.target.value,
              })
            }
          />
        </label>
      </div>
    </fieldset>
  );
};

export default LineItemSection;
