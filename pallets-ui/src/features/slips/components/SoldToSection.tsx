import React from "react";
import type { Client } from "../../../types/domain";
import "./css/SoldToSection.css"

type Props = {
  clientSearch: string;
  setClientSearch: (value: string) => void;
  clients: Client[];
  selectedClientId: number | "";
  setSelectedClientId: (value: number | "") => void;
};

const SoldToSection: React.FC<Props> = ({
  clientSearch,
  setClientSearch,
  clients,
  selectedClientId,
  setSelectedClientId,
}) => {
  return (
    <fieldset className="sold-to-section">
      <legend>Sold To (Client)</legend>

      {/* Client search */}
      <div className="field">
        <label>
          Client search:
          <input
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Type client name..."
          />
        </label>
      </div>

      {/* Client select */}
      <div className="field">
        <label>
          Select client:
          <select
            value={selectedClientId}
            onChange={(e) =>
              setSelectedClientId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
          >
            <option value="">-- Select --</option>
            {clients
              .slice()
              .sort((a, b) => {
                const aActive = a.active ? 1 : 0;
                const bActive = b.active ? 1 : 0;
                if (aActive !== bActive) return bActive - aActive; // active first
                return a.name.localeCompare(b.name); // alpha
              })
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.active ? "" : " (inactive)"}
                </option>
              ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
};

export default SoldToSection;
