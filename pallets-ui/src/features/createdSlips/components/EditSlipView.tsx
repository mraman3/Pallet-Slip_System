import React from "react";
import SlipForm from "../../slips/SlipForm";
import type { SlipWithRelations } from "../../../types/slipApi";

/**
 * Props for EditSlipView
 *
 * - slip: the slip being edited
 * - onBack: return to the search view
 * - onSaved: callback after successful save
 */
interface Props {
  slip: SlipWithRelations;
  onBack: () => void;
  onSaved: () => void;
}

/**
 * EditSlipView
 *
 * Responsibilities:
 * - Display the edit header for a specific slip
 * - Render the SlipForm in edit mode
 * - Provide navigation back to the search page
 *
 * Non-responsibilities:
 * - Fetching the slip
 * - Handling save logic
 * - Managing routing
 */
const EditSlipView: React.FC<Props> = ({ slip, onBack, onSaved }) => {
  return (
    <div>
      {/* Page title */}
      <h2>Edit Slip #{slip.slip_number}</h2>

      {/* Edit form */}
      <SlipForm
        mode="edit"
        initialSlip={slip}
        onSaved={onSaved}
      />

      {/* Navigation back to search */}
      <button
        type="button"
        style={{ marginTop: 12 }}
        onClick={onBack}
      >
        Back to Search
      </button>
    </div>
  );
};

export default EditSlipView;
