import React from "react";
import type { PalletType } from "../../../types/domain";
import "./css/LineItemSection.css"

/**
 * UI-only line item representation
 */
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

/**
 * LineItemSection
 *
 * Responsibilities:
 * - Render pallet line items
 * - Allow add / remove
 *
 * Non-responsibilities:
 * - Validation
 * - Totals
 */
const LineItemSection: React.FC<Props> = ({
  items,
  palletTypes,
  onChange,
  onAdd,
  onRemove,
}) => {
  return (
    <fieldset className="line-item-section">
      <legend>Line Items</legend>

      {items.map((item, index) => (
        <div key={index} className="line-item-row">

          {/* Pallet type */}
          <label>
            Pallet Type:
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

          {/* Qty ordered */}
          <label>
            Qty Ordered:
            <input
              type="text"
              value={item.qty_ordered}
              onChange={(e) =>
                onChange(index, "qty_ordered", e.target.value)
              }
            />
          </label>

          {/* Qty shipped */}
          <label>
            Qty Shipped:
            <input
              type="text"
              value={item.qty_shipped}
              onChange={(e) =>
                onChange(index, "qty_shipped", e.target.value)
              }
            />
          </label>

          {/* Remove button */}
          <button type="button" onClick={() => onRemove(index)} className="remove-line-item">
            ✕
          </button>
        </div>
      ))}

      <button type="button" onClick={onAdd} className="add-line-item">
        + Add Pallet Type
      </button>
    </fieldset>
  );
};

export default LineItemSection;