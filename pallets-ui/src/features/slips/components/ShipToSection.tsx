import React from "react";
import type { ClientAddress } from "../../../types/domain";

type Props = {
  addresses: ClientAddress[];
  selectedAddressId: number | "";
  setSelectedAddressId: (value: number | "") => void;
  clientSelected: boolean;
};

const ShipToSection: React.FC<Props> = ({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  clientSelected,
}) => {
  return (
    <fieldset style={{ marginBottom: 16 }}>
      <legend>Ship To</legend>

      <div style={{ marginBottom: 8 }}>
        <label>
          Address:&nbsp;
          <select
            value={selectedAddressId}
            onChange={(e) =>
              setSelectedAddressId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
            disabled={!clientSelected}
          >
            {addresses
              .slice()
              .sort((a, b) => {
                if (a.active !== b.active) return (b.active ? 1 : 0) - (a.active ? 1 : 0);
                return (a.location_name || "").localeCompare(b.location_name || "");
              })
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.location_name} — {a.city}{a.active ? "" : " (inactive)"}
                </option>
              ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
};

export default ShipToSection;
