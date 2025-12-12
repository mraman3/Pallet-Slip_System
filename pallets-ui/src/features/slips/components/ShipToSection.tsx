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
            <option value="">-- Select --</option>
            {addresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {addr.location_name ? `${addr.location_name} — ` : ""}
                {addr.address}, {addr.city}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
};

export default ShipToSection;
