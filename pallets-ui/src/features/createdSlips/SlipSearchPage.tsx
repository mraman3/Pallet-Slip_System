// src/features/createdSlips/SlipSearchPage.tsx
import React, { useEffect, useState } from "react";
import SlipForm from "../slips/SlipForm";
import type { SlipWithRelations } from "../../types/slipApi";

const SlipSearchPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [slips, setSlips] = useState<SlipWithRelations[]>([]);
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<SlipWithRelations | null>(null);

  // basic filters (add more later)
  const [slipNumber, setSlipNumber] = useState("");

  const fetchSlips = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (slipNumber.trim()) params.set("slip_number", slipNumber.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/slips?${params.toString()}`);
      const data = await res.json();
      setSlips(data);
    } catch (e) {
      console.error("Error fetching slips", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load selected slip
  useEffect(() => {
    if (!selectedSlipId) {
      setSelectedSlip(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/slips/${selectedSlipId}`, { signal: controller.signal });
        const data = await res.json();
        setSelectedSlip(data);
      } catch (e) {
        if ((e as any).name === "AbortError") return;
        console.error("Error loading slip", e);
      }
    })();

    return () => controller.abort();
  }, [selectedSlipId]);

  return (
    <div>
      <h2 style={{ marginBottom: 0 }}>Find / Recent Slips</h2>
      <p style={{ marginTop: 4 }}>Search slips and edit an existing slip.</p>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* LEFT: search + results */}
        <div style={{ flex: 1, minWidth: 420 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Slip Number</label>
            <input
              value={slipNumber}
              onChange={(e) => setSlipNumber(e.target.value)}
              placeholder="e.g. 123"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={fetchSlips}>
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSlipNumber("");
                setSelectedSlipId(null);
                setSelectedSlip(null);
                fetchSlips();
              }}
            >
              Clear
            </button>
          </div>

          {loading ? (
            <p>Loading slips...</p>
          ) : slips.length === 0 ? (
            <p>No slips found.</p>
          ) : (
            <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #ddd", borderRadius: 4 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", top: 0, background: "#486882", textAlign: "left", padding: "6px" }}>
                      Slip #
                    </th>
                    <th style={{ position: "sticky", top: 0, background: "#486882", textAlign: "left", padding: "6px" }}>
                      Date
                    </th>
                    <th style={{ position: "sticky", top: 0, background: "#486882", textAlign: "left", padding: "6px" }}>
                      Client
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map((s) => (
                    <tr
                      key={s.id}
                      style={{
                        cursor: "pointer",
                        background: selectedSlipId === s.id ? "#a6d2f5" : "transparent",
                      }}
                      onClick={() => setSelectedSlipId(s.id)}
                    >
                      <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{s.slip_number}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>
                        {s.date?.slice(0, 10)}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>
                        {s.client?.name ?? `(client_id: ${s.client_id})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: editor */}
        <div style={{ flex: 1, minWidth: 420 }}>
          {!selectedSlip ? (
            <p>Select a slip to edit.</p>
          ) : (
            <SlipForm
              mode="edit"
              initialSlip={selectedSlip}
              onSaved={(updated) => {
                setSelectedSlip(updated);

                // also refresh list so you see updated info in table
                fetchSlips();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SlipSearchPage;
