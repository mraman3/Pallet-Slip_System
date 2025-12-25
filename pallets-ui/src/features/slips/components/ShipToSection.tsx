import React from "react";
import type { ClientAddress } from "../../../types/domain";
import "./css/ShipToSection.css"

/**
 * Props for ShipToSection
 *
 * Responsibilities:
 * - Display ship-to address selector
 * - Disable selection until a client is chosen
 *
 * Non-responsibilities:
 * - Fetching addresses
 * - Validation logic
 */
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
    <fieldset className="ship-to-section">
      <legend>Ship To</legend>

      <div className="field">
        <label>
          Address:
          <select
            value={selectedAddressId}
            onChange={(e) =>
              setSelectedAddressId(e.target.value ? Number(e.target.value) : "")
            }
            disabled={!clientSelected}
          >
            <option value="">-- Select Address --</option>

            {addresses
              .slice()
              .sort((a, b) => {
                if (a.active !== b.active) return Number(b.active) - Number(a.active);
                return (a.location_name || "").localeCompare(b.location_name || "");
              })
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.location_name} — {a.city}
                  {!a.active ? " (inactive)" : ""}
                </option>
              ))}
          </select>
        </label>

        {!clientSelected && (
          <div className="hint">
            Select a client to choose a ship-to address.
          </div>
        )}
      </div>
    </fieldset>
  );
};

export default ShipToSection;
