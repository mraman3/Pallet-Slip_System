import React from "react";
import type { Client } from "../../../types/domain";

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
    <fieldset style={{ marginBottom: 16 }}>
      <legend>Sold To (Client)</legend>

      <div style={{ marginBottom: 8 }}>
        <label>
          Client search:&nbsp;
          <input
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Type client name..."
          />
        </label>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>
          Select client:&nbsp;
          <select
            value={selectedClientId}
            onChange={(e) =>
              setSelectedClientId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
          >
            <option value="">-- Select --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.city}, {c.province}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
};

export default SoldToSection;
