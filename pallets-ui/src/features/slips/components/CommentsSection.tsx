import React from "react";

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
    <fieldset style={{ marginBottom: 16 }}>
      <legend>Comments</legend>
      <div style={{ marginBottom: 8 }}>
        <textarea
          rows={2}
          style={{ width: "100%" }}
          placeholder="Comments line 1"
          value={comments1}
          onChange={(e) => setComments1(e.target.value)}
        />
      </div>
      <div>
        <textarea
          rows={2}
          style={{ width: "100%" }}
          placeholder="Comments line 2"
          value={comments2}
          onChange={(e) => setComments2(e.target.value)}
        />
      </div>
    </fieldset>
  );
};

export default CommentsSection;
