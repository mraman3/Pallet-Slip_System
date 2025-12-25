import React from "react";
import type { Clerk } from "../../../types/domain";
import "./css/SlipDetailsSection.css"

/**
 * Props for SlipDetailsSection
 *
 * Responsibilities:
 * - Core slip metadata (dates, order #, clerk, shipped via)
 *
 * Non-responsibilities:
 * - Validation
 * - Saving logic
 */
type Props = {
  date: string;
  setDate: (value: string) => void;

  customerOrder: string;
  setCustomerOrder: (value: string) => void;

  dateShipped: string;
  setDateShipped: (value: string) => void;

  clerks: Clerk[];
  selectedClerkId: number | "";
  setSelectedClerkId: (value: number | "") => void;

  shippedVia: "BPI" | "P/U";
  setShippedVia: (v: "BPI" | "P/U") => void;
};

const SlipDetailsSection: React.FC<Props> = ({
  date,
  setDate,
  customerOrder,
  setCustomerOrder,
  dateShipped,
  setDateShipped,
  clerks,
  selectedClerkId,
  setSelectedClerkId,
  shippedVia,
  setShippedVia,
}) => {
  return (
    <fieldset className="slip-details-section">
      <legend>Slip Details</legend>

      {/* Date + Customer Order */}
      <div className="slip-details-grid">
        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label>
          Customer Order:
          <input
            type="text"
            value={customerOrder}
            onChange={(e) => setCustomerOrder(e.target.value)}
          />
        </label>
      </div>

      {/* Date Shipped + Clerk */}
      <div className="slip-details-grid">
        <label>
          Date Shipped:
          <input
            type="date"
            value={dateShipped}
            onChange={(e) => setDateShipped(e.target.value)}
          />
        </label>

        <label>
          Clerk:
          <select
            value={selectedClerkId}
            onChange={(e) =>
              setSelectedClerkId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
          >
            <option value="">-- Select --</option>
            {clerks
              .slice()
              .sort((a, b) => {
                if (a.active !== b.active) return (b.active ? 1 : 0) - (a.active ? 1 : 0);
                return a.name.localeCompare(b.name);
              })
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.active ? "" : " (inactive)"}
                </option>
              ))}
          </select>
        </label>
      </div>

      {/* Shipped via */}
      <div className="shipped-via">
        <span className="label">Shipped via</span>
        <label>
          BPI
          <input
            type="radio"
            value="BPI"
            checked={shippedVia === "BPI"}
            onChange={() => setShippedVia("BPI")}
          />
        </label>

        <label>
          P/U
          <input
            type="radio"
            value="P/U"
            checked={shippedVia === "P/U"}
            onChange={() => setShippedVia("P/U")}
          />
        </label>
      </div>
    </fieldset>
  );
};

export default SlipDetailsSection;
