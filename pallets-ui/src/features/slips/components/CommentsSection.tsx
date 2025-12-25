import React from "react";
import "./css/CommentsSection.css"

/**Props for CommentsSection
 *
 * Responsibilities:
 * - Capture free-form slip comments
 *
 * Non-responsibilities:
 * - Validation
 * - Formatting                */
type Props = {
  comments1: string;
  setComments1: (value: string) => void;
  comments2: string;
  setComments2: (value: string) => void;
};

const CommentsSection: React.FC<Props> = ({
  comments1,
  setComments1,
  comments2,
  setComments2,
}) => {
  return (
    <fieldset className="comments-section">
      <legend>Comments</legend>

      <div className="field">
        <textarea
          rows={2}
          placeholder="Comments line 1"
          value={comments1}
          onChange={(e) => setComments1(e.target.value)}
        />
      </div>

      <div className="field">
        <textarea
          rows={2}
          placeholder="Comments line 2"
          value={comments2}
          onChange={(e) => setComments2(e.target.value)}
        />
      </div>
    </fieldset>
  );
};

export default CommentsSection;
