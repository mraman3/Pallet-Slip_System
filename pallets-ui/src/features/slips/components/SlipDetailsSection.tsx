import React from "react";
import type { Clerk } from "../../../types/domain";

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
    <fieldset style={{ marginBottom: 16 }}>
      <legend>Slip Details</legend>

      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <label>
          Date:&nbsp;
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label>
          Customer Order:&nbsp;
          <input
            type="text"
            value={customerOrder}
            onChange={(e) => setCustomerOrder(e.target.value)}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <label>
          Date Shipped:&nbsp;
          <input
            type="date"
            value={dateShipped}
            onChange={(e) => setDateShipped(e.target.value)}
          />
        </label>

        <label>
          Clerk:&nbsp;
          <select
            value={selectedClerkId}
            onChange={(e) =>
              setSelectedClerkId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
          >
            <option value="">-- Select --</option>
            {clerks.map((clerk) => (
              <option key={clerk.id} value={clerk.id}>
                {clerk.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 8 }}>
        Shipped via:&nbsp;
        <label>
          <input
            type="radio"
            value="BPI"
            checked={shippedVia === "BPI"}
            onChange={() => setShippedVia("BPI")}
          />
          BPI
        </label>
        &nbsp;&nbsp;
        <label>
          <input
            type="radio"
            value="P/U"
            checked={shippedVia === "P/U"}
            onChange={() => setShippedVia("P/U")}
          />
          P/U
        </label>
      </div>
    </fieldset>
  );
};

export default SlipDetailsSection;
